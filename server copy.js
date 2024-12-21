const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes'); // User routes
const promotionsRoutes = require('./routes/promotionsRoutes'); // Promotions routes
const staffRoutes = require('./routes/staffRoutes'); // Staff routes



const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from uploads folder


// Register routes
app.use('/api', userRoutes); // Mount user routes under /api
app.use('/api/promotions', promotionsRoutes); // Mount promotions routes under /api/promotions
app.use('/api/staff', staffRoutes); // Mount staff routes under /api/staff


// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).send({ error: 'An unexpected error occurred' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
