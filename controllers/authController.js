require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcrypt');

const { capitalizeFirstLetter } = require('../utils/stringUtils');
const { saveOTP, verifyOTP, deleteOTP } = require('../services/otpService');
const { sendMail } = require('../services/mailer');
const { generateToken } = require('../services/jwtService');

// Success Google login
exports.successGoogleLogin = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('/auth/failure');
    }

    // Check if the user is blocked
    const user = await User.findOne({ email: req.user.email });
    if (user.status === 'Blocked') {
      return res.render('user/login', { errorMessage: 'Your account has been blocked, please contact support' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Store the token in a cookie
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    // Redirect to home page
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.redirect('/auth/failure');
  }
};

exports.failureGoogleLogin = (req, res) => {
  res.render('user/login', { errorMessage: 'Login failed.' });
};

// Render register page
exports.loadRegister = async (req, res) => {
  try {
    res.render('user/register', { title: "be.sky" });
  } catch (error) {
    console.error(error);
  }
};

// Register a new user
exports.register = async (req, res) => {
  let { firstName, lastName, email, password } = req.body;

  // Capitalize the first letter of the names
  firstName = capitalizeFirstLetter(firstName);
  lastName = capitalizeFirstLetter(lastName);

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.render('user/register', { errorMessage: 'User already exists' });
    }

    // Generate OTP
    const otp = await saveOTP(email);

    // Send OTP email
    const emailContent = `
      <p>Dear ${firstName},</p>
      <p>Thank you for registering with be.sky. Please verify your email using the following OTP:</p>
      <h3>${otp}</h3>
      <p>This OTP is valid for the next 15 minutes.</p>
    `;
    await sendMail(email, 'OTP Verification', emailContent);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Store user data in session
    req.session.user = { firstName, lastName, email, password: hashedPassword };

    res.render('user/verifyOTP', { message: `We have shared a OTP to your registered email address <br> <strong>${req.session.user.email}</strong>` });
  } catch (error) {
    console.error('Error during registration:', error);
    res.render('user/register', { errorMessage: 'Registration failed, please try again' });
  }
};

// Render OTP verification page
exports.loadVerify = async (req, res) => {
  
  try {
    res.render('user/verifyOTP');
  } catch (error) {
    console.error('Error rendering OTP verification page:', error);
  }
};

// Verify OTP and create a new user
exports.verifyOTP = async (req, res) => {
  const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
  const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

  try {
    // Check if user data exists in session
    if (!req.session.user) {
      return res.render('user/verifyOTP', { errorMessage: 'Session expired. Please register again.' });
    }

    // Fetch user data from session
    const { firstName, lastName, email, password } = req.session.user;

    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.render('user/verifyOTP', { errorMessage: 'Invalid or expired OTP' });
    }

    // Create user record
    const user = new User({ firstName, lastName, email, password });
    await user.save();

    // Delete OTP record
    await deleteOTP(email, otp);

    // Clear the session
    req.session.user = null;

    // Generate JWT token
    const token = generateToken(user);

    // Store the token in a cookie
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    res.redirect('/');
  } catch (error) {
    console.error('Error during OTP verification:', error);
    res.render('user/verifyOTP', { errorMessage: 'An error occurred' });
  }
};


// Render login page
exports.loadLogin = async (req, res) => {
  try {
    res.render('user/login');
  } catch (error) {
    console.error(error);
  }
};

// Authenticate user and generate JWT token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email, role: 'user' });

    if (!user) {
      return res.render('user/login', { errorMessage: 'Invalid credentials' });
    }

    // Check if the user is blocked
    if (user.status === 'Blocked') {
      return res.render('user/login', { errorMessage: 'Your account has been blocked, please contact support' });
    }

    // Check user is google authenticated
    if (!user.password) {
      return res.render('user/login', { errorMessage: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('user/login', { errorMessage: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Store the token in a cookie
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    // Redirect to the originally requested URL or home page
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo; // Clear the session after using it
    res.redirect(returnTo);
    console.log(returnTo);
    
  } catch (error) {
    console.error(error);
    res.render('user/login', { errorMessage: 'An error occurred' });
  }
};

// Render forgot password page
exports.loadForgotPassword = async (req, res) => {
  try {
    res.render('user/forgotPassword');
  } catch (error) {
    console.error(error);
  }
};

// Handle forgot password and send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('user/forgotPassword', { errorMessage: 'User does not exist' });
    }

    // Generate OTP
    const otp = await saveOTP(email)

    // Send OTP email
    const emailContent = `
      <p>Dear ${user.firstName},</p>
      <p>You requested to reset your password. Please use the following OTP to reset your password:</p>
      <h3>${otp}</h3>
      <p>This OTP is valid for the next 15 minutes.</p>
    `;
    await sendMail(email, 'be.sky Password Reset', emailContent);

    // Store email in session
    req.session.email = email;

    res.render('user/resetPassword', { message: 'OTP sent to your email for password reset' });
  } catch (error) {
    console.error(error);
  }
};


// Render reset password page
exports.loadResetPassword = async (req, res) => {
  try {
    res.render('user/resetPassword');
  } catch (error) {
    console.error(error);
  }
};

// Verify OTP and reset password
exports.resetPassword = async (req, res) => {
  const { otp1, otp2, otp3, otp4, otp5, otp6, newPassword } = req.body;
  const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

  const email = req.session.email;

  try {
    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.render('user/resetPassword', { errorMessage: 'Invalid or expired OTP' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await User.updateOne({ email }, { password: hashedPassword });

    // Delete OTP record
    await deleteOTP(email, otp);

    // Clear the session
    req.session.email = null;

    // Inform the user that the password reset was successful
    res.render('user/login', { message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    console.error(error);
  }
};

// Handle logout
exports.logout = (req, res) => {
  try {
    res.clearCookie('token');
    res.redirect('/');
  } catch (error) {
    console.error(error);
  }
};


