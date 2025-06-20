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

// Route to return summary of each walker as JSON
app.get('/api/walkers/summary', async (req, res) => {
    try {
      const [books] = await db.execute("SELECT user.username AS walker_username, (SELECT COUNT(*) FROM WalkRatings) AS total_ratings, AVG(rate.rating) AS average_rating, COUNT(DISTINCT rate.request_id) AS completed_walks FROM WalkRatings rate JOIN Users user ON user.user_id = rate.walker_id GROUP BY rate.walker_id");
      res.json(books);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch dog list' });
    }
  });

// Export the app instead of listening here
module.exports = app;