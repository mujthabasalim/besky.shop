const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'You have accessed a protected route' });
});

module.exports = router;
