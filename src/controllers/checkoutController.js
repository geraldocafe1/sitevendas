const couponService = require('../services/couponService');
const cepService = require('../services/cepService');

const renderCheckout = (req, res) => {
  res.render('pages/checkout', {
    title: 'Finalizar Compra - Grão Nobre',
    meta_description: 'Checkout seguro de etapa única. Informe seus dados de entrega, selecione a forma de pagamento e conclua seu pedido de forma rápida.',
    stripe_public_key: process.env.STRIPE_PUBLIC_KEY || '',
    mp_public_key: process.env.MP_PUBLIC_KEY || 'TEST-1234567890-PUB-KEY'
  });
};

const validateCouponAPI = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const { code, cart_total } = req.body;

  try {
    const result = await couponService.validateCoupon(code, parseFloat(cart_total));
    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      code: result.coupon.code,
      type: result.coupon.type,
      value: parseFloat(result.coupon.value),
      discount: result.discount,
      message: result.message
    });
  } catch (error) {
    console.error('API coupon validation error:', error);
    return res.status(500).json({ error: 'Erro interno ao validar cupom.' });
  }
};

const lookupCEPAPI = async (req, res) => {
  const { cep } = req.params;

  try {
    const address = await cepService.lookupCEP(cep);
    return res.json(address);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao buscar o CEP.' });
  }
};

module.exports = {
  renderCheckout,
  validateCouponAPI,
  lookupCEPAPI
};
