const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const couponController = require('../controllers/couponController');
const notificationController = require('../controllers/notificationController');
const { ensureAdmin, preventAdmin } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// TODO: Routes for login
router.get('/login', preventAdmin, adminController.loadLogin);
router.post('/login', adminController.login);

// Ensure admin access
router.use(ensureAdmin);

// TODO: Routes for dashboard
router.get('/dashboard', adminController.loadDashboard);
router.get('/', adminController.loadDashboard);
// Route for fetch sales report
router.get('/sales-report', adminController.getSalesReport);
// Route for download sales report
router.get('/sales-report/download/:fileType', adminController.downloadFile);
router.get('/best-selling', adminController.getBestSelling);

// TODO: Routes for user management
// Route to list the users
router.get('/users', adminController.viewUsers);
// Route to update the user
router.post('/users/:userId/status', adminController.updateUserStatus);

// TODO: Routes for category management
// Route to list the categories
router.get('/categories', adminController.getAllCategories);
router.get('/fetch-parent-categories', adminController.getParentCategories);
// Route to add a new category
router.post('/add-category', adminController.saveCategory);
// Route to update a category
router.post('/update-category/:categoryId', adminController.saveCategory);

// TODO: Routes for product management
// Route to list the products
router.get('/products', adminController.getAllProducts);
// Serve the add form page
router.get('/add-product', adminController.loadProductForm);
// Route to add a new product
// router.post('/add-product', upload.any(), adminController.addProduct);
router.post('/add-product', upload.any(), adminController.saveProduct);
// Route to fetch subcategories based on parent category
router.get('/subcategories/:categoryId', adminController.getSubcategories);
// Serve the edit form page
router.get('/edit-product/:id', adminController.loadProductForm);
// Route to update a product
router.post('/update-product/:id', upload.any(), adminController.saveProduct);
// Route to delete image
router.delete('/delete-image/:productId/:variantIndex/:imageIndex', adminController.deleteImage);

// TODO: Routes for order management
// Route to list the orders
router.get('/orders', adminController.getAllOrders);
// Route for update the order status
router.post('/order/updateStatus', adminController.updateOrderStatus);

// TODO: Routes for offer management
// Route to list the categories
router.get('/offers', adminController.getAllOffers);
router.get('/entities', adminController.getEntities);
// Create a new offer
router.post('/offer/save', adminController.saveOffer);
// Update an existing offer
router.post('/offer/save/:id', adminController.saveOffer);
// Router for delete offer
router.post('/offer/delete/:offerId', adminController.deleteOffer);

// TODO: Routes for coupon management
// Route to list the categories
router.get('/coupons', couponController.getAllCoupons);
// Create a new coupon
router.post('/coupon/save', couponController.saveCoupon);
// Update an existing coupon
router.post('/coupon/save/:id', couponController.saveCoupon);
// Router for delete coupon
router.post('/coupon/delete/:couponId', couponController.deleteCoupon);

// TODO: Route for notification
router.get('/notifications', notificationController.getNotifications);
router.post('/notifications/:id/mark-as-read', notificationController.markAsRead);

// TODO: Route for logout
router.get('/logout', adminController.logout);

module.exports = router;
