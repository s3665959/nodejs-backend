const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db'); // Import database connection
const router = express.Router();

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

// Add a promotion
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, pointsNeeded, qty, startDate, endDate } = req.body;

    if (!name || !pointsNeeded || !qty || !startDate || !endDate || !req.file) {
      return res.status(400).send({ error: 'All fields are required.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const sql = `
      INSERT INTO promotions (name, description, pointsNeeded, qty, startDate, endDate, imageUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      name,
      description,
      pointsNeeded,
      qty,
      startDate,
      endDate,
      imageUrl,
    ]);

    if (result.affectedRows === 1) {
      return res.status(201).send({ message: 'Promotion added successfully' });
    } else {
      throw new Error('Failed to insert promotion.');
    }
  } catch (error) {
    console.error('Error adding promotion:', error.message);
    res.status(500).send({ error: 'Failed to add promotion', details: error.message });
  }
});

// Fetch all promotions
// Helper function to format dates as DD/MM/YYYY
const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
// Helper function to format dates as DD/MM/YYYY
const formatDateForClient = (isoDate) => {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`; // Default to database format
};

// Fetch all promotions
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM promotions';
    const [promotions] = await db.execute(sql);

    const formattedPromotions = promotions.map((promotion) => ({
      ...promotion,
      startDate: formatDateForClient(promotion.startDate),
      endDate: formatDateForClient(promotion.endDate),
    }));

    res.status(200).send(formattedPromotions);
  } catch (error) {
    console.error('Error fetching promotions:', error.message);
    res.status(500).send({ error: 'Failed to fetch promotions' });
  }
});

  

// Delete a promotion
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sql = 'DELETE FROM promotions WHERE id = ?';
    const [result] = await db.execute(sql, [id]);

    if (result.affectedRows === 1) {
      return res.status(200).send({ message: 'Promotion deleted successfully' });
    } else {
      return res.status(404).send({ error: 'Promotion not found' });
    }
  } catch (error) {
    console.error('Error deleting promotion:', error.message);
    res.status(500).send({ error: 'Failed to delete promotion', details: error.message });
  }
});

// Edit a promotion
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    let { name, description, pointsNeeded, qty, startDate, endDate } = req.body;
  
    try {
      // Convert ISO date strings to 'YYYY-MM-DD' format
      startDate = new Date(startDate).toISOString().split('T')[0];
      endDate = new Date(endDate).toISOString().split('T')[0];
  
      const sql = `
        UPDATE promotions 
        SET name = ?, description = ?, pointsNeeded = ?, qty = ?, startDate = ?, endDate = ? 
        WHERE id = ?
      `;
      const [result] = await db.execute(sql, [
        name,
        description,
        pointsNeeded,
        qty,
        startDate,
        endDate,
        id,
      ]);
  
      if (result.affectedRows === 1) {
        return res.status(200).send({ message: 'Promotion updated successfully' });
      } else {
        return res.status(404).send({ error: 'Promotion not found' });
      }
    } catch (error) {
      console.error('Error updating promotion:', error.message);
      res.status(500).send({ error: 'Failed to update promotion', details: error.message });
    }
  });
  
  

module.exports = router;
