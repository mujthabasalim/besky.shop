const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { userValidationRules, loginValidator } = require('../utils/validators');
const handleValidationErrors = require('../middleware/handleValidationErrors');
const { checkToken, preventAuthAccess } = require('../middleware/authMiddleware');

const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { successRedirect: '/auth/success', failureRedirect: '/auth/failure' }));

// Success and failure routes
router.get('/success', preventAuthAccess, authController.successGoogleLogin);
router.get('/failure', authController.failureGoogleLogin);

// Registration routes
router.get('/register', preventAuthAccess, authController.loadRegister);
router.post('/register', userValidationRules, handleValidationErrors, authController.register);

// OTP verification routes
router.get('/verify-otp', authController.loadVerify);
router.post('/verify-otp', authController.verifyOTP);

// Login routes
router.get('/login', preventAuthAccess, authController.loadLogin);
router.post('/login', loginValidator, handleValidationErrors, authController.login);

// Password recovery routes
router.get('/forgot-password', authController.loadForgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.loadResetPassword);
router.post('/reset-password', authController.resetPassword);

// Logout route
router.get('/logout', authController.logout);

module.exports = router;
