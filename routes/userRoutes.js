const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const db = require('../config/db'); // Import updated db.js
const userController = require('../controllers/userController');


// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploads in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Add data route

// Add spending data and calculate points
router.post('/transactions', upload.single('receiptPhoto'), async (req, res) => {
  try {
    const { timestamp, userId, branch, receiptNo, spendingValue } = req.body;

    if (!timestamp || !userId || !branch || !receiptNo || !spendingValue || !req.file) {
      return res.status(400).send({ error: 'All fields are required.' });
    }

    const parsedTimestamp = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
    const userCheckQuery = 'SELECT id FROM users WHERE userId = ?';
    const [userRows] = await db.execute(userCheckQuery, [userId]);

    if (userRows.length === 0) {
      return res.status(400).send({ error: 'User ID not registered.' });
    }

    const points = Math.floor(spendingValue / 25);
    const receiptPhotoUrl = `/uploads/${req.file.filename}`;

    // Insert the transaction record
    const insertQuery = `
      INSERT INTO transactions (userId, timestamp, type, branch, receiptPhotoUrl, receiptNo, spendingValue, points, details)
      VALUES (?, ?, 'spending', ?, ?, ?, ?, ?, 'Spending points added')
    `;
    await db.execute(insertQuery, [
      userId,
      parsedTimestamp,
      branch,
      receiptPhotoUrl,
      receiptNo,
      spendingValue,
      points,
    ]);

    res.status(201).send({ message: 'Points added successfully', points });
  } catch (error) {
    console.error('Error saving transaction:', error.message);
    res.status(500).send({ error: 'Failed to save transaction.', details: error.message });
  }
});


