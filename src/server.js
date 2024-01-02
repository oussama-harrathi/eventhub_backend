const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const oracle = require('oracledb');
const usersRouter = require('./controllers/users');
const eventsRouter = require('./controllers/events'); // Adjust the path as needed
const path = require('path');


// Configure middleware
 // Place this line before other app.use statements
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
// Specify the allowed origins
const corsOptions = {
  origin: 'https://deluxe-sundae-3987e9.netlify.app', // Replace with the origin of your Angular app
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  
};
app.use(cors(corsOptions));

app.use('/users', usersRouter); // This defines the base path for the users routes
app.use('/events', eventsRouter);




const dbConfig = require('./dbconfig'); // Adjust the path as needed

 // Specify the Oracle Instant Client directory

oracle.getConnection(dbConfig, (err, connection) => {
  if (err) {
    console.error('Error connecting to Oracle database:', err);
  } else {
    console.log('Connected to Oracle database');
    
  }
});





// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
