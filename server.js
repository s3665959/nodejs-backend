const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes');
const promotionsRoutes = require('./routes/promotionsRoutes');
const staffRoutes = require('./routes/staffRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register routes
app.use('/api', userRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/staff', staffRoutes); // Mount staff routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).send({ error: 'An unexpected error occurred' });
});

// Start the server (HTTP only)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
