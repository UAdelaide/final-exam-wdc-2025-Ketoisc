var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


(async () => {
    try {
      // Connect to MySQL without specifying a database
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '' // Set your MySQL root password
      });

      // Create the database if it doesn't exist
      await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
      await connection.end();

      // Now connect to the created database
      db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'DogWalkService'
      });

      // Create a table if it doesn't exist
      await db.execute(`
        CREATE TABLE IF NOT EXISTS Users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('owner', 'walker') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS Dogs (
            dog_id INT AUTO_INCREMENT PRIMARY KEY,
            owner_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            size ENUM('small', 'medium', 'large') NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES Users(user_id)
        );

        CREATE TABLE IF NOT EXISTS WalkRequests (
            request_id INT AUTO_INCREMENT PRIMARY KEY,
            dog_id INT NOT NULL,
            requested_time DATETIME NOT NULL,
            duration_minutes INT NOT NULL,
            location VARCHAR(255) NOT NULL,
            status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
        );

        CREATE TABLE IF NOT EXISTS WalkApplications (
            application_id INT AUTO_INCREMENT PRIMARY KEY,
            request_id INT NOT NULL,
            walker_id INT NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
            FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
            FOREIGN KEY (walker_id) REFERENCES Users(user_id),
            CONSTRAINT unique_application UNIQUE (request_id, walker_id)
        );

        CREATE TABLE IF NOT EXISTS WalkRatings (
            rating_id INT AUTO_INCREMENT PRIMARY KEY,
            request_id INT NOT NULL,
            walker_id INT NOT NULL,
            owner_id INT NOT NULL,
            rating INT CHECK (rating BETWEEN 1 AND 5),
            comments TEXT,
            rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
            FOREIGN KEY (walker_id) REFERENCES Users(user_id),
            FOREIGN KEY (owner_id) REFERENCES Users(user_id),
            CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
        );
      `);


      // Insert data if table is empty
      var [rows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
      if (rows[0].count === 0) {
        await db.execute(`
        INSERT INTO Users (username, email, password_hash, role)
        VALUES ('alice123', 'alice@example.com', 'hashed123', 'owner'), ('bobwalker', 'bob@example.com', 'hashed456', 'walker'), ('carol123', 'carol@example.com', 'hashed789', 'owner'), ('brooke3', 'brooke@example.com', 'password123', 'owner'), ('irene45', 'irene@example.com', 'pass123', 'walker');
        `)
      }
      var [rows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
      if (rows[0].count === 0) {
        await db.execute(`
        INSERT INTO Dogs (owner_id, name, size)
        VALUES ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'), ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'), ((SELECT user_id FROM Users WHERE username = 'brooke3'), 'Kai', 'large'), ((SELECT user_id FROM Users WHERE username = 'brooke3'), 'Martin', 'small'), ((SELECT user_id FROM Users WHERE username = 'brooke3'), 'Grace', 'medium');
        `)
      }
      var [rows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
      if (rows[0].count === 0) {
        await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
        VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'), ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'), ((SELECT dog_id FROM Dogs WHERE name = 'Kai'), '2025-06-11 09:30:00', 30, 'Happy Ave', 'open'), ((SELECT dog_id FROM Dogs WHERE name = 'Martin'), '2025-06-12 09:30:00', 30, 'Sad Ave', 'accepted'), ((SELECT dog_id FROM Dogs WHERE name = 'Kai'), '2025-06-16 09:30:00', 30, 'Avenue Ave', 'open');
        `);
      }
    } catch (err) {
      console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
    }
  })();

  // Route to return all dogs as JSON with size and owner's username
  app.get('/api/dogs', async (req, res) => {
    try {
      const [books] = await db.execute('SELECT dog.dog_name, dog.size, user.username AS owner_username FROM Dogs dog JOIN Users user ON dog.owner_id = user.user_id');
      res.json(books);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch dog list' });
    }
  });

  // Route to return all open walk requests as JSON
  app.get('/api/walkrequests/open', async (req, res) => {
    try {
      const [books] = await db.execute("SELECT req.request_id, dog.name AS dog_name, req.requested_time, req.duration_minutes, req.location, user.username AS owner_username FROM WalkRequests req JOIN Dogs dog ON req.dog_id = dog.dog_id JOIN Users user ON dog.owner_id = user.user_id WHERE req.status = 'open'");
      res.json(books);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch dog list' });
    }
  });

// Route to return summary of each walker as JSON
  app.get('/api/walkers/summary', async (req, res) => {
    try {
      const [books] = await db.execute("SELECT user.username AS walker_username, (SELECT COUNT(*) FROM WalkRatings) AS total_ratings, AVG(rate.rating) AS average_rating, COUNT(DISTINCT rate.request_id) AS completed_walks FROM WalkRatings rate JOIN Users user ON user.user_id = rate.walker_id GROUP BY ");
      res.json(books);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch dog list' });
    }
  });


module.exports = app;
