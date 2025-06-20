const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session');
const app = express();

// Middleware
app.use(express.json());
app.use(session({
    secret: 'skibidi',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}))

app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Route to return all dogs as JSON with size and owner's username
app.get('/api/dogs', async (req, res) => {
try {
    const [books] = await db.execute('SELECT dog_id, name, size, owner_id FROM Dogs');
    res.json(books);
} catch (err) {
    res.status(500).json({ error: 'Failed to fetch dog list' });
}
});


// Export the app instead of listening here
module.exports = app;