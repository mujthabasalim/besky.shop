// import modules
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { checkToken } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

router.use((req, res, next) => {
  // Define protected routes
  if (req.path.includes('/protected')) {
    req.route = { protected: true };
  }
  next();
});

router.use(checkToken);

// home routes
router.get('/', userController.loadHome);

router.get('/shop', userController.loadShop);
router.get('/product/:productId/:variantIndex', userController.showProduct);

// Route for profile
router.get('/protected/profile', userController.showProfile)
// Router for profile update
router.post('/protected/profile-update', upload.single('profileImage'), userController.updateProfile);
// Router for add address
router.post('/protected/add-new-address', userController.saveAddress);
// Router for edit address
router.post('/protected/edit-address', userController.saveAddress);
// Router for delete address
router.post('/protected/delete-address/:addressId', userController.deleteAddress);

// Router for get cart dropdown
router.get('/protected/cart/data', userController.showCart);
// Router for get cart
router.get('/protected/cart', userController.showCart);
// Router for add and update cart
router.post('/protected/cart/manage', userController.manageCart);
// Router for delete cart
router.delete('/protected/cart/delete', userController.deleteCart);

// Route for apply coupon
router.post('/protected/apply-coupon', userController.applyCoupon);
router.post('/protected/remove-coupon', userController.removeCoupon);

// Router for checkout process
router.post('/protected/to-next', userController.saveToNext);
router.get('/protected/checkout/:stage', userController.handleCheckoutStage);

// Route for place order
router.post('/protected/order-place', userController.placeOrder);
router.post('/protected/verify-payment', userController.verifyPayment);
router.post('/protected/retry-payment/:orderId', userController.retryPayment);
// Route for show orders
router.get('/protected/orders', userController.showOrders);
// Route for cancel or return
router.post('/protected/order/:action', userController.updateOrderStatus);
// Route for download invoice
router.get('/protected/download-invoice', userController.downloadInvoice);

// Route for search  
router.get('/search', userController.searchProduct);

// Route for coupon
router.get('/protected/coupons', userController.showCoupons);

// Route for wishlist
router.get('/protected/wishlist', userController.showWishlist);
router.post('/protected/wishlist/:action', userController.manageWishlist);

// Route for wallet
router.get('/protected/wallet', userController.showWallet);
// router.post('/protected/wishlist/:action', userController.manageWishlist);



module.exports = router;
