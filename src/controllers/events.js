const express = require('express');
const router = express.Router();

const app = express();
const oracle = require('oracledb');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const stream = require('stream');


const fs = require('fs');
const jwt = require('jsonwebtoken'); // Make sure JWT is imported
const dbConfig = require('../dbconfig');
const { error } = require('console');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')('sk_test_51OPotvDshEHShaBlnxjFEqjVYWHpLnyeauJC0dIzoOzhlAuNu4yZaiTEcdaHHiQzJQH6MbfLTbCOBj88Oalv4WyZ00RXzGAjeB');
const paypal = require('@paypal/payouts-sdk');

const JWT_SECRET = process.env.JWT_SECRET || "32jkJDF93@#fjJKH*#(kd0932JK@#Jfj2f3";
const storage = new Storage({ keyFilename: '../../uploads/eventhub-404818-1eb1f209a523.json' });

const bucketName = 'EventHub_bucket';
const upload = multer();




const transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    secure: false, 
    auth: {
      user: "oussamaharrathi@your-eventhub.site",
      pass: "Rpn1a45gBPW8IXOt"
    }
  });

  let environment = new paypal.core.SandboxEnvironment('AYpGapUZnvR6rxaGpqU9ToFnMFwr1JwpOy5D5svJCkoSedH_gwMa_brdUmi4Lfjv0gp2iSvq2Aizcscy', 'EGjKxv_g5pGSHQpWBE50HpsrHzgg9u141AXvR3_rzEl2boWEHdNJJ-KAiYejSllEaS49YSypQ87hANzY');
let client = new paypal.core.PayPalHttpClient(environment);
  

