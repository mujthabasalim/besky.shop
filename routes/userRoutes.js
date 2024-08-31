// import modules
const express = require('express');
const router = express.Router();

// import user controller
const userController = require('../controllers/userController');
const { checkToken } = require('../middleware/authMiddleware');

// home routes
router.get('/', userController.loadHome);

module.exports = router;