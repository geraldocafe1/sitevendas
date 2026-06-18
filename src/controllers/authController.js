const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendWelcomeEmail } = require('../services/emailService');
const { generateAccessToken } = require('../middlewares/auth');
require('dotenv').config();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'grao_nobre_refresh_secret';

const register = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const { name, email, password, phone } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      phone,
      role: 'customer'
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Set secure HTTP-only cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send welcome email in background
    sendWelcomeEmail(user.email, user.name).catch(err => console.error('Error sending welcome email:', err));

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao criar conta.' });
  }
};

const login = async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ errors: req.validationErrors });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao realizar login.' });
  }
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Sem refresh token. Acesso negado.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    const newAccessToken = generateAccessToken(user);

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    return res.status(200).json({ message: 'Token atualizado com sucesso.' });
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(401).json({ error: 'Token expirado ou inválido.' });
  }
};

const logout = (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(200).json({ message: 'Logout concluído.' });
  }
  return res.redirect('/');
};

// HTML rendering actions
const renderLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('pages/login', { 
    title: 'Entrar - Grão Nobre',
    meta_description: 'Faça login na sua conta da Grão Nobre para acompanhar seus pedidos e gerenciar seus favoritos.',
    redirect: req.query.redirect || '/'
  });
};

const renderRegister = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('pages/register', { 
    title: 'Criar Conta - Grão Nobre',
    meta_description: 'Crie sua conta na Grão Nobre para comprar os melhores cafés especiais do Brasil.',
    redirect: req.query.redirect || '/'
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  renderLogin,
  renderRegister
};
