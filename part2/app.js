const express = require('express');
const path = require('path');
require('dotenv').config();
var mysql = require('mysql2/promise');
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

let db;



// Export the app instead of listening here
module.exports = app;