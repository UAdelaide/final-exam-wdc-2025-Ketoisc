const express = require('express');
const path = require('path');
require('dotenv').config();
var mysql = require('mysql2/promise');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
let db;
// Login
app.post('/api/users/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const [rows] = await db.execute("SELECT role FROM Users WHERE username = ? AND password_hash = ?", [username, password]);

      if (rows.length > 0) {
        res.json(rows[0].role);
      } else {
        res.status(401).json('No user found');
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  });

// Export the app instead of listening here
module.exports = app;