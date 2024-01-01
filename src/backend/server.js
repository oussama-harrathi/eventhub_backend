const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const oracle = require('oracledb');
const usersRouter = require('./controllers/users');
const eventsRouter = require('./controllers/events'); // Adjust the path as needed
const path = require('path');

// Configure middleware
app.use(cors()); // Place this line before other app.use statements
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
// Specify the allowed origins
const corsOptions = {
  origin: 'http://localhost:4200', // Replace with the origin of your Angular app
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200,
};

app.use('/users', cors(corsOptions), usersRouter); // This defines the base path for the users routes
app.use('/events',cors(corsOptions), eventsRouter);
const angularDistPath = path.join(__dirname, '../../../dist/event-hub');
app.use(express.static(angularDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(angularDistPath, 'index.html'));
});



const dbConfig = require('./dbconfig'); // Adjust the path as needed

oracle.initOracleClient({ libDir: 'C:\\instantclient_21_12' }); // Specify the Oracle Instant Client directory

oracle.getConnection(dbConfig, (err, connection) => {
  if (err) {
    console.error('Error connecting to Oracle database:', err);
  } else {
    console.log('Connected to Oracle database');
    // Save the connection for use in your route controllers
  }
});

// Set up Oracle database connection

// Define your routes (see step 3).

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
