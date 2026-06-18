const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'grao_nobre_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'grao_nobre_refresh_secret';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const verifyJWT = async (req, res, next) => {
  // Make user null by default in EJS locals
  res.locals.user = null;

  const accessToken = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
  const refreshToken = req.cookies?.refresh_token;

  if (!accessToken) {
    if (refreshToken) {
      // Try to rotate using refresh token
      try {
        const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findByPk(decodedRefresh.id);
        if (!user) {
          return handleAuthFailure(req, res, next);
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user);

        // Set new cookie
        res.cookie('access_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });

        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        };
        res.locals.user = req.user;
        return next();
      } catch (err) {
        return handleAuthFailure(req, res, next);
      }
    } else {
      return handleAuthFailure(req, res, next);
    }
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
    return next();
  } catch (err) {
    // If access token expired, check refresh token
    if (err.name === 'TokenExpiredError' && refreshToken) {
      try {
        const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findByPk(decodedRefresh.id);
        if (!user) {
          return handleAuthFailure(req, res, next);
        }

        const newAccessToken = generateAccessToken(user);

        res.cookie('access_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000
        });

        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        };
        res.locals.user = req.user;
        return next();
      } catch (refreshErr) {
        return handleAuthFailure(req, res, next);
      }
    }

    return handleAuthFailure(req, res, next);
  }
};

const handleAuthFailure = (req, res, next) => {
  // If it's an API route, return 401 JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Não autorizado. Faça login novamente.' });
  }
  // Otherwise, clear cookies and let them browse as guest (or redirect if accessing restricted pages)
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  // Let public HTML routes pass, but mark req.user as null
  req.user = null;
  res.locals.user = null;
  
  // Restricted page check
  const restrictedPaths = ['/checkout', '/pedidos', '/admin'];
  const isRestricted = restrictedPaths.some(path => req.originalUrl.startsWith(path));
  
  if (isRestricted) {
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    return res.status(403).render('pages/error', {
      title: 'Acesso Proibido',
      message: 'Você não tem permissão para acessar esta página.',
      status: 403
    });
  }
  next();
};

// Optional middleware just to load user context without forcing authentication
const loadUserContext = async (req, res, next) => {
  res.locals.user = null;
  const accessToken = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET);
      req.user = decoded;
      res.locals.user = decoded;
      return next();
    } catch (err) {
      // ignore, check refresh below
    }
  }

  if (refreshToken) {
    try {
      const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      const user = await User.findByPk(decodedRefresh.id);
      if (user) {
        const newAccessToken = generateAccessToken(user);
        res.cookie('access_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000
        });
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
        res.locals.user = req.user;
      }
    } catch (err) {
      // invalid refresh
    }
  }
  next();
};

module.exports = {
  verifyJWT,
  requireAdmin,
  loadUserContext,
  generateAccessToken
};
