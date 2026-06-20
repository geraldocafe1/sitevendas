const { Product, Category, Order, OrderItem, User, Coupon, Post, Supplier, sequelize } = require('../models');
const { Op } = require('sequelize');
const { sendOrderStatusUpdateEmail } = require('../services/emailService');

// Helper to generate slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-]+/g, '') // remove all non-word chars
    .replace(/\-\-+/g, '-') // replace multiple - with single -
    .replace(/^-+/, '') // trim - from start
    .replace(/-+$/, ''); // trim - from end
};

// Dashboard KPI Metrics
const renderDashboard = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOf7Days = new Date();
    startOf7Days.setDate(startOf7Days.getDate() - 7);

    const startOf30Days = new Date();
    startOf30Days.setDate(startOf30Days.getDate() - 30);

    // Sum revenue for paid/completed orders
    const completedStatuses = ['paid', 'shipped', 'delivered'];

    const revenueTodayResult = await Order.sum('total', {
      where: {
        status: completedStatuses,
        created_at: { [Op.gte]: startOfToday }
      }
    }) || 0;

    const revenue7DaysResult = await Order.sum('total', {
      where: {
        status: completedStatuses,
        created_at: { [Op.gte]: startOf7Days }
      }
    }) || 0;

    const revenue30DaysResult = await Order.sum('total', {
      where: {
        status: completedStatuses,
        created_at: { [Op.gte]: startOf30Days }
      }
    }) || 0;

    const totalOrdersCount = await Order.count();
    const averageTicketResult = totalOrdersCount > 0 ? (await Order.sum('total') || 0) / totalOrdersCount : 0;

    // Fetch low stock items (< 5)
    const lowStockProducts = await Product.findAll({
      where: {
        stock: { [Op.lt]: 5 },
        is_active: true
      },
      include: [{ model: Category, as: 'category', attributes: ['name'] }]
    });

    // Last 5 orders
    const latestOrders = await Order.findAll({
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.render('admin/dashboard', {
      title: 'Painel Admin - Grão Nobre',
      layout: 'layouts/admin',
      metrics: {
        revenueToday: parseFloat(revenueTodayResult),
        revenue7Days: parseFloat(revenue7DaysResult),
        revenue30Days: parseFloat(revenue30DaysResult),
        totalOrders: totalOrdersCount,
        averageTicket: parseFloat(averageTicketResult),
      },
      lowStockProducts,
      latestOrders
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).send('Erro no servidor ao carregar painel.');
  }
};

// PRODUCTS CRUD
const renderProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });
    const categories = await Category.findAll();

    res.render('admin/products', {
      title: 'Gerenciar Produtos - Grão Nobre',
      layout: 'layouts/admin',
      products,
      categories
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).send('Erro no servidor ao carregar produtos.');
  }
};

const createProduct = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const {
    name,
    description,
    price,
    compare_price,
    stock,
    sku,
    category_id,
    weight_kg,
    is_featured,
    is_active,
    meta_title,
    meta_description
  } = req.body;

  try {
    let slug = slugify(name);
    // Ensure slug uniqueness
    let exists = await Product.findOne({ where: { slug } });
    let counter = 1;
    while (exists) {
      slug = `${slugify(name)}-${counter}`;
      exists = await Product.findOne({ where: { slug } });
      counter++;
    }

    // Process images URLs from Multer+Sharp middleware
    let imageUrls = [];
    if (req.processedFiles && req.processedFiles.length > 0) {
      imageUrls = req.processedFiles.map(img => img.webp); // Save the optimized webp path
    } else {
      // Use fallback placeholder image
      imageUrls = ['/uploads/placeholder.jpg'];
    }

    const product = await Product.create({
      name,
      slug,
      description,
      price: parseFloat(price),
      compare_price: compare_price ? parseFloat(compare_price) : null,
      stock: parseInt(stock, 10),
      sku,
      category_id,
      images: imageUrls,
      weight_kg: parseFloat(weight_kg),
      is_featured: is_featured === 'true' || is_featured === true,
      is_active: is_active === 'true' || is_active === true || is_active === undefined,
      meta_title: meta_title || name,
      meta_description: meta_description || description.slice(0, 160)
    });

    return res.status(201).json({ message: 'Produto cadastrado com sucesso!', product });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
};

