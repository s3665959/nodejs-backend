const User = require('../models/userModel');

exports.createUser = async (req, res) => {
  const { userId, name, phone } = req.body;

  if (!userId || !name || !phone) {
    return res.status(400).send({ error: 'Missing required fields' });
  }

  try {
    // Check for duplicate userId
    const isDuplicate = await User.isDuplicate(userId);
    if (isDuplicate) {
      return res.status(400).send({ error: 'User ID already registered' });
    }

    const result = await User.create({ userId, name, phone });
    res.status(201).send({ id: result.insertId, userId, name, phone });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).send({ error: 'Failed to create user', details: error.message });
  }
};


exports.getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.status(200).send(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).send({ error: 'Failed to fetch users', details: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.body;
    const result = await User.update(id, user);

    if (result.affectedRows === 0) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.status(200).send({ id, ...user });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).send({ error: 'Failed to update user', details: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await User.delete(id);

    if (result.affectedRows === 0) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.status(200).send({ id });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).send({ error: 'Failed to delete user', details: error.message });
  }
};
