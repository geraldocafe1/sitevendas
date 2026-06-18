const cartService = require('../services/cartService');

const renderCart = (req, res) => {
  res.render('pages/cart', {
    title: 'Seu Carrinho - Grão Nobre',
    meta_description: 'Veja os produtos no seu carrinho, ajuste as quantidades, aplique cupons de desconto e finalize sua compra com segurança.'
  });
};

const validateCartAPI = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Os itens do carrinho são obrigatórios e devem ser uma lista.' });
  }

  try {
    const validationResult = await cartService.validateCart(items);
    return res.json(validationResult);
  } catch (error) {
    console.error('API cart validation error:', error);
    return res.status(500).json({ error: 'Erro ao validar itens do carrinho.' });
  }
};

module.exports = {
  renderCart,
  validateCartAPI
};
