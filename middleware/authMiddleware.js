const { generateToken, verifyToken } = require('../services/jwtService');
const User = require('../models/User');

// Middleware to check if JWT token is valid and update its expiration
exports.checkToken = async (req, res, next) => {
  const token = req.cookies.token;
  res.locals.token = false;
  res.locals.profilePicture = null;

  const isProtectedRoute = req.route && req.route.protected;

  const handleToken = async (token) => {
    try {
      const decoded = verifyToken(token);

      const user = await User.findById(decoded.id);
      if (!user || user.status !== 'Active') {
        res.clearCookie('token');
        req.flash('error', 'User not found or inactive')
      }

      // Set token and profile picture
      res.locals.token = true;
      res.locals.profilePicture = decoded.profilePicture;

      const now = Math.floor(Date.now() / 1000);
      const oneDayInSeconds = 24 * 60 * 60;

      if (decoded.exp - now < oneDayInSeconds) {
        const newToken = generateToken(decoded);
        res.cookie('token', newToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      }

      req.user = decoded;
    } catch (error) {
      console.error('Invalid token or user inactive:', error);
      res.clearCookie('token');
      throw new Error('Invalid token or inactive user');
    }
  };

  if (token) {
    await handleToken(token);
  }

  if (isProtectedRoute && !req.user) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }
    return res.redirect('/auth/login');
  }

  next();
};

// Middleware to Ensure Admin and Check Token
exports.ensureAdmin = async (req, res, next) => {
  const adminToken = req.cookies.adminToken;

  if (!adminToken) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = verifyToken(adminToken);

    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.status !== 'Active' || decoded.role !== 'admin') {
      throw new Error('User not found, inactive, or not an admin');
    }

    const now = Math.floor(Date.now() / 1000);
    const oneDayInSeconds = 24 * 60 * 60;

    if (decoded.exp - now < oneDayInSeconds) {
      const newToken = generateToken(decoded);
      res.cookie('adminToken', newToken, { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin check failed:', error);
    res.clearCookie('adminToken');
    return res.redirect('/admin/login');
  }
};

// Middleware to prevent logged-in users from accessing login/register pages
exports.preventAuthAccess = async (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (user && user.status === 'Active' && decoded.role === 'user') {
        return res.redirect('/');
      }
    } catch (error) {
      console.error('Invalid token:', error);
      res.clearCookie('token');
    }
  }
  next();
};

// Middleware to prevent logged-in admin from accessing login
exports.preventAdmin = async (req, res, next) => {
  const adminToken = req.cookies.adminToken;

  if (adminToken) {
    try {
      const decoded = verifyToken(adminToken);
      const adminUser = await User.findById(decoded.id);

      if (adminUser && adminUser.status === 'Active' && decoded.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
    } catch (error) {
      console.error('Invalid admin token:', error);
      res.clearCookie('adminToken');
    }
  }

  next();
};