const editProduct = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const { id } = req.params;
  const {
    name,
    description,
    price,
    compare_price,
    stock,
    sku,
    category_id,
    weight_kg,
    is_featured,
    is_active,
    meta_title,
    meta_description
  } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    // Process images
    let imageUrls = product.images;
    if (req.processedFiles && req.processedFiles.length > 0) {
      imageUrls = req.processedFiles.map(img => img.webp);
    }

    // Regenerate slug if name changed
    let slug = product.slug;
    if (name !== product.name) {
      slug = slugify(name);
      let exists = await Product.findOne({ where: { slug, id: { [Op.ne]: id } } });
      let counter = 1;
      while (exists) {
        slug = `${slugify(name)}-${counter}`;
        exists = await Product.findOne({ where: { slug, id: { [Op.ne]: id } } });
        counter++;
      }
    }

    await product.update({
      name,
      slug,
      description,
      price: parseFloat(price),
      compare_price: compare_price ? parseFloat(compare_price) : null,
      stock: parseInt(stock, 10),
      sku,
      category_id,
      images: imageUrls,
      weight_kg: parseFloat(weight_kg),
      is_featured: is_featured === 'true' || is_featured === true,
      is_active: is_active === 'true' || is_active === true,
      meta_title: meta_title || name,
      meta_description: meta_description || description.slice(0, 160)
    });

    return res.status(200).json({ message: 'Produto atualizado com sucesso!', product });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    // Soft delete: turn active status off
    await product.update({ is_active: false });

    return res.status(200).json({ message: 'Produto desativado (soft-deleted) com sucesso!' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Erro ao desativar produto.' });
  }
};

// ORDERS MANAGEMENT
const renderOrders = async (req, res) => {
  const { status } = req.query;

  try {
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.render('admin/orders', {
      title: 'Gerenciar Pedidos - Grão Nobre',
      layout: 'layouts/admin',
      orders,
      activeStatus: status || ''
    });
  } catch (error) {
    console.error('Admin orders page error:', error);
    res.status(500).send('Erro no servidor ao carregar pedidos.');
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
      return res.status(404).send('Pedido não encontrado.');
    }

    res.render('admin/order-details', {
      title: `Detalhes do Pedido #${order.id.slice(0, 8)} - Grão Nobre`,
      layout: 'layouts/admin',
      order
    });
  } catch (error) {
    console.error('Admin order details error:', error);
    res.status(500).send('Erro ao carregar detalhes do pedido.');
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status de pedido inválido.' });
  }

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    await order.update({ status });

    // Send transactional status update email
    sendOrderStatusUpdateEmail(order, status).catch(err => console.error('Error sending order status email:', err));

    return res.status(200).json({ message: 'Status do pedido atualizado com sucesso!', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status do pedido.' });
  }
};

// CUSTOMERS MANAGEMENT
const renderCustomers = async (req, res) => {
  try {
    // Select all customers, grouping orders count and total spend
    const customers = await User.findAll({
      where: { role: 'customer' },
      order: [['created_at', 'DESC']]
    });

    const customersWithData = [];
    for (const customer of customers) {
      const ordersCount = await Order.count({ where: { user_id: customer.id } });
      const totalSpend = await Order.sum('total', {
        where: {
          user_id: customer.id,
          status: ['paid', 'shipped', 'delivered']
        }
      }) || 0;

      customersWithData.push({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        created_at: customer.created_at,
        ordersCount,
        totalSpend: parseFloat(totalSpend)
      });
    }

    res.render('admin/customers', {
      title: 'Clientes Cadastrados - Grão Nobre',
      layout: 'layouts/admin',
      customers: customersWithData
    });
  } catch (error) {
    console.error('Admin customers error:', error);
    res.status(500).send('Erro no servidor ao carregar clientes.');
  }
};

// COUPONS CRUD
const renderCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
    res.render('admin/coupons', {
      title: 'Gerenciar Cupons - Grão Nobre',
      layout: 'layouts/admin',
      coupons
    });
  } catch (error) {
    console.error('Admin coupons error:', error);
    res.status(500).send('Erro no servidor ao carregar cupons.');
  }
};

const createCoupon = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const { code, type, value, min_order_value, max_uses, expires_at } = req.body;

  try {
    const existing = await Coupon.findOne({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return res.status(400).json({ error: 'Um cupom com este código já existe.' });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      min_order_value: min_order_value ? parseFloat(min_order_value) : 0,
      max_uses: max_uses ? parseInt(max_uses, 10) : null,
      used_count: 0,
      expires_at: expires_at ? new Date(expires_at) : null,
      is_active: true
    });

    return res.status(201).json({ message: 'Cupom criado com sucesso!', coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return res.status(500).json({ error: 'Erro ao criar cupom.' });
  }
};

const toggleCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({ error: 'Cupom não encontrado.' });
    }

    await coupon.update({ is_active: !coupon.is_active });

    return res.json({ message: `Cupom ${coupon.is_active ? 'ativado' : 'desativado'} com sucesso!`, coupon });
  } catch (error) {
    console.error('Error toggling coupon:', error);
    return res.status(500).json({ error: 'Erro ao alterar status do cupom.' });
  }
};

