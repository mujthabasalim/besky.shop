const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdminAndCheckToken, preventAdminAuthAccess } = require('../middleware/authMiddleware');

// Routes for login
router.get('/login', preventAdminAuthAccess, adminController.loadLogin);
router.post('/login', adminController.login);

// Ensure admin access
router.use(ensureAdminAndCheckToken);

// Routes for dashboard
router.get('/dashboard', adminController.loadDashboard);

// Routes for user management
router.get('/users', adminController.viewUsers);
router.post('/users/:userId/status', adminController.updateUserStatus);

// Routes for category management
router.get('/categories', adminController.getAllCategories);
router.post('/add-category', adminController.addCategory);
router.post('/updateCategory/:categoryId', adminController.updateCategory);

// Routes for product management
router.get('/products', adminController.getProducts);
router.post('/products/addProduct', adminController.addProduct);
// router.post('/products/:categoryId', adminController.updateCategory);

// Routes for logout
router.get('/logout', adminController.logout);

module.exports = router;
