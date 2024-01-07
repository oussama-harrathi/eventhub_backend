const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const oracle = require('oracledb');
const usersRouter = require('./controllers/users');
const eventsRouter = require('./controllers/events'); 
const path = require('path');



 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

const corsOptions = {
  origin: 'https://deluxe-sundae-3987e9.netlify.app', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  
};
app.use(cors());

app.use('/users', usersRouter); 
app.use('/events', eventsRouter);




const dbConfig = require('./dbconfig'); 

 

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
