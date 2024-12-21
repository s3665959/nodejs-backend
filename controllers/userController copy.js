const User = require('../models/userModel');

exports.createUser = async (req, res) => {
  try {
    const user = req.body;
    const result = await User.create(user);
    res.status(201).send({ id: result.insertId, ...user });
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