// Fetch all points data
router.get('/data', async (req, res) => {
  try {
    const query = 'SELECT * FROM data';
    const [rows] = await db.execute(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send({ error: 'Failed to fetch data' });
  }
});

// Update points data
router.put('/data/:id', async (req, res) => {
  const { id } = req.params;
  const { branch, receiptNo, spendingValue } = req.body;

  try {
    const points = Math.floor(spendingValue / 25); // Recalculate points
    const updateQuery = `
      UPDATE data 
      SET branch = ?, receiptNo = ?, spendingValue = ?, points = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(updateQuery, [branch, receiptNo, spendingValue, points, id]);

    if (result.affectedRows === 1) {
      res.status(200).send({ message: 'Data updated successfully' });
    } else {
      res.status(404).send({ error: 'Data not found' });
    }
  } catch (error) {
    console.error('Error updating data:', error.message);
    res.status(500).send({ error: 'Failed to update data' });
  }
});


// Fetch all users
router.get('/users', userController.getUsers);

// User registration route
router.post('/users/register', async (req, res) => {
  const { userId, name, phone } = req.body;

  if (!userId || !name || !phone) {
    return res.status(400).send({ error: 'Missing required fields' });
  }

  try {
    // Check if the userId already exists
    const checkDuplicateQuery = 'SELECT * FROM users WHERE userId = ?';
    const [existingUsers] = await db.execute(checkDuplicateQuery, [userId]);

    if (existingUsers.length > 0) {
      return res.status(400).send({ error: 'User ID already registered' });
    }

    // Insert the new user with initial totalSpending and totalPoints set to 0
    const sql = 'INSERT INTO users (userId, name, phone, totalSpending, totalPoints) VALUES (?, ?, ?, 0, 0)';
    const [result] = await db.execute(sql, [userId, name, phone]);

    if (result.affectedRows === 1) {
      console.log('User registered successfully:', { userId, name, phone });
      return res.status(201).send({ message: 'User registered successfully', id: result.insertId });
    } else {
      throw new Error('Failed to insert user into database');
    }
  } catch (error) {
    console.error('Error saving user to database:', error.message);
    res.status(500).send({ error: 'Failed to register user', details: error.message });
  }
});

// Update a user
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).send({ error: 'Missing required fields' });
  }

  try {
    const sql = 'UPDATE users SET name = ?, phone = ? WHERE id = ?';
    const [result] = await db.execute(sql, [name, phone, id]);

    if (result.affectedRows === 1) {
      console.log(`User with ID ${id} updated successfully.`);
      return res.status(200).send({ message: 'User updated successfully' });
    } else {
      return res.status(404).send({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).send({ error: 'Failed to update user', details: error.message });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM users WHERE id = ?';
    const [result] = await db.execute(sql, [id]);

    if (result.affectedRows === 1) {
      console.log(`User with ID ${id} deleted successfully.`);
      return res.status(200).send({ message: 'User deleted successfully' });
    } else {
      return res.status(404).send({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).send({ error: 'Failed to delete user', details: error.message });
  }
});


// Fetch user info
router.get('/user-info/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'spending' THEN spendingValue ELSE 0 END), 0) AS totalSpending,
        COALESCE(SUM(points), 0) AS totalPoints
      FROM transactions
      WHERE userId = ?
    `;
    const [rows] = await db.execute(query, [userId]);

    if (rows.length > 0) {
      res.status(200).send(rows[0]);
    } else {
      res.status(404).send({ error: 'User not found.' });
    }
  } catch (error) {
    console.error('Error fetching user info:', error.message);
    res.status(500).send({ error: 'Failed to fetch user info.', details: error.message });
  }
});

// Check if userId exists
router.get('/users/check/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const query = 'SELECT id FROM users WHERE userId = ?';
    const [rows] = await db.execute(query, [userId]);

    if (rows.length > 0) {
      return res.status(200).send({ message: 'User exists' });
    } else {
      return res.status(404).send({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error checking user existence:', error.message);
    res.status(500).send({ error: 'Failed to check user existence', details: error.message });
  }
});

// Redeem Points API
const { v4: uuidv4 } = require('uuid'); // Import UUID package

// Redeem Points API
router.post('/redeem', async (req, res) => {
  const { userId, promotionId, branch } = req.body;

  try {
    const [promotionRows] = await db.execute('SELECT * FROM promotions WHERE id = ?', [promotionId]);
    const promotion = promotionRows[0];
    if (!promotion || promotion.qty === 0) {
      return res.status(400).send({ error: 'Promotion is no longer available.' });
    }

    const pointsNeeded = promotion.pointsNeeded;
    const couponId = uuidv4();

    const [userPoints] = await db.execute(
      `SELECT COALESCE(SUM(points), 0) AS totalPoints FROM transactions WHERE userId = ?`,
      [userId]
    );

    if (userPoints[0].totalPoints < pointsNeeded) {
      return res.status(400).send({ error: 'Not enough points to redeem this promotion.' });
    }

    await db.execute('UPDATE promotions SET qty = qty - 1 WHERE id = ?', [promotionId]);

    const redeemQuery = `
      INSERT INTO transactions (userId, timestamp, type, branch, points, promotionId, couponId, status, details)
      VALUES (?, NOW(), 'redeem', ?, ?, ?, ?, 'valid', 'Points redeemed for promotion')
    `;
    await db.execute(redeemQuery, [userId, branch, -pointsNeeded, promotionId, couponId]);

    res.status(200).send({ message: 'Redemption successful.', couponId });
  } catch (error) {
    console.error('Error redeeming points:', error.message);
    res.status(500).send({ error: 'Failed to redeem points.', details: error.message });
  }
});



router.get('/user-coupons/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT 
        t.couponId, 
        t.status, 
        p.name, 
        p.description, 
        p.pointsNeeded, 
        p.startDate, 
        p.endDate, 
        p.imageUrl
      FROM transactions t
      JOIN promotions p ON t.promotionId = p.id
      WHERE t.userId = ? AND t.type = 'redeem'
    `;
    const [rows] = await db.execute(query, [userId]);

    res.status(200).send(rows);
  } catch (error) {
    console.error('Error fetching user coupons:', error.message);
    res.status(500).send({ error: 'Failed to fetch user coupons.', details: error.message });
  }
});


// Get coupon details
// Get coupon details
router.get('/coupon/:couponId', async (req, res) => {
  const { couponId } = req.params;

  try {
    const query = `
      SELECT 
        t.couponId, 
        t.status, 
        u.name AS userName, 
        p.name AS promotionName
      FROM transactions t
      JOIN users u ON t.userId = u.userId
      JOIN promotions p ON t.promotionId = p.id -- Updated to match correct column
      WHERE t.couponId = ?
    `;
    const [rows] = await db.execute(query, [couponId]);

    if (rows.length > 0) {
      res.status(200).send(rows[0]);
    } else {
      res.status(404).send({ error: 'Coupon not found.' });
    }
  } catch (error) {
    console.error('Error fetching coupon details:', error.message);
    res.status(500).send({ error: 'Failed to fetch coupon details.', details: error.message });
  }
});


// Update coupon status
router.put('/coupon-use/:couponId', async (req, res) => {
  const { couponId } = req.params;
  const { status, use_location } = req.body; // Include use_location in the request body

  try {
    const updateQuery = `
      UPDATE transactions 
      SET status = ?, use_location = ? 
      WHERE couponId = ?
    `;
    const [result] = await db.execute(updateQuery, [status, use_location, couponId]);

    if (result.affectedRows === 1) {
      return res.status(200).send({ message: 'Coupon status updated successfully.' });
    } else {
      return res.status(404).send({ error: 'Coupon not found.' });
    }
  } catch (error) {
    console.error('Error updating coupon status:', error.message);
    res.status(500).send({ error: 'Failed to update coupon status.', details: error.message });
  }
});





router.get('/transactions', async (req, res) => {
  try {
    const query = 'SELECT * FROM transactions';
    const [rows] = await db.execute(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).send({ error: 'Failed to fetch transactions.' });
  }
});



router.put('/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const {
    userId,
    timestamp,
    type,
    branch,
    receiptPhotoUrl,
    receiptNo,
    spendingValue,
    points,
    promotionId,
    couponId,
    status,
    details,
    use_location, // Add this field
  } = req.body;

  try {
    const updateQuery = `
      UPDATE transactions
      SET userId = ?, timestamp = ?, type = ?, branch = ?, receiptPhotoUrl = ?,
          receiptNo = ?, spendingValue = ?, points = ?, promotionId = ?, couponId = ?,
          status = ?, details = ?, use_location = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(updateQuery, [
      userId,
      timestamp,
      type,
      branch,
      receiptPhotoUrl,
      receiptNo,
      spendingValue,
      points,
      promotionId,
      couponId,
      status,
      details,
      use_location,
      id,
    ]);

    if (result.affectedRows === 1) {
      res.status(200).send({ message: 'Transaction updated successfully.' });
    } else {
      res.status(404).send({ error: 'Transaction not found.' });
    }
  } catch (error) {
    console.error('Error updating transaction:', error.message);
    res.status(500).send({ error: 'Failed to update transaction.', details: error.message });
  }
});


router.delete('/transactions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM transactions WHERE id = ?';
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 1) {
      res.status(200).send({ message: 'Transaction deleted successfully.' });
    } else {
      res.status(404).send({ error: 'Transaction not found.' });
    }
  } catch (error) {
    console.error('Error deleting transaction:', error.message);
    res.status(500).send({ error: 'Failed to delete transaction.' });
  }
});






module.exports = router;
