const transporter = require('../config/email');
require('dotenv').config();

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@graonobre.com.br';
const STORE_NAME = process.env.STORE_NAME || 'Grão Nobre';

/**
 * Sends a transactional email using the transporter.
 * If sending fails due to missing credentials, it prints the email output to the console for development.
 */
const sendMailHelper = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"${STORE_NAME}" <${EMAIL_FROM}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`E-mail sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.warn(`[EMAIL BACKUP] Failed to send email via SMTP. Printing to console instead.`);
    console.log(`========================================`);
    console.log(`PARA: ${to}`);
    console.log(`ASSUNTO: ${subject}`);
    console.log(`CONTEÚDO (HTML):`);
    console.log(htmlContent);
    console.log(`========================================`);
    return { mock: true, messageId: `mock-${Date.now()}` };
  }
};

/**
 * Send welcome email to a new user
 */
const sendWelcomeEmail = async (email, name) => {
  const subject = `Bem-vindo à ${STORE_NAME}! ☕`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background-color: #0f172a; padding: 30px; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-family: 'Plus Jakarta Sans', sans-serif;">Grão Nobre</h1>
          <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 14px;">Cafés Especiais & Gourmet</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="font-size: 20px; margin-top: 0;">Olá, ${name}!</h2>
          <p>Ficamos extremamente felizes em ter você conosco na nossa jornada de sabor e aroma.</p>
          <p>Como membro da <strong>Grão Nobre</strong>, você terá acesso a uma seleção exclusiva dos melhores grãos do Brasil, colhidos e torrados com carinho artesanal.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.STORE_URL || 'http://localhost:3000'}/produtos" style="background-color: #f59e0b; color: #0f172a; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Ver Nosso Catálogo</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Este é um email transacional da loja Grão Nobre. Por favor, não responda a esta mensagem.</p>
        </div>
      </div>
    </div>
  `;
  return sendMailHelper(email, subject, html);
};

/**
 * Send order confirmation email to customer
 */
const sendOrderConfirmationEmail = async (order, items = []) => {
  const subject = `Pedido Confirmado #${order.id.slice(0, 8)} - ${STORE_NAME}`;
  
  const itemsRows = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.name || 'Produto'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">R$ ${parseFloat(item.unit_price).toFixed(2).replace('.', ',')}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">R$ ${parseFloat(item.total_price).toFixed(2).replace('.', ',')}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background-color: #0f172a; padding: 30px; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-family: 'Plus Jakarta Sans', sans-serif;">Pedido Confirmado!</h1>
          <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 14px;">Obrigado por comprar conosco</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Detalhes do Pedido #${order.id.slice(0, 8)}</h2>
          <p>Olá, <strong>${order.shipping_name}</strong>. Recebemos o seu pedido com sucesso! Veja o resumo abaixo:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Produto</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qtd</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Unit.</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="margin: 20px 0; text-align: right; font-size: 14px;">
            <p style="margin: 5px 0;">Subtotal: <strong>R$ ${parseFloat(order.subtotal).toFixed(2).replace('.', ',')}</strong></p>
            ${order.discount > 0 ? `<p style="margin: 5px 0; color: #ef4444;">Desconto: <strong>- R$ ${parseFloat(order.discount).toFixed(2).replace('.', ',')}</strong></p>` : ''}
            <p style="margin: 5px 0;">Frete: <strong>R$ ${parseFloat(order.shipping_cost).toFixed(2).replace('.', ',')}</strong></p>
            <h3 style="margin: 10px 0; font-size: 18px; color: #0f172a;">Total: <span style="color: #f59e0b;">R$ ${parseFloat(order.total).toFixed(2).replace('.', ',')}</span></h3>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #64748b;">Endereço de Entrega</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              ${order.shipping_address}<br />
              CEP: ${order.shipping_zip}<br />
              ${order.shipping_city} - ${order.shipping_state}
            </p>
            <h4 style="margin: 15px 0 5px 0; font-size: 14px; text-transform: uppercase; color: #64748b;">Método de Pagamento</h4>
            <p style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: bold;">
              ${order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'boleto' ? 'BOLETO BANCÁRIO' : 'CARTÃO DE CRÉDITO'}
            </p>
          </div>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.STORE_URL || 'http://localhost:3000'}/pedidos/${order.id}" style="background-color: #0f172a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Acompanhar Pedido</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Este é um email transacional da loja Grão Nobre. Por favor, não responda a esta mensagem.</p>
        </div>
      </div>
    </div>
  `;
  return sendMailHelper(order.shipping_email, subject, html);
};

/**
 * Send order status update email (Shipped / Cancelled)
 */
const sendOrderStatusUpdateEmail = async (order, status) => {
  let statusText = '';
  let statusMsg = '';
  let color = '#0f172a';
  let bannerText = '';

  if (status === 'shipped') {
    statusText = 'Enviado';
    statusMsg = 'Seu pedido foi coletado pela transportadora e está a caminho de sua casa! Em breve você receberá o código de rastreamento.';
    color = '#10b981'; // green
    bannerText = 'Seu pedido está a caminho! 🚚';
  } else if (status === 'cancelled') {
    statusText = 'Cancelado';
    statusMsg = 'Lamentamos informar que o seu pedido foi cancelado. Se você efetuou o pagamento, o estorno será processado nos próximos dias.';
    color = '#ef4444'; // red
    bannerText = 'Pedido Cancelado ❌';
  } else if (status === 'paid') {
    statusText = 'Pago';
    statusMsg = 'Confirmamos o recebimento do pagamento do seu pedido! Agora nossa equipe de baristas está preparando seu pacote com muito cuidado.';
    color = '#10b981'; // green
    bannerText = 'Pagamento Aprovado! 💳';
  } else {
    // Other statuses (delivered, etc.)
    statusText = status;
    statusMsg = `O status do seu pedido foi atualizado para: ${status}.`;
    bannerText = 'Atualização do seu pedido ☕';
  }

  const subject = `Atualização de Pedido #${order.id.slice(0, 8)}: ${statusText} - ${STORE_NAME}`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background-color: #0f172a; padding: 30px; text-align: center;">
          <h1 style="color: ${color}; margin: 0; font-size: 28px; font-family: 'Plus Jakarta Sans', sans-serif;">${bannerText}</h1>
          <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 14px;">Pedido #${order.id.slice(0, 8)}</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="font-size: 18px; margin-top: 0;">Olá, ${order.shipping_name}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">${statusMsg}</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 14px;">Status Atual: <strong style="color: ${color}; text-transform: uppercase;">${statusText}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Valor Total: <strong>R$ ${parseFloat(order.total).toFixed(2).replace('.', ',')}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Destinatário: <strong>${order.shipping_name}</strong></p>
          </div>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.STORE_URL || 'http://localhost:3000'}/pedidos/${order.id}" style="background-color: #0f172a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Ver Detalhes do Pedido</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Este é um email transacional da loja Grão Nobre. Por favor, não responda a esta mensagem.</p>
        </div>
      </div>
    </div>
  `;
  return sendMailHelper(order.shipping_email, subject, html);
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
};