// JWT authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log("Auth Header:", authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Received token:", token);

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        console.log("Decoded user:", user);
        next();
    });
}
async function clobToString(clob) {
    return new Promise((resolve, reject) => {
      let result = '';
      clob.setEncoding('utf8');
      clob.on('data', chunk => result += chunk);
      clob.on('end', () => resolve(result));
      clob.on('error', err => reject(err));
    });
  }
  
  

  router.post('/create',upload.none(), authenticateToken, async (req, res) => {
    const { eventName, eventDate, eventTime, location, description, category, allowedTicketsNumber, price, eventPictureUrl } = req.body;
    console.log(eventName, eventDate, eventTime, location, description, category, allowedTicketsNumber, price, eventPictureUrl);

    const organizerId = req.user.user_id; // Ensure this is correctly obtained from your authentication middleware

    let connection;
    try {
        connection = await oracle.getConnection(dbConfig);

        // Prepare SQL query for inserting event data
        const insertEventSql = `
            INSERT INTO events (ORGANIZER_ID, EVENT_NAME, EVENT_DATE, EVENT_TIME, LOCATION, DESCRIPTION, CATEGORY, EVENT_PICTURE, ALLOWED_TICKETS_NUMBER, PRICE)
            VALUES (:organizerId, :eventName, TO_DATE(:eventDate, 'YYYY-MM-DD'), TO_DATE(:eventTime, 'HH24:MI'), :location, :description, :category, :eventPictureUrl, :allowedTicketsNumber, :price)
        `;

        // Execute the SQL query
        await connection.execute(
            insertEventSql,
            {
              organizerId: organizerId, 
              eventName: eventName, 
              eventDate: eventDate, 
              eventTime: eventTime, 
              location: location, 
              description: description, 
              category: category, 
              eventPictureUrl: eventPictureUrl, 
              allowedTicketsNumber: allowedTicketsNumber, 
              price: price
            },
            { autoCommit: true }
          );

        // Send success response
        res.status(201).json({ message: 'Event created successfully' });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    } finally {
        // Release the database connection
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});




router.get('/all', async (req, res) => {
    let connection;
    try {
        connection = await oracle.getConnection(dbConfig);
        const query = `SELECT EVENT_ID, ORGANIZER_ID, EVENT_NAME, EVENT_DATE, EVENT_TIME, LOCATION, DESCRIPTION, CATEGORY, EVENT_PICTURE, ALLOWED_TICKETS_NUMBER, PRICE FROM events WHERE EVENT_DATE >= SYSDATE`;

        const result = await connection.execute(query, [], { outFormat: oracle.OBJECT });

        const eventsPromises = result.rows.map(async event => {
            let description = '';
            if (event.DESCRIPTION) {
                description = await clobToString(event.DESCRIPTION);
            }

            return {
                eventId: event.EVENT_ID,
                organizerId: event.ORGANIZER_ID,
                eventName: event.EVENT_NAME,
                eventDate: event.EVENT_DATE,
                eventTime: event.EVENT_TIME,
                location: event.LOCATION,
                description,
                category: event.CATEGORY,
                eventPicture: event.EVENT_PICTURE, // URL of the image in Google Cloud Storage
                allowedTicketsNumber: event.ALLOWED_TICKETS_NUMBER,
                price: event.PRICE
            };
        });

        const events = await Promise.all(eventsPromises);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});



router.get('/search', async (req, res) => {
    const searchTerm = req.query.term;
    console.log('Search Term:', searchTerm);
    let connection;

    try {
        connection = await oracle.getConnection(dbConfig);
        const query = `
            SELECT EVENT_ID, ORGANIZER_ID, EVENT_NAME, EVENT_DATE, EVENT_TIME, LOCATION, DESCRIPTION, CATEGORY, EVENT_PICTURE, ALLOWED_TICKETS_NUMBER, PRICE
            FROM events 
            WHERE LOWER(EVENT_NAME) LIKE LOWER(:searchTerm)
        `;

        const result = await connection.execute(query, [`%${searchTerm}%`], { outFormat: oracle.OBJECT });

        const eventsPromises = result.rows.map(async event => {
            let description = '';
            if (event.DESCRIPTION) {
                description = await clobToString(event.DESCRIPTION);
            }

            

            return {
                eventId: event.EVENT_ID,
                organizerId: event.ORGANIZER_ID,
                eventName: event.EVENT_NAME,
                eventDate: event.EVENT_DATE,
                eventTime: event.EVENT_TIME,
                location: event.LOCATION,
                description,
                category: event.CATEGORY,
                eventPicture: event.EVENT_PICTURE,
                allowedTicketsNumber: event.ALLOWED_TICKETS_NUMBER,
                price:event.PRICE
            };
        });

        const events = await Promise.all(eventsPromises);
        res.json(events);
    } catch (error) {
        console.error('Error searching events:', error);
        res.status(500).json({ message: 'Error searching events' });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});


router.post('/purchaseTicket', authenticateToken, async (req, res) => {
    const userId = req.user.user_id; // Extracted from token
    const { eventId, ticketQuantity } = req.body;
    let connection;

    try {
        connection = await oracle.getConnection(dbConfig);

        // Check available tickets
        const checkTicketsSql = `SELECT ALLOWED_TICKETS_NUMBER, EVENT_NAME, EVENT_DATE, EVENT_TIME FROM events WHERE EVENT_ID = :eventId`;
        const result = await connection.execute(checkTicketsSql, [eventId], { outFormat: oracle.OBJECT });

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const availableTickets = result.rows[0].ALLOWED_TICKETS_NUMBER;
        const eventName = result.rows[0].EVENT_NAME;
        const eventDate = new Date(result.rows[0].EVENT_DATE).toISOString().split('T')[0]; // yyyy-mm-dd format
        const eventTime = new Date(result.rows[0].EVENT_TIME).toTimeString().split(' ')[0].substring(0, 5); // HH:mm format

        if (ticketQuantity > availableTickets) {
            return res.status(400).json({ message: 'Not enough tickets available' });
        }

        // Create a new PDF document
        const doc = new PDFDocument();
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        // Generate ticket details and QR codes for PDF
        for (let i = 0; i < ticketQuantity; i++) {
            const createTicketSql = `INSERT INTO tickets (EVENT_ID, USER_ID, TICKET_TYPE) VALUES (:eventId, :userId, 'Standard') RETURNING TICKET_ID INTO :newTicketId`;
            const ticketResult = await connection.execute(createTicketSql, 
                { eventId: eventId, userId: userId, newTicketId: { type: oracle.NUMBER, dir: oracle.BIND_OUT } },
                { autoCommit: false }
            );

            const newTicketId = ticketResult.outBinds.newTicketId[0];
            const ticketData = { ticketId: newTicketId, eventId: eventId, userId: userId };
            const qrCodeData = JSON.stringify(ticketData);
            const qrCodeURL = await QRCode.toDataURL(qrCodeData);

            const yOffset = i * 190; // Adjust this value to change the vertical spacing between tickets

            doc.fontSize(12).font('Helvetica-Bold').text(`Ticket #${i + 1}: ${eventName}`, 50, 50 + yOffset, { align: 'left' });
            doc.fontSize(10).font('Helvetica').text(`Date: ${eventDate}`, 50, 70 + yOffset, { align: 'left' });
            doc.fontSize(10).font('Helvetica').text(`Time: ${eventTime}`, 50, 90 + yOffset, { align: 'left' });
            doc.fontSize(10).text(`Ticket ID: ${newTicketId}`, 50, 110 + yOffset, { align: 'left' });
            doc.image(qrCodeURL, 50, 130 + yOffset, { fit: [100, 100] });

            if (i < ticketQuantity - 1) {
                doc.moveDown(4); // Adjust this value to increase or decrease the space between tickets
            }
        }

        // Finalize PDF file
        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            const userEmailAddress = req.user.email; // Fetch or define the user's email

            let mailOptions = {
                from: 'oussamaharrathi@your-eventhub.site',
                to: userEmailAddress,
                subject: 'Your Event Tickets',
                attachments: [{
                    filename: 'tickets.pdf',
                    content: pdfData
                }]
            };

            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.error('Email sending error:', error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        });
        doc.end();

        // Update ticket availability
        const updateTicketsSql = `UPDATE events SET ALLOWED_TICKETS_NUMBER = ALLOWED_TICKETS_NUMBER - :ticketQuantity WHERE EVENT_ID = :eventId`;
        await connection.execute(updateTicketsSql, [ticketQuantity, eventId], { autoCommit: false });

        // Commit transaction
        await connection.commit();

        res.json({ message: 'Tickets purchased successfully' });
    } catch (error) {
        console.error('Error purchasing tickets:', error);
        await connection.rollback(); // Rollback in case of error
        res.status(500).json({ message: 'Error purchasing tickets' });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});


router.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            // additional parameters
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
});


router.get('/hasTicket/:eventId', authenticateToken, async (req, res) => {
    const userId = req.user.user_id; // Extracted from the token
    
    const eventId = req.params.eventId;

    let connection;
    try {
        connection = await oracle.getConnection(dbConfig);
        const query = `SELECT COUNT(*) AS ticket_count FROM tickets WHERE USER_ID = :userId AND EVENT_ID = :eventId`;
        
        const result = await connection.execute(query, [userId, eventId], { outFormat: oracle.OBJECT });
        const hasTicket = result.rows[0].TICKET_COUNT > 0;

        res.json({ hasTicket });
    } catch (error) {
        console.error('Error verifying ticket:', error);
        res.status(500).json({ message: 'Error verifying ticket' });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});

// Route to get events created by the logged-in user
router.get('/created-by-user', authenticateToken, async (req, res) => {
    const organizerId = req.user.user_id;
    let connection;

    try {
        connection = await oracle.getConnection(dbConfig);
        const query = `
            SELECT 
                e.EVENT_ID, 
                e.EVENT_NAME, 
                e.EVENT_DATE, 
                e.EVENT_TIME, 
                e.LOCATION, 
                e.DESCRIPTION, 
                e.CATEGORY, 
                e.EVENT_PICTURE, 
                e.ALLOWED_TICKETS_NUMBER,
                e.PRICE,
                (SELECT COUNT(*) FROM tickets WHERE EVENT_ID = e.EVENT_ID) AS TICKETS_SOLD, 
                (SELECT COUNT(*) FROM tickets WHERE EVENT_ID = e.EVENT_ID) * e.PRICE AS TOTAL_EARNINGS
            FROM events e
            WHERE e.ORGANIZER_ID = :organizerId
        `;

        const result = await connection.execute(query, [organizerId], { outFormat: oracle.OBJECT });

        const eventsPromises = result.rows.map(async event => {
            let description = '';
            if (event.DESCRIPTION) {
                description = await clobToString(event.DESCRIPTION);
            }

            

            return {
                eventId: event.EVENT_ID,
                eventName: event.EVENT_NAME,
                eventDate: event.EVENT_DATE,
                eventTime: event.EVENT_TIME,
                location: event.LOCATION,
                description,
                category: event.CATEGORY,
                eventPicture: event.EVENT_PICTURE,
                allowedTicketsNumber: event.ALLOWED_TICKETS_NUMBER,
                price: event.PRICE,
                ticketsSold: event.TICKETS_SOLD,
                totalEarnings: event.TOTAL_EARNINGS
            };
        });

        const events = await Promise.all(eventsPromises);
        res.json(events);
    } catch (error) {
        console.error('Error fetching created events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});



router.get('/:id', async (req, res) => {
    const eventId = req.params.id;
    let connection;

    try {
        connection = await oracle.getConnection(dbConfig);
        const query = `
            SELECT * FROM events WHERE EVENT_ID = :eventId
        `;

        const result = await connection.execute(query, [eventId], { outFormat: oracle.OBJECT });

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const event = result.rows[0];
        let description = '';
        if (event.DESCRIPTION) {
            description = await clobToString(event.DESCRIPTION);
        }

       

        const eventDetails = {
            eventId: event.EVENT_ID,
            organizerId: event.ORGANIZER_ID,
            eventName: event.EVENT_NAME,
            eventDate: event.EVENT_DATE,
            eventTime: event.EVENT_TIME,
            location: event.LOCATION,
            description,
            category: event.CATEGORY,
            eventPicture: event.EVENT_PICTURE,
            allowedTicketsNumber: event.ALLOWED_TICKETS_NUMBER,
            price: event.PRICE
        };

        res.json(eventDetails);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event' });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});


router.post('/create-payout', async (req, res) => {
    const { amount, receiver } = req.body; // Amount and recipient's PayPal email
  
    const request = new paypal.payouts.PayoutsPostRequest();
    request.requestBody({
      sender_batch_header: {
        email_subject: 'You have a payout!',
        email_message: 'You have received a payout! Thanks for using our service!'
      },
      items: [{
        recipient_type: 'EMAIL',
        amount: {
          value: amount,
          currency: 'USD'
        },
        receiver: receiver,
        note: 'Event payout',
        sender_item_id: 'EventPayout' // A unique identifier for tracking payouts
      }]
    });
  
    try {
      const response = await client.execute(request);
      res.json({ status: 'success', details: response.result });
    } catch (err) {
      res.status(500).send({ status: 'error', message: err.message });
    }
  });
module.exports = router;
