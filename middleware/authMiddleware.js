const { generateToken, verifyToken } = require('../services/jwtService');

// Middleware to check if JWT token is valid and update its expiration
exports.checkToken = (req, res, next) => {
  const token = req.cookies.token;
  const isProtectedRoute = req.route && req.route.protected;

  // Function to handle token verification
  const handleToken = (token) => {
    try {
      const decoded = verifyToken(token);
      const now = Math.floor(Date.now() / 1000);
      const oneDayInSeconds = 24 * 60 * 60;

      // Update token expiration if about to expire
      if (decoded.exp - now < oneDayInSeconds) {
        const newToken = generateToken(decoded);
        res.cookie('token', newToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      }

      req.user = decoded; // Attach decoded token to request
    } catch (error) {
      console.error('Invalid token:', error);
      res.clearCookie('token'); // Clear the cookie if token is invalid
      throw new Error('Invalid token');
    }
  };

  if (token) {
    handleToken(token);
  }

  // Check for protected routes
  if (isProtectedRoute && !req.user) {
    // User is not authenticated
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }
    return res.redirect('/auth/login');
  }

  next();
};


// Middleware to prevent logged-in users from accessing login/register pages
exports.preventAuthAccess = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    
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
