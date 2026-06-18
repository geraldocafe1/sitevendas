const { Post, User } = require('../models');

const renderBlogIndex = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { is_published: true },
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [['published_at', 'DESC']]
    });

    res.render('pages/blog/index', {
      title: 'Blog Grão Nobre - Dicas e Curiosidades sobre Café',
      meta_description: 'Aprenda tudo sobre cafés especiais, métodos de extração, moagem, história do café e receitas exclusivas no blog da Grão Nobre.',
      posts
    });
  } catch (error) {
    console.error('Blog index error:', error);
    res.status(500).render('pages/error', {
      title: 'Erro no Servidor',
      message: 'Erro ao carregar os posts do blog.',
      status: 500
    });
  }
};

const renderBlogPost = async (req, res) => {
  const { slug } = req.params;

  try {
    const post = await Post.findOne({
      where: { slug, is_published: true },
      include: [{ model: User, as: 'author', attributes: ['name'] }]
    });

    if (!post) {
      return res.status(404).render('pages/error', {
        title: 'Post não encontrado',
        message: 'O artigo que você procura não está publicado ou foi removido.',
        status: 404
      });
    }

    res.render('pages/blog/post', {
      title: `${post.title} - Blog Grão Nobre`,
      meta_description: post.meta_description || post.excerpt || '',
      post
    });
  } catch (error) {
    console.error('Blog post rendering error:', error);
    res.status(500).render('pages/error', {
      title: 'Erro no Servidor',
      message: 'Erro ao carregar artigo do blog.',
      status: 500
    });
  }
};

module.exports = {
  renderBlogIndex,
  renderBlogPost
};
