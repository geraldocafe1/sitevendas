const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Load models to ensure associations are registered
require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const blogRoutes = require('./routes/blog');

const app = express();

// 1. Performance: GZIP Compression
app.use(compression());

// 2. Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 3. Security: Helmet with Custom CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com", 
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "https://cdn.jsdelivr.net", 
        "https://www.googletagmanager.com", 
        "https://connect.facebook.net"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com", 
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://picsum.photos", 
        "https://fastly.picsum.photos", 
        "https://api.qrserver.com",
        "https://www.google-analytics.com",
        "https://www.facebook.com"
      ],
      connectSrc: [
        "'self'", 
        "https://viacep.com.br", 
        "https://www.google-analytics.com"
      ]
    }
  }
}));

// 4. Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Muitas requisições vindas deste IP, tente novamente em 15 minutos.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 logins/registers per window
  message: { error: 'Muitas tentativas de login/cadastro. Tente novamente em 15 minutos.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// 5. Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Load user context globally from JWT cookies
const { loadUserContext } = require('./middlewares/auth');
app.use(loadUserContext);

// 6. Session Setup (for CSRF and UI messages)
app.use(session({
  secret: process.env.SESSION_SECRET || 'grao_nobre_session_secret_key_2026',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 7. CSRF Protection Middleware
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  
  res.locals.csrfToken = req.session.csrfToken;

  // Validate CSRF token on modifying Web HTML requests (excluding APIs which use JWT headers)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (!req.originalUrl.startsWith('/api/')) {
      const formToken = req.body._csrf;
      if (!formToken || formToken !== req.session.csrfToken) {
        return res.status(403).render('pages/error', {
          title: 'Acesso Negado (CSRF)',
          message: 'Sessão inválida ou expirada. Por favor, recarregue a página.',
          status: 403
        });
      }
    }
  }
  next();
});

// 8. View Engine & Static Files
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

// Set up Cache-Control headers for static files (Performance)
app.use('/css', express.static(path.join(__dirname, '../public/css'), { maxAge: '30d' }));
app.use('/js', express.static(path.join(__dirname, '../public/js'), { maxAge: '7d' }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), { maxAge: '30d' }));

// Set store name/details globally in EJS
app.use((req, res, next) => {
  res.locals.storeName = process.env.STORE_NAME || 'Grão Nobre';
  res.locals.storeUrl = process.env.STORE_URL || 'http://localhost:3000';
  res.locals.whatsappNumber = process.env.WHATSAPP_NUMBER || '5511999999999';
  res.locals.gaId = process.env.GA_MEASUREMENT_ID || '';
  res.locals.gtmId = process.env.GTM_ID || '';
  res.locals.pixelId = process.env.META_PIXEL_ID || '';
  next();
});

// 9. SEO Pages: Robots.txt & Sitemap.xml
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /admin/
Disallow: /api/
Sitemap: ${process.env.STORE_URL || 'http://localhost:3000'}/sitemap.xml
`);
});

app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  
  const { Product, Post } = require('./models');
  const baseUrl = process.env.STORE_URL || 'http://localhost:3000';
  
  try {
    const products = await Product.findAll({ where: { is_active: true } });
    const posts = await Post.findAll({ where: { is_published: true } });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/produtos</loc>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/carrinho</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/registrar</loc>
    <priority>0.5</priority>
  </url>`;

    products.forEach(p => {
      xml += `
  <url>
    <loc>${baseUrl}/produtos/${p.slug}</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>`;
    });

    posts.forEach(p => {
      xml += `
  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`;
    });

    xml += `
</urlset>`;
    res.send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// 10. Register Web and API Routes
app.use(authRoutes);
app.use(productRoutes);
app.use(cartRoutes);
app.use(checkoutRoutes);
app.use(orderRoutes);
app.use(adminRoutes);
app.use(blogRoutes);

// 11. Error Handling Middlewares

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('pages/error', {
    title: 'Página Não Encontrada',
    message: 'A página que você tentou acessar não existe ou foi removida.',
    status: 404
  });
});

// 500 handler (no stack traces in production)
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  const status = err.status || 500;
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({ error: 'Erro interno no servidor.' });
  }

  res.status(status).render('pages/error', {
    title: 'Erro Interno',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado do nosso lado. Por favor, tente novamente mais tarde.',
    status
  });
});

module.exports = app;
