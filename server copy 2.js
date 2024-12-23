const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');

// Import routes
const userRoutes = require('./routes/userRoutes');
const promotionsRoutes = require('./routes/promotionsRoutes');
const staffRoutes = require('./routes/staffRoutes');

const app = express();

// Load SSL Certificates
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/811544.xyz/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/811544.xyz/fullchain.pem'),
};

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

// Start the server
// Start HTTPS Server
const PORT = 3000;
https.createServer(options, app).listen(PORT, () => {
  console.log(`Secure server running at https://811544.xyz:${PORT}`);
});