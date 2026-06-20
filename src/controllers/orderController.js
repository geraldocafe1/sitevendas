const { Order, OrderItem, Product, Coupon, Supplier, sequelize } = require('../models');
const cartService = require('../services/cartService');
const couponService = require('../services/couponService');
const { sendOrderConfirmationEmail, sendDropshippingOrderEmail } = require('../services/emailService');

const createOrderAPI = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const {
    items,
    coupon_code,
    shipping_name,
    shipping_email,
    shipping_phone,
    shipping_zip,
    shipping_address,
    shipping_number,
    shipping_complement,
    shipping_city,
    shipping_state,
    payment_method
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nenhum item informado para compra.' });
  }

  const t = await sequelize.transaction();

  try {
    // 1. Validate cart and stock
    const validatedCart = await cartService.validateCart(items);
    if (validatedCart.items.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Todos os produtos informados estão fora de estoque.' });
    }

    if (validatedCart.hasChanges) {
      await t.rollback();
      return res.status(400).json({
        error: 'O estoque ou preço de alguns itens foi alterado. Por favor, revise seu carrinho.',
        validatedItems: validatedCart.items
      });
    }

    const subtotal = validatedCart.subtotal;

    // 2. Validate and apply coupon if present
    let discount = 0;
    let couponInstance = null;
    if (coupon_code && coupon_code.trim() !== '') {
      const couponResult = await couponService.validateCoupon(coupon_code, subtotal);
      if (couponResult.valid) {
        discount = couponResult.discount;
        couponInstance = couponResult.coupon;
      }
    }

    // 3. Shipping cost calculation (Free shipping over R$150, otherwise R$15.00)
    const shipping_cost = subtotal >= 150 ? 0.00 : 15.00;
    const total = Math.max(0, subtotal - discount + shipping_cost);

    // Join address lines
    const fullAddress = `${shipping_address}, ${shipping_number}${shipping_complement ? ' - ' + shipping_complement : ''}`;

    // 4. Create Order record
    const order = await Order.create({
      user_id: req.user ? req.user.id : null, // nullable for guest checkout
      status: 'pending',
      subtotal,
      discount,
      shipping_cost,
      total,
      payment_method,
      payment_status: payment_method === 'credit_card' ? 'approved' : 'pending', // credit card approved automatically in mock
      shipping_name,
      shipping_email,
      shipping_phone,
      shipping_zip,
      shipping_address: fullAddress,
      shipping_city,
      shipping_state
    }, { transaction: t });

    // 5. Create OrderItem records and deduct stock
    const createdItems = [];
    for (const item of validatedCart.items) {
      const dbProduct = await Product.findByPk(item.product_id, { transaction: t, lock: true });
      
      if (dbProduct.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({ error: `Estoque insuficiente para o produto: ${dbProduct.name}` });
      }

      // Deduct stock
      dbProduct.stock -= item.quantity;
      await dbProduct.save({ transaction: t });

      const orderItem = await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total_price
      }, { transaction: t });

      createdItems.push({
        ...orderItem.toJSON(),
        name: dbProduct.name
      });
    }

    // 6. Update coupon use count
    if (couponInstance) {
      couponInstance.used_count += 1;
      await couponInstance.save({ transaction: t });
    }

    // Commit Transaction
    await t.commit();

    // Send order confirmation email to customer in background
    sendOrderConfirmationEmail(order, createdItems).catch(err => console.error('Confirmation email failed:', err));

    // --- DROPSHIPPING: Notify each supplier automatically ---
    // Group items by supplier_id
    const supplierGroups = {};
    for (const item of createdItems) {
      const product = await Product.findByPk(item.product_id, {
        include: [{ model: Supplier, as: 'supplier' }]
      });
      if (product && product.supplier && product.supplier.is_active) {
        const supplierId = product.supplier.id;
        if (!supplierGroups[supplierId]) {
          supplierGroups[supplierId] = { supplier: product.supplier, items: [] };
        }
        supplierGroups[supplierId].items.push({ ...item, name: product.name });
      }
    }
    // Send one email per supplier with only their items
    for (const group of Object.values(supplierGroups)) {
      sendDropshippingOrderEmail(group.supplier, order, group.items)
        .catch(err => console.error(`Dropshipping email to ${group.supplier.email} failed:`, err));
    }

    // Generate mock payment references
    let paymentData = {};
    if (payment_method === 'pix') {
      paymentData = {
        pix_key: 'graonobre.pix@pagamentos.com.br',
        qr_code_placeholder: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014BR.GOV.BCB.PIX0117graonobre.pix@pagamentos.com.br5204000053039865405' + total.toFixed(2)
      };
    } else if (payment_method === 'boleto') {
      paymentData = {
        barcode: '34191.79001 01043.513184 91020.150008 7 987600000' + Math.round(total * 100).toString().padStart(4, '0')
      };
    }

    return res.status(201).json({
      message: 'Pedido realizado com sucesso!',
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        ...paymentData
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Order creation failed:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao registrar pedido.' });
  }
};

const getOrderAPI = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['name', 'slug', 'images'] }]
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    // Auth validation: If logged in, block viewing other users' orders
    if (order.user_id && (!req.user || req.user.id !== order.user_id)) {
      return res.status(403).json({ error: 'Você não tem permissão para visualizar este pedido.' });
    }

    return res.json({ order });
  } catch (error) {
    console.error('API get order error:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados do pedido.' });
  }
};

const renderOrderSuccess = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['name', 'images'] }]
      }]
    });

    if (!order) {
      return res.status(404).render('pages/error', {
        title: 'Pedido não encontrado',
        message: 'O pedido informado não existe em nossa base de dados.',
        status: 404
      });
    }

    // Render success view
    res.render('pages/order-success', {
      title: 'Compra Confirmada! - Grão Nobre',
      meta_description: 'Parabéns, seu pedido foi recebido com sucesso!',
      order
    });
  } catch (error) {
    console.error('Order success rendering error:', error);
    res.status(500).render('pages/error', {
      title: 'Erro no Servidor',
      message: 'Erro ao carregar confirmação de compra.',
      status: 500
    });
  }
};

const renderOrderDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['name', 'slug', 'images'] }]
      }]
    });

    if (!order) {
      return res.status(404).render('pages/error', {
        title: 'Pedido não encontrado',
        message: 'O pedido informado não foi encontrado.',
        status: 404
      });
    }

    // Secure: guest orders can be viewed by anyone with success URL, but authenticated orders only by owner
    if (order.user_id && (!req.user || req.user.id !== order.user_id)) {
      return res.status(403).render('pages/error', {
        title: 'Acesso Negado',
        message: 'Você não tem permissão para visualizar este pedido.',
        status: 403
      });
    }

    res.render('pages/order-details', {
      title: `Pedido #${order.id.slice(0, 8)} - Grão Nobre`,
      meta_description: 'Detalhes e rastreamento do seu pedido.',
      order
    });
  } catch (error) {
    console.error('Order details rendering error:', error);
    res.status(500).render('pages/error', {
      title: 'Erro no Servidor',
      message: 'Erro ao carregar detalhes do pedido.',
      status: 500
    });
  }
};

module.exports = {
  createOrderAPI,
  getOrderAPI,
  renderOrderSuccess,
  renderOrderDetails
};
