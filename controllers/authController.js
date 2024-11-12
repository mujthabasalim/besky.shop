require("dotenv").config();
const User = require("../models/User");
const bcrypt = require("bcrypt");

const { capitalizeFirstLetter } = require("../utils/stringUtils");
const { saveOTP, verifyOTP, deleteOTP } = require("../services/otpService");
const { sendMail } = require("../services/mailer");
const { generateToken } = require("../services/jwtService");

// Get requests
exports.loadLogin = async (req, res) => {
  res.render("user/login");
};
exports.loadRegister = async (req, res) => {
  res.render("user/register");
};
exports.loadVerifyOTP = async (req, res) => {
  res.render("user/verifyOTP");
};
exports.loadForgotPassword = async (req, res) => {
  res.render("user/forgotPassword");
};
exports.loadResetPassword = async (req, res) => {
  res.render("user/resetPassword");
};

// Render OTP verification page
exports.resendOTP = async (req, res) => {
  const { type } = req.params;
  try {
    const email = req.session.user ? req.session.user.email : req.session.email;
    if (!email) {
      if (type === 'register') {
        req.flash('error', 'Email not found');
        res.redirect('/auth/verify-otp')
      } else if (type === 'reset') { 
        req.flash('error', 'Email not found');
        res.redirect('/auth/reset-password')
      }
    }
    // Generate OTP
    const otp = await saveOTP(email);

    const emailContent = `
      <p>Dear,</p>
      <p>You are requested to new otp. Please verify your email using the following OTP:</p>
      <h3>${otp}</h3>
      <p>This OTP is valid for the next 15 minutes.</p>
    `;
    await sendMail(email, "OTP Verification", emailContent);
    const message = `We have shared a OTP to your registered email address <strong>${email}</strong>`;
    if (type === "register") {
      req.flash("success", message);
      return res.redirect("/auth/verify-otp");
    } else if (type === "reset") {
      req.flash("success", message);
      res.redirect("/auth/reset-password");
    }
  } catch (error) {
    console.error("Error rendering OTP verification page:", error);
    req.flash('error', 'An error occurred.');
  }
};

// Success Google login
exports.successGoogleLogin = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/failure");
    }

    // Check if the user is blocked
    const user = await User.findOne({ email: req.user.email });
    if (user.status === "Blocked") {
      req.flash(
        "error",
        "Your account has been blocked, please contact support"
      );
      return res.redirect("/auth/login");
    }

    // Generate JWT token
    const token = generateToken(user);

    // Store the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Redirect to home page
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.redirect("/auth/failure");
  }
};

exports.failureGoogleLogin = (req, res) => {
  req.flash("error", "Login failed");
  res.redirect("/auth/login");
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
      req.flash("error", "User already exists");
      return res.redirect("/auth/register");
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
    await sendMail(email, "OTP Verification", emailContent);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Store user data in session
    req.session.user = { firstName, lastName, email, password: hashedPassword };

    req.flash(
      "success",
      `We have shared a OTP to your registered email address <br> <strong>${email}</strong>`
    );
    return res.redirect("/auth/verify-otp");
  } catch (error) {
    console.error("Error during registration:", error);
    req.flash("error", "Registration failed, please try again");
    res.redirect("/auth/register");
  }
};

// Verify OTP and create a new user
exports.verifyOTP = async (req, res) => {
  const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
  const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

  try {
    // Check if user data exists in session
    if (!req.session.user) {
      req.flash("error", "Session expired. Please register again.");
      return res.redirect("/auth/verify-otp");
    }

    // Fetch user data from session
    const { firstName, lastName, email, password } = req.session.user;

    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      req.flash("error", "Invalid or expired OTP.");
      return res.redirect("/auth/verify-otp");
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
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.redirect("/");
  } catch (error) {
    console.error("Error during OTP verification:", error);
    req.flash("error", "An error occurred.");
    return res.redirect("/auth/verify-otp");
  }
};

// Authenticate user and generate JWT token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email, role: "user" });

    if (!user) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/auth/login");
    }

    // Check if the user is blocked
    if (user.status === "Blocked") {
      req.flash(
        "error",
        "Your account has been blocked, please contact support"
      );
      return res.redirect("/auth/login");
    }

    // Check user is google authenticated
    if (!user.password) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/auth/login");
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/auth/login");
    }

    // Generate JWT token
    const token = generateToken(user);

    // Store the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Redirect to the originally requested URL or home page
    const returnTo = req.get("Referrer") || "/";
    res.redirect(returnTo);
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred.");
    return res.redirect("/auth/login");
  }
};

// Handle forgot password and send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "User does not exist");
      return res.redirect("/auth/forgot-password");
    }

    // Generate OTP
    const otp = await saveOTP(email);

    // Send OTP email
    const emailContent = `
      <p>Dear ${user.firstName},</p>
      <p>You requested to reset your password. Please use the following OTP to reset your password:</p>
      <h3>${otp}</h3>
      <p>This OTP is valid for the next 15 minutes.</p>
    `;
    await sendMail(email, "be.sky Password Reset", emailContent);

    // Store email in session
    req.session.email = email;

    req.flash(
      "success",
      `We have shared an OTP to your registered email address <strong>${email}</strong>`
    );
    return res.redirect("/auth/reset-password");
  } catch (error) {
    console.error(error);
  }
};

// Verify OTP and reset password
exports.resetPassword = async (req, res) => {
  const { otp1, otp2, otp3, otp4, otp5, otp6, password } = req.body;
  const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

  const email = req.session.email;

  try {
    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      req.flash("error", "Invalid or expired OTP.");
      return res.redirect("/auth/reset-password");
    }

    // Check if the newPassword exists
    if (!password) {
      req.flash("error", "New password is required.");
      return res.redirect("/auth/reset-password");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await User.updateOne({ email }, { password: hashedPassword });

    // Delete OTP record
    await deleteOTP(email, otp);

    // Clear the session
    req.session.email = null;
    res.clearCookie("token");

    // Inform the user that the password reset was successful
    req.flash(
      "success",
      "Password reset successfully. Please log in with your new password."
    );
    res.redirect("/auth/login");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred. Please try again.");
    return res.redirect("/auth/reset-password");
  }
};

// Handle logout
exports.logout = (req, res) => {
  try {
    res.clearCookie("token");
    res.redirect("/");
  } catch (error) {
    console.error(error);
  }
};
