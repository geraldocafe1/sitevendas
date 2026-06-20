const { Product, Category, Review, User, Post } = require('../models');
const { Op } = require('sequelize');

// Seed based random number generator for social proof consistency
const seedRandom = (strSeed) => {
  let hash = 0;
  for (let i = 0; i < strSeed.length; i++) {
    hash = strSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
};

const renderHome = async (req, res) => {
  try {
    const categories = await Category.findAll();
    const featuredProducts = await Product.findAll({
      where: { is_featured: true, is_active: true },
      limit: 8
    });
    const latestPosts = await Post.findAll({
      where: { is_published: true },
      order: [['published_at', 'DESC']],
      limit: 3
    });

    res.render('pages/home', {
      title: 'Grão Nobre - Cafés Especiais & Gourmet',
      meta_description: 'Descubra os melhores cafés gourmet e grãos especiais colhidos no Brasil. Compre online cafés de alta qualidade torrados artesanalmente.',
      categories,
      featuredProducts,
      latestPosts
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('pages/error', {
      title: 'Erro no Servidor',
      message: 'Não foi possível carregar a página inicial.',
      status: 500
    });
  }
};

const renderCatalog = async (req, res) => {
  try {
    const { q, category, min, max, sort, page } = req.query;

    const limit = 9;
    const currentPage = parseInt(page, 10) || 1;
    const offset = (currentPage - 1) * limit;

    const whereClause = { is_active: true };

    // Search query filter
    if (q && q.trim() !== '') {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${q.trim()}%` } },
        { description: { [Op.like]: `%${q.trim()}%` } },
        { sku: { [Op.like]: `%${q.trim()}%` } }
      ];
    }

    // Category filter
    let activeCategory = null;
    if (category) {
      activeCategory = await Category.findOne({ where: { slug: category } });
      if (activeCategory) {
        whereClause.category_id = activeCategory.id;
      }
    }

    // Price range filter
    const minPrice = parseFloat(min);
    const maxPrice = parseFloat(max);
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      whereClause.price = { [Op.between]: [minPrice, maxPrice] };
    } else if (!isNaN(minPrice)) {
      whereClause.price = { [Op.gte]: minPrice };
    } else if (!isNaN(maxPrice)) {
      whereClause.price = { [Op.lte]: maxPrice };
    }

    // Sorting options
    let order = [['created_at', 'DESC']];
    if (sort === 'price_asc') {
      order = [['price', 'ASC']];
    } else if (sort === 'price_desc') {
      order = [['price', 'DESC']];
    } else if (sort === 'rating') {
      // Sorting by rating would require a complex group/join query. Fallback to featured + price.
      order = [['is_featured', 'DESC'], ['price', 'ASC']];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order,
      limit,
      offset
    });

    const categories = await Category.findAll();
    const totalPages = Math.ceil(count / limit);

    res.render('pages/catalog', {
      title: activeCategory ? `${activeCategory.name} - Grão Nobre` : 'Catálogo de Cafés - Grão Nobre',
      meta_description: activeCategory ? activeCategory.description : 'Compre cafés especiais online. Moídos, em grãos ou cápsulas com torra fresca direta do produtor.',
      products,
      categories,
      activeCategorySlug: category || '',
      searchQuery: q || '',
      minPrice: min || '',
      maxPrice: max || '',
      sortOption: sort || '',
      currentPage,
      totalPages,
      totalCount: count
    });
  } catch (error) {
    console.error('Catalog page error:', error);
    res.status(500).render('pages/error', {
      title: 'Erro no Servidor',
      message: 'Não foi possível carregar o catálogo de produtos.',
      status: 500
    });
  }
};

const renderProductDetail = async (req, res) => {
  const { slug } = req.params;

  try {
    const product = await Product.findOne({
      where: { slug, is_active: true }
    });

    if (!product) {
      return res.status(404).render('pages/error', {
        title: 'Produto não encontrado',
        message: 'O café que você está procurando não foi encontrado ou está esgotado.',
        status: 404
      });
    }

    // Related Products (same category, exclude current, limit 4)
    const relatedProducts = await Product.findAll({
      where: {
        category_id: product.category_id,
        id: { [Op.ne]: product.id },
        is_active: true
      },
      limit: 4
    });

    // Cross-sell ("Comprados juntos"): select 1-2 other active products from other categories or same
    const crossSellProducts = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        is_active: true
      },
      limit: 2
    });

    // Social Proof calculation (between 8 and 47, deterministic by product ID)
    const seed = seedRandom(product.id);
    const recentBuyersCount = Math.floor(8 + seed * (47 - 8 + 1));

    // Reviews list
    const reviews = await Review.findAll({
      where: { product_id: product.id, is_approved: true },
      include: [{ model: User, as: 'user', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });

    // Calculate rating averages
    let avgRating = 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => {
        ratingCounts[curr.rating] = (ratingCounts[curr.rating] || 0) + 1;
        return acc + curr.rating;
      }, 0);
      avgRating = parseFloat((sum / reviews.length).toFixed(1));
    }

    res.render('pages/product', {
      title: `${product.name} - Grão Nobre`,
      meta_description: product.meta_description || product.description?.slice(0, 160) || '',
      product,
      relatedProducts,
      crossSellProducts,
      recentBuyersCount,
      reviews,
      avgRating,
      ratingCounts,
      reviewsCount: reviews.length
    });
  } catch (error) {
    console.error('Product details page error:', error);
    res.status(500).render('pages/error', {
      title: 'Erro no Servidor',
      message: 'Erro ao carregar detalhes do produto.',
      status: 500
    });
  }
};

const renderFavorites = async (req, res) => {
  try {
    res.render('pages/favorites', {
      title: 'Meus Favoritos - Grão Nobre',
      meta_description: 'Veja os seus cafés favoritos salvos na sua lista de desejos.'
    });
  } catch (error) {
    console.error('Favorites page error:', error);
    res.status(500).render('pages/error', {
      title: 'Erro no Servidor',
      message: 'Erro ao carregar favoritos.',
      status: 500
    });
  }
};

const submitReview = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const { product_id, rating, comment } = req.body;
  const user_id = req.user.id;

  try {
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      where: { product_id, user_id }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Você já avaliou este produto.' });
    }

    const review = await Review.create({
      product_id,
      user_id,
      rating,
      comment,
      is_approved: false // Admin approval is required for safety
    });

    return res.status(201).json({
      message: 'Avaliação enviada com sucesso! Ela estará visível assim que for aprovada pela nossa equipe.'
    });
  } catch (error) {
    console.error('Review submit error:', error);
    return res.status(500).json({ error: 'Erro ao registrar avaliação.' });
  }
};

// API Endpoints
const getProductsAPI = async (req, res) => {
  try {
    const { q, category, min, max, sort, page } = req.query;

    const limit = parseInt(req.query.limit, 10) || 10;
    const currentPage = parseInt(page, 10) || 1;
    const offset = (currentPage - 1) * limit;

    const whereClause = { is_active: true };

    if (q && q.trim() !== '') {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${q.trim()}%` } },
        { sku: { [Op.like]: `%${q.trim()}%` } }
      ];
    }

    if (req.query.ids) {
      const ids = req.query.ids.split(',').filter(id => id.trim() !== '');
      if (ids.length > 0) {
        whereClause.id = { [Op.in]: ids };
      }
    }

    if (category) {
      const activeCategory = await Category.findOne({ where: { slug: category } });
      if (activeCategory) {
        whereClause.category_id = activeCategory.id;
      }
    }

    const minPrice = parseFloat(min);
    const maxPrice = parseFloat(max);
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      whereClause.price = { [Op.between]: [minPrice, maxPrice] };
    } else if (!isNaN(minPrice)) {
      whereClause.price = { [Op.gte]: minPrice };
    } else if (!isNaN(maxPrice)) {
      whereClause.price = { [Op.lte]: maxPrice };
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'price_asc') {
      order = [['price', 'ASC']];
    } else if (sort === 'price_desc') {
      order = [['price', 'DESC']];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order,
      limit,
      offset
    });

    return res.json({
      products,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage
    });
  } catch (error) {
    console.error('API products list error:', error);
    return res.status(500).json({ error: 'Erro ao buscar lista de produtos.' });
  }
};

const getProductBySlugAPI = async (req, res) => {
  const { slug } = req.params;

  try {
    const product = await Product.findOne({
      where: { slug, is_active: true },
      include: [{
        model: Review,
        as: 'reviews',
        where: { is_approved: true },
        required: false,
        include: [{ model: User, as: 'user', attributes: ['name'] }]
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    return res.json({ product });
  } catch (error) {
    console.error('API single product error:', error);
    return res.status(500).json({ error: 'Erro ao buscar detalhes do produto.' });
  }
};

module.exports = {
  renderHome,
  renderCatalog,
  renderProductDetail,
  renderFavorites,
  submitReview,
  getProductsAPI,
  getProductBySlugAPI
};
