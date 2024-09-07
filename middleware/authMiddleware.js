const { generateToken, verifyToken } = require('../services/jwtService');

// Middleware to check if JWT token is valid and update its expiration
exports.checkToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/auth/login');
  }

  try {
    const decoded = verifyToken(token);

    // Check if the token is about to expire (within a day)
    const now = Math.floor(Date.now() / 1000);
    const oneDayInSeconds = 24 * 60 * 60;

    if (decoded.exp - now < oneDayInSeconds) {
      // Update the token's expiration
      const newToken = generateToken(decoded);
      res.cookie('token', newToken, { httpOnly: true, secure: process.env.NODE_ENV === 'development' });
    }

    req.user = decoded; // Attach the decoded token to the request
    next();
  } catch (error) {
    console.error('Invalid token:', error);
    res.redirect('/auth/login');
  }
};

// Middleware to prevent logged-in users from accessing login/register pages
exports.preventAuthAccess = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    console.log('token');
    
    try {
      const decoded = verifyToken(token);
      req.user = decoded;

      // Check if the user is an admin or a regular user
      if (decoded.role === 'user') {
        return res.redirect('/');
      }
    } catch (error) {
      console.error('Invalid token:', error);
      res.clearCookie('token');
    }
  }

  // Store the original URL to redirect back to after login
  if (!req.session.returnTo) {
    req.session.returnTo = req.get('Referrer') || '/';
  }

  next();
};

// Middleware to Ensure Admin and Check Token
exports.ensureAdminAndCheckToken = (req, res, next) => {
  const adminToken = req.cookies.adminToken;

  if (!adminToken) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = verifyToken(adminToken);
    const now = Math.floor(Date.now() / 1000);
    const oneDayInSeconds = 24 * 60 * 60;

    // Check if the decoded token contains the admin role
    if (decoded.role !== 'admin') {
      return res.redirect('/');
    }

    // Refresh the token if it's close to expiry
    if (decoded.exp - now < oneDayInSeconds) {
      const newToken = generateToken(decoded);
      res.cookie('adminToken', newToken, { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 1 week expiration
    }

    req.user = decoded;
    return next();
  } catch (error) {
    console.error('Error ensuring admin and checking token:', error);
    return res.redirect('/admin/login');
  }
};

// Middleware to prevent logged-in users from accessing login/register pages
exports.preventAdminAuthAccess = (req, res, next) => {
  const adminToken = req.cookies.adminToken;

  if (adminToken) {
    try {
      const decoded = verifyToken(adminToken);
      req.user = decoded;

      // Check if the user is an admin or a regular user
      if (decoded.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
    } catch (error) {
      console.error('Invalid token:', error);
      res.clearCookie('adminToken');
    }
  }

  next();
};

exports.storeToken = (req, res, next) => {
  res.locals.token = req.cookies.token || null;
  next();
}