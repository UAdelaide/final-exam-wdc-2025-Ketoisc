const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Login
app.post('/api/users/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const [role] = await db.execute("SELECT role FROM Users WHERE username = ? AND password_hash = ?", [username, password]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  });

// Export the app instead of listening here
module.exports = app;