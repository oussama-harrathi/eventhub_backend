const express = require('express');
const router = express.Router();
const oracle = require('oracledb');

const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();
const nodemailer = require('nodemailer');
const dbConfig = require('../dbconfig');
const JWT_SECRET = process.env.JWT_SECRET;



function generateToken(userData) {
  return jwt.sign(
    {
      user_id: userData.user_id, 
      email: userData.email,
      full_name: userData.full_name
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function isValidEmail(email) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  return emailRegex.test(email);
}

function generateVerificationToken() {
  const token = crypto.randomBytes(16).toString('hex');
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 10); // Adds 1 day
  return { token, expiry };
  
  
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

async function sendEmail(email, subject, htmlContent) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.sendinblue.com",
      port: 587,
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    });

    const mailOptions = {
      from: 'oussamaharrathi@your-eventhub.site',
      to: email,
      subject: subject,
      html: htmlContent // Changed from text to html
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error in sending email: ", error);
    throw error; // Propagating the error to handle it in the caller function
  }
}

function getEmailVerificationTemplate(fullName, token) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background: #fff;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #444;
        }
        a.verify-button {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        a.verify-button:hover {
          background-color: #0056b3;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 0.9em;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Email Verification</h1>
        <p>Hi ${fullName},</p>
        <p>Thanks for signing up! Please verify your email address to activate your account.</p>
        <a href="http://your-eventhub.site/verify-email?token=${token}" class="verify-button">Verify Email</a>
        <p>If you did not create an account, no further action is required.</p>
        <div class="footer">
          <p>If you're having trouble clicking the "Verify Email" button, copy and paste the URL below into your web browser:</p>
          <p><a href="http://your-eventhub.site/verify-email?token=${token}">http://your-eventhub.site/verify-email?token=${token}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}


function getPasswordResetTemplate(token) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Password Reset</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        color: #333;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
        background: #fff;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      h1 {
        color: #444;
      }
      a.reset-button {
        display: inline-block;
        margin-top: 20px;
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
      }
      a.reset-button:hover {
        background-color: #0056b3;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 0.9em;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Password Reset Request</h1>
      <p>You recently requested to reset your password for your account. Click the button below to reset it.</p>
      <a href="http://your-eventhub.site/reset-password?token=${token}" class="reset-button">Reset Password</a>
      <p class="footer">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
  </body>
  </html>
  
  `;
}

router.post('/register', async (req, res) => {
  const { full_name, email, password, confirm_password } = req.body;
  const lowerCaseEmail = email.toLowerCase();

  if (!isValidEmail(lowerCaseEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  let connection;
  try {
    connection = await oracle.getConnection(dbConfig);
    const checkEmailSql = 'SELECT email FROM users WHERE email = :email';
    const emailResult = await connection.execute(checkEmailSql, [lowerCaseEmail], { outFormat: oracle.OBJECT });

    if (emailResult.rows.length > 0) {
      await connection.release();
      return res.status(400).json({ message: 'Email already in use' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const { token, expiry } = generateVerificationToken();

    const insertUserSql = `
      INSERT INTO users (full_name, email, password, verification_token, verification_token_expiry, email_verified)
      VALUES (:full_name, :email, :password, :verification_token, :verification_token_expiry, 0)
    `;

    await connection.execute(
      insertUserSql,
      {
        full_name,
        email: lowerCaseEmail,
        password: hashedPassword,
        verification_token: token,
        verification_token_expiry: expiry
      },
      { autoCommit: true }
    );

    const emailContent = getEmailVerificationTemplate(full_name, token);
    await sendEmail(lowerCaseEmail, 'Email Verification', emailContent);

    await connection.release();
    return res.status(201).json({ message: 'User registered successfully. Please check your email to verify.' });
  } catch (error) {
    console.error(error);
    if (connection) {
      await connection.release();
    }
    return res.status(500).json({ message: 'Error registering user' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await oracle.getConnection(dbConfig);

    const selectUserSql = `
      SELECT user_id, full_name, password, email_verified
      FROM users
      WHERE email = :email
    `;

    const result = await connection.execute(selectUserSql, [email], { outFormat: oracle.OBJECT });

    if (result.rows.length === 0) {
      connection.release();
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const hashedPassword = user.PASSWORD;

    if (user.EMAIL_VERIFIED === 0) {
      connection.release();
      return res.status(401).json({ message: 'Email not verified' });
    }

    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Include user_id in the token
    const token = generateToken({ user_id: user.USER_ID, email, full_name: user.FULL_NAME });
    connection.release();
    return res.status(200).json({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error('Login error:', error);
    connection.release();
    return res.status(500).json({ message: 'Error during login' });
  }
});


router.post('/api/auth/google-register', async (req, res) => {
  const { full_name, email, google_uid } = req.body;

  let connection;
  try {
    connection = await oracle.getConnection(dbConfig);

    // Query to check if the user already exists
    const checkUserSql = 'SELECT user_id, email FROM users WHERE email = :email';
    const userResult = await connection.execute(checkUserSql, [email], { outFormat: oracle.OBJECT });

    let userId;
    let token;

    if (userResult.rows.length > 0) {
      // User exists, generate token including user_id
      userId = userResult.rows[0].USER_ID;
      console.log("Existing user ID:", userId);
      token = generateToken({ user_id: userId, email, full_name });
      console.log("Generated token for existing user:", token);
      connection.release();
      return res.status(200).json({ message: 'User logged in successfully', token });
    } else {
      // User doesn't exist, create new user
      // Using RETURNING INTO to get the newly created user_id
      const insertUserSql = `
        INSERT INTO users (FULL_NAME, EMAIL, GOOGLE_UID, EMAIL_VERIFIED)
        VALUES (:full_name, :email, :google_uid, 1)
        RETURNING user_id INTO :userId
      `;
      const result = await connection.execute(
        insertUserSql,
        { full_name, email, google_uid, userId: { type: oracle.NUMBER, dir: oracle.BIND_OUT } },
        { autoCommit: true }
      );

      userId = result.outBinds.userId[0]; // Get the user_id of the newly created user
      token = generateToken({ user_id: userId, email, full_name });
      connection.release();
      return res.status(201).json({ message: 'User registered successfully', token });
    }
  } catch (error) {
    console.error('Error during Google user registration:', error);
    if (connection) connection.release();
    return res.status(500).json({ message: 'Error registering user' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    const connection = await oracle.getConnection(dbConfig);

    const verifySql = `
      UPDATE users
      SET email_verified = 1
      WHERE verification_token = :token AND email_verified = 0
    `;

    const result = await connection.execute(verifySql, [token], { autoCommit: true });

    connection.release();

    if (result.rowsAffected === 0) {
      return res.status(400).json({ message: 'Verification failed or link has expired.' });
    }

    return res.status(200).json({ message: 'Email successfully verified.' });
  } catch (error) {
    console.error(error);
    connection.release();
    return res.status(500).json({ message: 'Error during email verification.' });
  }
});
// Endpoint to request a password reset
router.post('/request-reset-password', async (req, res) => {
  const { email } = req.body;
  let connection;

  try {
    connection = await oracle.getConnection(dbConfig);
    const userSql = 'SELECT email FROM users WHERE email = :email';
    const userResult = await connection.execute(userSql, [email], { outFormat: oracle.OBJECT });

    if (userResult.rows.length > 0) {
      const resetToken = crypto.randomBytes(16).toString('hex');
      const updateSql = `
        UPDATE users
        SET password_reset_token = :resetToken, 
            password_reset_token_expiry = SYSDATE + 1/24
        WHERE email = :email
      `;
      await connection.execute(updateSql, [resetToken, email], { autoCommit: true });

      const emailContent = getPasswordResetTemplate(resetToken);
      await sendEmail(email, 'Password Reset', emailContent);
    }

    return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link. Check spam also' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error processing your request' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
});

// Endpoint to reset the password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const connection = await oracle.getConnection(dbConfig);
    const userSql = `
      SELECT email FROM users 
      WHERE password_reset_token = :token 
      AND password_reset_token_expiry > SYSDATE
    `;
    const userResult = await connection.execute(userSql, [token], { outFormat: oracle.OBJECT });

    if (userResult.rows.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = `
      UPDATE users
      SET password = :hashedPassword,
          password_reset_token = NULL,
          password_reset_token_expiry = NULL
      WHERE password_reset_token = :token
    `;
    await connection.execute(updateSql, [hashedPassword, token], { autoCommit: true });

    connection.release();
    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    connection.release();
    return res.status(500).json({ message: 'Error resetting password' });
  }
});


// Endpoint to change password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const email = req.user.email; // Extracted from token

  try {
    const connection = await oracle.getConnection(dbConfig);
    const selectUserSql = 'SELECT password FROM users WHERE email = :email';
    const result = await connection.execute(selectUserSql, [email], { outFormat: oracle.OBJECT });

    if (result.rows.length === 0) {
      connection.release();
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(oldPassword, user.PASSWORD);

    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = 'UPDATE users SET password = :hashedNewPassword WHERE email = :email';
    await connection.execute(updateSql, [hashedNewPassword, email], { autoCommit: true });

    connection.release();
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    connection.release();
    return res.status(500).json({ message: 'Error changing password' });
  }
});

module.exports = router;