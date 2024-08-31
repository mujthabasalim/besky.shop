const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdminAndCheckToken, preventAdminAuthAccess } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// TODO: Routes for login
router.get('/login', preventAdminAuthAccess, adminController.loadLogin);
router.post('/login', adminController.login);

// Ensure admin access
router.use(ensureAdminAndCheckToken);

// TODO: Routes for dashboard
router.get('/dashboard', adminController.loadDashboard);

// TODO: Routes for user management
// Route to list the users
router.get('/users', adminController.viewUsers);
// Route to update the user
router.post('/users/:userId/status', adminController.updateUserStatus);

// TODO: Routes for category management
// Route to list the categories
router.get('/categories', adminController.getAllCategories);
// Route to add a new category
router.post('/add-category', adminController.addCategory);
// Route to update a category
router.post('/updateCategory/:categoryId', adminController.updateCategory);

// TODO: Routes for product management
// Route to list the products
router.get('/products', productController.getAllProducts);
// Serve the add form page
router.get('/add-product', productController.loadAddForm);
// Route to add a new product
router.post('/add-product', upload.any(), productController.addProduct);
// Route to fetch subcategories based on parent category
router.get('/subcategories/:categoryId', productController.getSubcategories);
// Serve the edit form page
router.get('/edit-product/:id', productController.loadEditForm);

// TODO: Routes for logout
router.get('/logout', adminController.logout);

module.exports = router;
