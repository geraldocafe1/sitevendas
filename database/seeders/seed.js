const bcrypt = require('bcryptjs');
const { User, Category, Product, Coupon, Review, Post, sequelize } = require('../../src/models');

const seed = async () => {
  console.log('Starting database seeding...');
  
  // Sync the schema (drops all tables and recreates them to ensure clean state)
  await sequelize.sync({ force: true });
  console.log('Database tables cleared and recreated.');

  try {
    // 1. Users
    const adminPassHash = bcrypt.hashSync('admin123', 10);
    const customerPassHash = bcrypt.hashSync('cliente123', 10);

    const admin = await User.create({
      name: 'Administrador Nobre',
      email: 'admin@loja.com',
      password_hash: adminPassHash,
      role: 'admin',
      phone: '5511999999999'
    });

    const user1 = await User.create({
      name: 'João da Silva',
      email: 'joao@gmail.com',
      password_hash: customerPassHash,
      role: 'customer',
      phone: '5511988888888'
    });

    const user2 = await User.create({
      name: 'Maria Santos',
      email: 'maria@gmail.com',
      password_hash: customerPassHash,
      role: 'customer',
      phone: '5521977777777'
    });

    console.log('Users seeded.');

    // 2. Categories
    const cat1 = await Category.create({
      name: 'Grãos Especiais',
      slug: 'graos-especiais',
      image_url: '/images/category_grains.png',
      description: 'Cafés especiais inteiros em grãos para você moer na hora e apreciar o máximo frescor.'
    });

    const cat2 = await Category.create({
      name: 'Café Moído',
      slug: 'cafe-moido',
      image_url: '/images/category_ground.png',
      description: 'Cafés moídos na granulometria ideal para filtro, prensa francesa ou cafeteira italiana.'
    });

    const cat3 = await Category.create({
      name: 'Cápsulas Especiais',
      slug: 'capsulas-especiais',
      image_url: '/images/category_capsules.png',
      description: 'Cápsulas compatíveis Nespresso contendo microlotes gourmet e notas marcantes.'
    });

    const cat4 = await Category.create({
      name: 'Acessórios',
      slug: 'acessorios',
      image_url: '/images/category_accessories.png',
      description: 'Moedores, prensas, filtros, chaleiras de bico de ganso e tudo que o barista precisa.'
    });

    const cat5 = await Category.create({
      name: 'Kits & Presentes',
      slug: 'kits-presentes',
      image_url: '/images/category_gifts.png',
      description: 'Kits especiais combinando grãos e acessórios em embalagens premium para presentear.'
    });

    console.log('Categories seeded.');

    // 3. Products (20 products)
    const p1 = await Product.create({
      name: 'Café Mogiana Paulista 250g',
      slug: 'cafe-mogiana-paulista-250g',
      description: 'Café encorpado com acidez média, aroma adocicado com notas de chocolate ao leite e caramelo. Torra média, cultivado na região da Alta Mogiana Paulista a 1050m de altitude. Variedade Catuaí Amarelo.',
      price: 39.90,
      compare_price: 45.00,
      stock: 45,
      sku: 'CAF-MOG-250',
      category_id: cat1.id,
      images: ['/images/products/cafe_grains_mogiana.png'],
      weight_kg: 0.250,
      is_featured: true,
      is_active: true,
      meta_title: 'Café Mogiana Paulista 250g | Grão Nobre',
      meta_description: 'Café gourmet 100% arábica com notas de chocolate e caramelo. Compre café especial Alta Mogiana.'
    });

    const p2 = await Product.create({
      name: 'Cerrado Mineiro Microlote 250g',
      slug: 'cerrado-mineiro-microlote-250g',
      description: 'Café adocicado e frutado com notas marcantes de pêssego e caramelo. Excelente para métodos filtrados. Notas sensoriais ricas e acidez cítrica refrescante. Cultivado na Região do Cerrado Mineiro a 1150m.',
      price: 49.90,
      compare_price: 59.90,
      stock: 30,
      sku: 'CAF-CER-250',
      category_id: cat1.id,
      images: ['/images/products/cafe_grains_cerrado.png'],
      weight_kg: 0.250,
      is_featured: true,
      is_active: true,
      meta_title: 'Cerrado Mineiro Microlote 250g | Grão Nobre',
      meta_description: 'Café especial com notas de pêssego e caramelo. Edição limitada Cerrado Mineiro.'
    });

    const p3 = await Product.create({
      name: 'Café Bourbon Amarelo Sul de Minas 250g',
      slug: 'cafe-bourbon-amarelo-sul-de-minas-250g',
      description: 'Clássico Bourbon Amarelo. Aroma floral intenso, corpo aveludado e notas marcantes de mel e castanhas. Retrogosto persistente e limpo. Altitude 1200m.',
      price: 42.00,
      compare_price: null,
      stock: 25,
      sku: 'CAF-BOU-250',
      category_id: cat1.id,
      images: ['/images/products/cafe_grains_bourbon.png'],
      weight_kg: 0.250,
      is_featured: false,
      is_active: true,
      meta_title: 'Bourbon Amarelo Sul de Minas | Grão Nobre',
      meta_description: 'Compre Café Especial Bourbon Amarelo do Sul de Minas Gerais. Corpo aveludado com notas de mel.'
    });

    const p4 = await Product.create({
      name: 'Microlote Geisha Chapada Diamantina 250g',
      slug: 'microlote-geisha-chapada-diamantina-250g',
      description: 'Lote raríssimo da variedade Geisha. Aroma cítrico e floral lembrando jasmim e bergamota. Acidez brilhante e corpo leve. Um café para ocasiões especiais.',
      price: 129.90,
      compare_price: 145.00,
      stock: 8, // Low stock on purpose
      sku: 'CAF-GEI-250',
      category_id: cat1.id,
      images: ['/images/products/cafe_grains_geisha.png'],
      weight_kg: 0.250,
      is_featured: true,
      is_active: true,
      meta_title: 'Café Geisha Chapada Diamantina | Grão Nobre',
      meta_description: 'Compre o raro Café Geisha cultivado na Chapada Diamantina. Notas de jasmim e acidez cítrica.'
    });

    const p5 = await Product.create({
      name: 'Café Orgânico Demeter 250g',
      slug: 'cafe-organico-demeter-250g',
      description: 'Café biodinâmico orgânico, cultivado sem agrotóxicos ou fertilizantes sintéticos. Sabor suave com notas de cana-de-açúcar e acidez cítrica equilibrada.',
      price: 46.00,
      compare_price: null,
      stock: 20,
      sku: 'CAF-ORG-250',
      category_id: cat1.id,
      images: ['/images/products/cafe_grains_organico.png'],
      weight_kg: 0.250,
      is_featured: false,
      is_active: true,
      meta_title: 'Café Orgânico Biodinâmico | Grão Nobre',
      meta_description: 'Café orgânico cultivado em harmonia com a natureza. Notas de cana-de-açúcar.'
    });

    const p6 = await Product.create({
      name: 'Mogiana Paulista Moído 250g',
      slug: 'mogiana-paulista-moido-250g',
      description: 'Nosso clássico Mogiana Paulista moído na granulometria média, perfeito para filtro de papel e cafeteiras elétricas.',
      price: 39.90,
      compare_price: null,
      stock: 40,
      sku: 'MOI-MOG-250',
      category_id: cat2.id,
      images: ['/images/products/cafe_ground_bag.png'],
      weight_kg: 0.250,
      is_featured: false,
      is_active: true,
      meta_title: 'Mogiana Paulista Moído 250g | Grão Nobre',
      meta_description: 'Café especial moído pronto para extração por filtro.'
    });

    const p7 = await Product.create({
      name: 'Cerrado Mineiro Moído 250g',
      slug: 'cerrado-mineiro-moido-250g',
      description: 'Microlote do Cerrado Mineiro com moagem média para coados. Notas de caramelo e chocolate.',
      price: 49.90,
      compare_price: null,
      stock: 35,
      sku: 'MOI-CER-250',
      category_id: cat2.id,
      images: ['/images/products/cafe_ground_bag.png'],
      weight_kg: 0.250,
      is_featured: false,
      is_active: true,
      meta_title: 'Cerrado Mineiro Moído 250g | Grão Nobre',
      meta_description: 'Café especial do Cerrado Mineiro moído para filtro.'
    });

    const p8 = await Product.create({
      name: 'Bourbon Amarelo Sul de Minas Moído 250g',
      slug: 'bourbon-amarelo-sul-de-minas-moido-250g',
      description: 'Café Bourbon Amarelo moído com notas de mel e avelã. Torra média fresca.',
      price: 42.00,
      compare_price: null,
      stock: 30,
      sku: 'MOI-BOU-250',
      category_id: cat2.id,
      images: ['/images/products/cafe_ground_bag.png'],
      weight_kg: 0.250,
      is_featured: false,
      is_active: true,
      meta_title: 'Bourbon Amarelo Sul de Minas Moído | Grão Nobre',
      meta_description: 'Bourbon Amarelo moído fresco com notas de mel.'
    });

    const p9 = await Product.create({
      name: 'Café Espresso Gourmet Moído 250g',
      slug: 'cafe-espresso-gourmet-moido-250g',
      description: 'Blend encorpado com torra escura e moagem fina específica para máquinas de café espresso domésticas ou profissionais.',
      price: 45.00,
      compare_price: null,
      stock: 50,
      sku: 'MOI-ESP-250',
      category_id: cat2.id,
      images: ['/images/products/cafe_ground_bag.png'],
      weight_kg: 0.250,
      is_featured: false,
      is_active: true,
      meta_title: 'Café Moído para Espresso | Grão Nobre',
      meta_description: 'Moagem fina especial para espresso de cafeteiras domésticas.'
    });

    const p10 = await Product.create({
      name: 'Café Descafeinado Premium Moído 250g',
      slug: 'cafe-descafeinado-premium-moido-250g',
      description: 'Café especial descafeinado pelo método natural de água (Swiss Water). Preserva todo o aroma e sabor sem cafeína.',
      price: 48.00,
      compare_price: null,
      stock: 15,
      sku: 'MOI-DEC-250',
      category_id: cat2.id,
      images: ['/images/products/cafe_ground_bag.png'],
      weight_kg: 0.250,
      is_featured: false,
      is_active: true,
      meta_title: 'Café Descafeinado Moído Swiss Water | Grão Nobre',
      meta_description: 'Café descafeinado 100% arábica pelo processo natural.'
    });

    const p11 = await Product.create({
      name: 'Cápsulas Ristretto Intenso - 10 Unidades',
      slug: 'capsulas-ristretto-intenso-10-unidades',
      description: 'Cápsulas compatíveis Nespresso. Café de torra escura, encorpado e com retrogosto de cacau persistente. Intensidade 10.',
      price: 24.90,
      compare_price: null,
      stock: 100,
      sku: 'CAP-RIS-010',
      category_id: cat3.id,
      images: ['/images/products/cafe_capsules_box.png'],
      weight_kg: 0.050,
      is_featured: false,
      is_active: true,
      meta_title: 'Cápsulas Ristretto Intenso | Grão Nobre',
      meta_description: 'Cápsulas de alumínio compatíveis Nespresso de intensidade 10.'
    });

    const p12 = await Product.create({
      name: 'Cápsulas Mogiana Caramelo - 10 Unidades',
      slug: 'capsulas-mogiana-caramelo-10-unidades',
      description: 'Café suave com dulçor acentuado em cápsulas compatíveis Nespresso. Notas naturais de caramelo. Intensidade 6.',
      price: 24.90,
      compare_price: null,
      stock: 80,
      sku: 'CAP-MOG-010',
      category_id: cat3.id,
      images: ['/images/products/cafe_capsules_box.png'],
      weight_kg: 0.050,
      is_featured: false,
      is_active: true,
      meta_title: 'Cápsulas Mogiana Caramelo Nespresso | Grão Nobre',
      meta_description: 'Cápsulas compatíveis Nespresso de intensidade 6 e notas de caramelo.'
    });

    const p13 = await Product.create({
      name: 'Cápsulas Cerrado Chocolate - 10 Unidades',
      slug: 'capsulas-cerrado-chocolate-10-unidades',
      description: 'Blend de grãos selecionados do Cerrado Mineiro em cápsulas de alumínio. Corpo médio, notas marcantes de chocolate meio amargo. Intensidade 8.',
      price: 24.90,
      compare_price: null,
      stock: 75,
      sku: 'CAP-CHO-010',
      category_id: cat3.id,
      images: ['/images/products/cafe_capsules_box.png'],
      weight_kg: 0.050,
      is_featured: false,
      is_active: true,
      meta_title: 'Cápsulas Cerrado Chocolate Nespresso | Grão Nobre',
      meta_description: 'Cápsulas compatíveis Nespresso com notas de chocolate. Intensidade 8.'
    });

    const p14 = await Product.create({
      name: 'Cápsulas Lungo Orgânico - 10 Unidades',
      slug: 'capsulas-lungo-organico-10-unidades',
      description: 'Cápsulas biodegradáveis compatíveis Nespresso. Café orgânico suave e equilibrado, ideal para xícaras longas de 110ml. Intensidade 5.',
      price: 26.90,
      compare_price: null,
      stock: 60,
      sku: 'CAP-LUN-010',
      category_id: cat3.id,
      images: ['/images/products/cafe_capsules_box.png'],
      weight_kg: 0.050,
      is_featured: false,
      is_active: true,
      meta_title: 'Cápsulas Lungo Orgânico Biodegradável | Grão Nobre',
      meta_description: 'Cápsulas biodegradáveis compatíveis Nespresso. Café orgânico suave.'
    });

    const p15 = await Product.create({
      name: 'Moedor de Café Manual Ajustável Inox',
      slug: 'moedor-de-cafe-manual-ajustavel-inox',
      description: 'Moedor com lâminas de cerâmica cônicas e corpo em aço inoxidável. Regulagem fina de moagem para diversos métodos de extração (filtro, espresso, prensa).',
      price: 99.00,
      compare_price: 120.00,
      stock: 12,
      sku: 'ACE-MOE-MAN',
      category_id: cat4.id,
      images: ['/images/products/moedor_inox.png'],
      weight_kg: 0.350,
      is_featured: true,
      is_active: true,
      meta_title: 'Moedor de Café Manual Inox Lâmina Cerâmica | Grão Nobre',
      meta_description: 'Moedor manual de aço inoxidável com engrenagem ajustável para moagem de grãos de café.'
    });

    const p16 = await Product.create({
      name: 'Prensa Francesa de Vidro Borossilicato 600ml',
      slug: 'prensa-francesa-de-vidro-borossilicato-600ml',
      description: 'Cafeteira francesa com jarra de vidro borossilicato resistente a choques térmicos e filtro de prensa em inox duplo. Capacidade 600ml.',
      price: 79.90,
      compare_price: 89.90,
      stock: 18,
      sku: 'ACE-PRE-FRA',
      category_id: cat4.id,
      images: ['/images/products/prensa_francesa.png'],
      weight_kg: 0.400,
      is_featured: false,
      is_active: true,
      meta_title: 'Prensa Francesa Vidro Borossilicato 600ml | Grão Nobre',
      meta_description: 'Prensa francesa de alta qualidade com filtro duplo de metal. Jarra resistente.'
    });

    const p17 = await Product.create({
      name: 'Balança Digital de Precisão com Timer',
      slug: 'balanca-digital-de-precisao-com-timer',
      description: 'Balança digital ideal para baristas. Medição precisa até 0.1g, capacidade até 3kg e cronômetro integrado para controle exato da infusão do seu café.',
      price: 119.00,
      compare_price: null,
      stock: 4, // Low stock alert
      sku: 'ACE-BAL-TIM',
      category_id: cat4.id,
      images: ['/images/products/balanca_digital.png'],
      weight_kg: 0.280,
      is_featured: false,
      is_active: true,
      meta_title: 'Balança Digital Barista com Cronômetro | Grão Nobre',
      meta_description: 'Balança de precisão de 0.1g com timer integrado para extração de café.'
    });

    const p18 = await Product.create({
      name: 'Kit Barista Iniciante Coado',
      slug: 'kit-barista-iniciante-coado',
      description: 'Kit contendo: 1 Moedor Manual Inox, 1 Suporte para Filtro V60 acrílico, 1 pacote de filtros de papel V60 e 1 pacote de Café Bourbon Amarelo 250g.',
      price: 169.90,
      compare_price: 199.90,
      stock: 15,
      sku: 'KIT-BAR-INI',
      category_id: cat5.id,
      images: ['/images/products/kit_barista.png'],
      weight_kg: 0.900,
      is_featured: true,
      is_active: true,
      meta_title: 'Kit Barista Iniciante Café Coado V60 | Grão Nobre',
      meta_description: 'Kit barista completo com moedor, suporte V60, papéis e café bourbon. Compre online.'
    });

    const p19 = await Product.create({
      name: 'Kit Premium Grãos Especiais',
      slug: 'kit-premium-graos-especiais',
      description: 'Seleção dos nossos 3 melhores cafés em grãos: Cerrado Mineiro 250g, Sul de Minas 250g e Alta Mogiana 250g. Embalado em caixa de MDF presenteável.',
      price: 119.90,
      compare_price: null,
      stock: 20,
      sku: 'KIT-PRE-GRA',
      category_id: cat5.id,
      images: ['/images/products/kit_premium.png'],
      weight_kg: 0.950,
      is_featured: false,
      is_active: true,
      meta_title: 'Kit Presente Grãos Especiais Caixa MDF | Grão Nobre',
      meta_description: 'Seleção premium de 3 cafés gourmet 250g em caixa presenteável.'
    });

    const p20 = await Product.create({
      name: 'Kit Experiência Prensa Francesa',
      slug: 'kit-experiencia-prensa-francesa',
      description: 'Kit contendo: 1 Prensa Francesa de Vidro 600ml e 1 pacote de Café Cerrado Mineiro 250g moído na granulometria grossa ideal para o método.',
      price: 124.90,
      compare_price: 139.90,
      stock: 10,
      sku: 'KIT-EXP-PRE',
      category_id: cat5.id,
      images: ['/images/products/kit_prensa.png'],
      weight_kg: 0.800,
      is_featured: false,
      is_active: true,
      meta_title: 'Kit Prensa Francesa e Café Especial Moído | Grão Nobre',
      meta_description: 'Kit para preparar café na prensa francesa. Jarra 600ml e café Cerrado Mineiro.'
    });

    console.log('20 Products seeded.');

    // 4. Coupons
    await Coupon.create({
      code: 'BEMVINDO10',
      type: 'percent',
      value: 10.00,
      min_order_value: 0.00,
      max_uses: 1000,
      used_count: 0,
      expires_at: null,
      is_active: true
    });

    await Coupon.create({
      code: 'FRETE20',
      type: 'fixed',
      value: 20.00,
      min_order_value: 150.00,
      max_uses: 500,
      used_count: 0,
      expires_at: null,
      is_active: true
    });

    console.log('Coupons seeded.');

    // 5. Reviews (10 reviews)
    await Review.create({ product_id: p1.id, user_id: user1.id, rating: 5, comment: 'Que café aromático! O sabor de caramelo e chocolate é nítido.', is_approved: true });
    await Review.create({ product_id: p1.id, user_id: user2.id, rating: 4, comment: 'Muito encorpado, torra de excelente qualidade.', is_approved: true });
    await Review.create({ product_id: p2.id, user_id: user1.id, rating: 5, comment: 'Excelente microlote! Aroma frutado incrível.', is_approved: true });
    await Review.create({ product_id: p2.id, user_id: user2.id, rating: 5, comment: 'Notas de pêssego muito pronunciadas no filtro de papel.', is_approved: true });
    await Review.create({ product_id: p3.id, user_id: user1.id, rating: 4, comment: 'Café bourbon muito doce e suave.', is_approved: true });
    await Review.create({ product_id: p4.id, user_id: user2.id, rating: 5, comment: 'Uma joia rara da Chapada Diamantina. Acidez brilhante!', is_approved: true });
    await Review.create({ product_id: p15.id, user_id: user1.id, rating: 5, comment: 'Moedor de inox muito resistente e de fácil regulagem.', is_approved: true });
    await Review.create({ product_id: p16.id, user_id: user2.id, rating: 4, comment: 'O vidro é bem grosso e o filtro duplo segura bem os resíduos.', is_approved: true });
    await Review.create({ product_id: p18.id, user_id: user1.id, rating: 5, comment: 'Excelente para quem está começando nos coados. Moedor e V60 andam juntos!', is_approved: true });
    await Review.create({ product_id: p20.id, user_id: user2.id, rating: 5, comment: 'A prensa funciona super bem e a moagem do café veio perfeita.', is_approved: true });

    console.log('10 Reviews seeded.');

    // 6. Blog Posts (3 posts for content SEO)
    await Post.create({
      title: 'Como preparar o café perfeito na Prensa Francesa',
      slug: 'como-preparar-cafe-prensa-francesa',
      content: `
        <p>A prensa francesa é um dos métodos mais tradicionais e práticos para extrair o melhor do café especial. Por não utilizar filtro de papel, ela preserva os óleos essenciais do grão, proporcionando uma bebida encorpada, aromática e cheia de textura.</p>
        
        <h3>Passo a Passo para a Extração Perfeita:</h3>
        <ol>
          <li><strong>Moagem Grossa:</strong> Use grãos com moagem grossa (similar a sal grosso). Se moer fino demais, os resíduos passarão pelo êmbolo de metal.</li>
          <li><strong>Proporção ideal:</strong> Recomendamos a proporção de 7g a 10g de café para cada 100ml de água.</li>
          <li><strong>Pré-infusão:</strong> Aqueça a jarra de vidro com água quente (descarte em seguida). Adicione o pó e jogue cerca de 50ml de água quente (em torno de 93°C). Mexa levemente e espere 30 segundos.</li>
          <li><strong>Infusão:</strong> Complete com o restante da água, coloque a tampa com o êmbolo levantado e deixe em infusão por 4 minutos.</li>
          <li><strong>Pressione devagar:</strong> Pressione o êmbolo lentamente até o fundo. Sirva imediatamente para interromper a extração e evitar amargor excessivo.</li>
        </ol>

        <p>Experimente esse método e redescubra seus cafés especiais preferidos!</p>
      `,
      excerpt: 'Aprenda o passo a passo definitivo para extrair um café encorpado e aromático usando a cafeteira prensa francesa.',
      cover_image: '/images/blog/blog_cover_prensa.png',
      author_id: admin.id,
      meta_title: 'Como Fazer Café Perfeito na Prensa Francesa | Blog Grão Nobre',
      meta_description: 'Guia completo de como preparar café na prensa francesa. Moagem correta, proporções e segredos do barista.',
      is_published: true,
      published_at: new Date()
    });

    await Post.create({
      title: 'Diferenças essenciais entre Café Arábica e Café Robusta (Conilon)',
      slug: 'diferencas-cafe-arabica-robusta',
      content: `
        <p>Você já se perguntou por que as embalagens de café gourmet destacam o termo "100% Arábica"? Entender a diferença entre as duas principais espécies de café comercializadas no mundo é fundamental para escolher a bebida certa.</p>
        
        <h3>1. Café Arábica (Coffea arabica):</h3>
        <p>O Arábica representa cerca de 60% da produção mundial. Cultivado em altitudes mais elevadas (acima de 800m), produz grãos com acidez equilibrada, doçura natural marcante e uma gama enorme de fragrâncias (frutado, floral, chocolate). Possui menos cafeína (cerca de 1.2% a 1.5%) e é o padrão de todos os <strong>cafés especiais</strong>.</p>
        
        <h3>2. Café Robusta ou Conilon (Coffea canephora):</h3>
        <p>O Robusta é uma planta mais resistente (daí o nome), cultivada em altitudes mais baixas. Possui quase o dobro de cafeína do Arábica (2.2% a 2.7%) e mais sólidos dissolvidos, o que resulta em uma bebida muito encorpada, porém com sabor mais amargo e neutro, lembrando notas de madeira ou cereal. É muito usado em blends de café tradicional de supermercado e cafés instantâneos.</p>

        <p>Na Grão Nobre, comercializamos apenas grãos 100% Arábica, garantindo complexidade sensorial e zero amargor indesejado nas suas xícaras.</p>
      `,
      excerpt: 'Entenda por que o café arábica é a escolha número um para cafés finos e gourmet, comparado com o robusta.',
      cover_image: '/images/blog/blog_cover_arabica.png',
      author_id: admin.id,
      meta_title: 'Café Arábica vs Robusta: Quais as Diferenças? | Blog Grão Nobre',
      meta_description: 'Saiba as diferenças sensoriais, físicas e de altitude entre as espécies de café arábica e robusta (conilon).',
      is_published: true,
      published_at: new Date()
    });

    await Post.create({
      title: 'O que são Notas Sensoriais e como identificá-las no Café',
      slug: 'notas-sensoriais-como-identificar',
      content: `
        <p>Chocolate, caramelo, frutas vermelhas, jasmim... Quando lemos essas notas descritivas na embalagem de um café especial, não significa que o café foi aromatizado artificialmente. O café é um fruto complexo e desenvolve centenas de compostos químicos naturais durante seu amadurecimento e torra.</p>
        
        <h3>O que determina as notas do café?</h3>
        <p>Fatores como o terroir (clima, solo, altitude), a variedade da planta (Bourbon, Catuaí, Geisha), o tipo de processamento pós-colheita (natural ou lavado) e, claro, o perfil de torra conduzido pelo mestre torrador.</p>

        <h3>Como começar a treinar seu paladar:</h3>
        <ul>
          <li><strong>Aroma seco:</strong> Cheire o pó de café logo após a moagem. Concentre-se nas primeiras memórias olfativas.</li>
          <li><strong>Espere esfriar um pouco:</strong> Bebidas extremamente quentes anestesiam as papilas gustativas. Deixe o café chegar a uma temperatura morna e agradável.</li>
          <li><strong>Deguste com atenção:</strong> Sinta a acidez nas laterais da língua, a doçura na ponta e a textura/corpo no céu da boca. O retrogosto (gosto que fica após engolir) também dá pistas valiosas!</li>
        </ul>

        <p>Treine diariamente e descubra um novo universo sensorial a cada nova xícara!</p>
      `,
      excerpt: 'Descubra como os cafés especiais adquirem nuances de sabores como chocolate e caramelo de forma 100% natural.',
      cover_image: '/images/blog/blog_cover_notas.png',
      author_id: admin.id,
      meta_title: 'Como Identificar Notas Sensoriais no Café Especial | Blog Grão Nobre',
      meta_description: 'Aprenda a treinar seu paladar para identificar notas de caramelo, chocolate e frutas em cafés arábica.',
      is_published: true,
      published_at: new Date()
    });

    console.log('3 Blog Posts seeded.');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
