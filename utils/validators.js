// validate the input field
const { check } = require('express-validator');

const userValidationRules = [
  check('firstName')
    .isAlpha()
    .withMessage('First name must contain only alphabetic characters'),
  check('lastName')
    .isAlpha()
    .withMessage('Last name must contain only alphabetic characters'),
  check('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email format'),
  check('password')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })
    .withMessage('Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters')
]

const loginValidator = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
]

module.exports = {
  userValidationRules,
  loginValidator
};
