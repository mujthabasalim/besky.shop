const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Extract the first error message
    const errorMessages = errors.array().map(err => err.msg);

    // Find out the originating route (registration or login) and render the appropriate page
    const originatingRoute = req.originalUrl;
    if (originatingRoute.includes('register')) {
      return res.render('user/register', { errorMessage: errorMessages });
    } else if (originatingRoute.includes('login')) {
      return res.render('user/login', { errorMessage: errorMessages });
    } else if (originatingRoute.includes('forgot-password')) {
      return res.render('user/forgotPassword', { errorMessage: errorMessages });
    } else if (originatingRoute.includes('reset-password')) {
      return res.render('user/resetPassword', { errorMessage: errorMessages });
    }
  }
  next();
};

module.exports = handleValidationErrors;
