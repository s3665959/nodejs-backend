const db = require('../config/db'); // Ensure you are using the promise-based pool

const User = {
// Check if a user ID already exists
  async isDuplicate(userId) {
    const query = 'SELECT * FROM users WHERE userId = ?';
    const [rows] = await db.execute(query, [userId]);
    return rows.length > 0;
  },
  // Create a new user
  async create(user) {
    const query = 'INSERT INTO users (userId, name, phone) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [user.userId, user.name, user.phone]);
    return result;
  },

  // Get all users
  async getAll() {
    const query = 'SELECT * FROM users';
    const [rows] = await db.execute(query);
    return rows;
  },

  // Update a user
  async update(id, user) {
    const query = 'UPDATE users SET name = ?, phone = ? WHERE id = ?';
    const [result] = await db.execute(query, [user.name, user.phone, id]);
    return result;
  },

  // Delete a user
  async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result;
  },
};

module.exports = User;
