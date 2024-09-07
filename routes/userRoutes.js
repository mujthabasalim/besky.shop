// import modules
const express = require('express');
const router = express.Router();

// import user controller
const userController = require('../controllers/userController');
const { checkToken, storeToken } = require('../middleware/authMiddleware');

router.use(storeToken)
// home routes
router.get('/', userController.loadHome);

router.get('/shop', userController.loadShop);
router.get('/product/:variantId', userController.showProduct);

module.exports = router;