// BLOG POSTS CRUD (for SEO de Conteúdo admin)
const renderPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      order: [['created_at', 'DESC']]
    });

    res.render('admin/posts', {
      title: 'Gerenciar Blog - Grão Nobre',
      layout: 'layouts/admin',
      posts
    });
  } catch (error) {
    console.error('Admin posts page error:', error);
    res.status(500).send('Erro no servidor ao carregar artigos.');
  }
};

const createPost = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const { title, content, excerpt, meta_title, meta_description, is_published } = req.body;

  try {
    let slug = slugify(title);
    let exists = await Post.findOne({ where: { slug } });
    let counter = 1;
    while (exists) {
      slug = `${slugify(title)}-${counter}`;
      exists = await Post.findOne({ where: { slug } });
      counter++;
    }

    // Default covers or uploaded path
    let cover_image = '/images/blog-default.jpg';
    if (req.processedFile) {
      cover_image = req.processedFile.webp;
    }

    const post = await Post.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 150).replace(/<[^>]*>/g, ''),
      cover_image,
      author_id: req.user.id,
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt || title,
      is_published: is_published === 'true' || is_published === true,
      published_at: is_published === 'true' || is_published === true ? new Date() : null
    });

    return res.status(201).json({ message: 'Artigo publicado com sucesso!', post });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Erro ao criar artigo.' });
  }
};

const editPost = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const { id } = req.params;
  const { title, content, excerpt, meta_title, meta_description, is_published } = req.body;

  try {
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Artigo não encontrado.' });
    }

    let slug = post.slug;
    if (title !== post.title) {
      slug = slugify(title);
      let exists = await Post.findOne({ where: { slug, id: { [Op.ne]: id } } });
      let counter = 1;
      while (exists) {
        slug = `${slugify(title)}-${counter}`;
        exists = await Post.findOne({ where: { slug, id: { [Op.ne]: id } } });
        counter++;
      }
    }

    let cover_image = post.cover_image;
    if (req.processedFile) {
      cover_image = req.processedFile.webp;
    }

    const publishState = is_published === 'true' || is_published === true;
    const publishedAt = publishState && !post.is_published ? new Date() : post.published_at;

    await post.update({
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 150).replace(/<[^>]*>/g, ''),
      cover_image,
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt || title,
      is_published: publishState,
      published_at: publishedAt
    });

    return res.json({ message: 'Artigo atualizado com sucesso!', post });
  } catch (error) {
    console.error('Error editing post:', error);
    return res.status(500).json({ error: 'Erro ao atualizar artigo.' });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Artigo não encontrado.' });
    }

    await post.destroy();
    return res.json({ message: 'Artigo removido com sucesso!' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Erro ao deletar artigo.' });
  }
};

// SUPPLIERS CRUD
const renderSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({ order: [['created_at', 'DESC']] });
    // For each supplier, count their linked products
    const suppliersWithCount = await Promise.all(suppliers.map(async (s) => {
      const productCount = await Product.count({ where: { supplier_id: s.id } });
      return { ...s.toJSON(), productCount };
    }));
    res.render('admin/suppliers', {
      title: 'Fornecedores - Grão Nobre',
      layout: 'layouts/admin',
      suppliers: suppliersWithCount
    });
  } catch (error) {
    console.error('Admin suppliers error:', error);
    res.status(500).send('Erro no servidor ao carregar fornecedores.');
  }
};

const createSupplier = async (req, res) => {
  const { name, email, whatsapp, contact_name, notes } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
  }
  try {
    const existing = await Supplier.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Já existe um fornecedor com este email.' });
    }
    const supplier = await Supplier.create({ name, email, whatsapp, contact_name, notes, is_active: true });
    return res.status(201).json({ message: 'Fornecedor cadastrado com sucesso!', supplier });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar fornecedor.' });
  }
};

const editSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, email, whatsapp, contact_name, notes, is_active } = req.body;
  try {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado.' });
    await supplier.update({
      name: name || supplier.name,
      email: email || supplier.email,
      whatsapp,
      contact_name,
      notes,
      is_active: is_active === 'true' || is_active === true
    });
    return res.json({ message: 'Fornecedor atualizado com sucesso!', supplier });
  } catch (error) {
    console.error('Error editing supplier:', error);
    return res.status(500).json({ error: 'Erro ao atualizar fornecedor.' });
  }
};

const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  try {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado.' });
    await supplier.update({ is_active: false });
    return res.json({ message: 'Fornecedor desativado com sucesso!' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return res.status(500).json({ error: 'Erro ao desativar fornecedor.' });
  }
};

module.exports = {
  renderDashboard,
  renderProducts,
  createProduct,
  editProduct,
  deleteProduct,
  renderOrders,
  renderOrderDetails,
  updateOrderStatus,
  renderCustomers,
  renderCoupons,
  createCoupon,
  toggleCoupon,
  renderPosts,
  createPost,
  editPost,
  deletePost,
  renderSuppliers,
  createSupplier,
  editSupplier,
  deleteSupplier
};
