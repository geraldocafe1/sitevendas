const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyJWT } = require('../middlewares/auth');
const { reviewRules } = require('../middlewares/validate');

// Web views
router.get('/', productController.renderHome);
router.get('/produtos', productController.renderCatalog);
router.get('/produtos/:slug', productController.renderProductDetail);
router.get('/favoritos', productController.renderFavorites);

router.get('/privacidade', (req, res) => {
  res.render('pages/privacidade', {
    title: 'Política de Privacidade - Grão Nobre',
    meta_description: 'Entenda como a Grão Nobre protege as suas informações de acordo com a LGPD.'
  });
});

router.get('/termos', (req, res) => {
  res.render('pages/termos', {
    title: 'Termos de Uso - Grão Nobre',
    meta_description: 'Leia os termos de uso e condições gerais da Grão Nobre.'
  });
});

// API Endpoints
router.get('/api/products', productController.getProductsAPI);
router.get('/api/products/:slug', productController.getProductBySlugAPI);
router.post('/api/reviews', verifyJWT, reviewRules, productController.submitReview);

module.exports = router;
