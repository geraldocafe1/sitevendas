const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyJWT, requireAdmin } = require('../middlewares/auth');
const { upload, processImages } = require('../middlewares/upload');
const { adminProductRules, adminCouponRules, adminPostRules } = require('../middlewares/validate');

// Apply verifyJWT and requireAdmin to all admin sub-routes
router.use('/admin', verifyJWT, requireAdmin);

// Dashboard
router.get('/admin', adminController.renderDashboard);

// Products CRUD
router.get('/admin/produtos', adminController.renderProducts);
router.post('/admin/produtos', upload.array('images', 5), processImages, adminProductRules, adminController.createProduct);
router.put('/admin/produtos/:id', upload.array('images', 5), processImages, adminProductRules, adminController.editProduct);
router.delete('/admin/produtos/:id', adminController.deleteProduct);

// Orders Management
router.get('/admin/pedidos', adminController.renderOrders);
router.get('/admin/pedidos/:id', adminController.renderOrderDetails);
router.put('/admin/pedidos/:id/status', adminController.updateOrderStatus);

// Customers History
router.get('/admin/clientes', adminController.renderCustomers);

// Coupons CRUD
router.get('/admin/cupons', adminController.renderCoupons);
router.post('/admin/cupons', adminCouponRules, adminController.createCoupon);
router.patch('/admin/cupons/:id/toggle', adminController.toggleCoupon);

// Blog Posts CRUD
router.get('/admin/posts', adminController.renderPosts);
router.post('/admin/posts', upload.single('cover'), processImages, adminPostRules, adminController.createPost);
router.put('/admin/posts/:id', upload.single('cover'), processImages, adminPostRules, adminController.editPost);
router.delete('/admin/posts/:id', adminController.deletePost);

// Suppliers (Dropshipping) CRUD
router.get('/admin/fornecedores', adminController.renderSuppliers);
router.post('/admin/fornecedores', adminController.createSupplier);
router.put('/admin/fornecedores/:id', adminController.editSupplier);
router.delete('/admin/fornecedores/:id', adminController.deleteSupplier);

module.exports = router;
