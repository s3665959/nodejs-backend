// staffRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Database connection
const router = express.Router();


const JWT_SECRET = "4e8b093df53b9c8e01f7580ae4b56c4e6f8b25c9a5b0f54720cc8f4c8b2f7e7e37a2138c9bfb5fa93818e1d839dbce7e8c";

// Register a new staff member
router.post('/register', async (req, res) => {
  const { name, password, location, role } = req.body;

  if (!name || !password || !location || !role) {
    return res.status(400).send({ error: "All fields are required" });
  }

  try {
    // Check if staff already exists
    const checkQuery = 'SELECT * FROM staff WHERE name = ?';
    const [existingStaff] = await db.execute(checkQuery, [name]);
    if (existingStaff.length > 0) {
      return res.status(400).send({ error: "Staff with this name already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const sql = 'INSERT INTO staff (name, password, location, role, timestamp) VALUES (?, ?, ?, ?, NOW())';
    const [result] = await db.execute(sql, [name, hashedPassword, location, role]);

    if (result.affectedRows === 1) {
      res.status(201).send({ message: "Staff registered successfully" });
    } else {
      throw new Error("Failed to register staff");
    }
  } catch (error) {
    console.error("Error registering staff:", error.message);
    res.status(500).send({ error: "Failed to register staff" });
  }
});

// Staff login
router.post('/login', async (req, res) => {
    const { name, password } = req.body;
  
    if (!name || !password) {
      return res.status(400).send({ error: "All fields are required" });
    }
  
    try {
      const sql = 'SELECT * FROM staff WHERE name = ?';
      const [rows] = await db.execute(sql, [name]);
  
      if (rows.length === 0) {
        return res.status(401).send({ error: "Invalid credentials" });
      }
  
      const staff = rows[0];
      const isPasswordValid = await bcrypt.compare(password, staff.password);
  
      if (!isPasswordValid) {
        return res.status(401).send({ error: "Invalid credentials" });
      }
  
      const token = jwt.sign(
        { id: staff.id, name: staff.name, role: staff.role, location: staff.location },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
  
      // Send the staff name explicitly here
      res.status(200).send({ 
        message: "Login successful", 
        token, 
        role: staff.role, 
        name: staff.name // Explicitly send the name
      });
    } catch (error) {
      console.error("Error logging in:", error.message);
      res.status(500).send({ error: "Failed to log in" });
    }
  });

// Fetch all staff members

router.get('/', async (req, res) => {
    try {
      const query = 'SELECT id, name, location, role, timestamp FROM staff';
      const [rows] = await db.execute(query);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching staff:', error.message);
      res.status(500).send({ error: 'Failed to fetch staff.' });
    }
  });
  
  
// Update staff member
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, location, role } = req.body;
  
    try {
      const query = 'UPDATE staff SET name = ?, location = ?, role = ? WHERE id = ?';
      const [result] = await db.execute(query, [name, location, role, id]);
  
      if (result.affectedRows === 1) {
        res.status(200).send({ message: 'Staff updated successfully.' });
      } else {
        res.status(404).send({ error: 'Staff member not found.' });
      }
    } catch (error) {
      console.error('Error updating staff:', error.message);
      res.status(500).send({ error: 'Failed to update staff.' });
    }
  });
  
  // Delete staff member
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const query = 'DELETE FROM staff WHERE id = ?';
      const [result] = await db.execute(query, [id]);
  
      if (result.affectedRows === 1) {
        res.status(200).send({ message: 'Staff deleted successfully.' });
      } else {
        res.status(404).send({ error: 'Staff member not found.' });
      }
    } catch (error) {
      console.error('Error deleting staff:', error.message);
      res.status(500).send({ error: 'Failed to delete staff.' });
    }
  });
  
  

module.exports = router;
