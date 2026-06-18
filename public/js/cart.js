// Cart and Wishlist client-side engine (Grão Nobre)
(function() {
  // Global States
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  let appliedCoupon = JSON.parse(localStorage.getItem('applied_coupon')) || null;

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    updateWishlistUI();
    setupCartListeners();
  });

  // CART CORE FUNCTIONS
  function addToCart(id, name, price, sku, weight, image, slug, qty = 1) {
    const existingIndex = cart.findIndex(item => item.id === id);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        id,
        name,
        price: parseFloat(price),
        sku,
        weight_kg: parseFloat(weight),
        image,
        slug,
        quantity: qty
      });
    }
    saveCart();
    updateCartUI();
    openCartDrawer();
  }

  function updateQty(id, newQty) {
    const idx = cart.findIndex(item => item.id === id);
    if (idx > -1) {
      cart[idx].quantity = parseInt(newQty, 10);
      if (cart[idx].quantity <= 0) {
        cart.splice(idx, 1);
      }
      saveCart();
      updateCartUI();
    }
  }

  function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  // WISHLIST CORE FUNCTIONS
  function toggleWishlist(id) {
    const index = wishlist.indexOf(id);
    if (index > -1) {
      wishlist.splice(index, 1); // remove
    } else {
      wishlist.push(id); // add
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
  }

  // DYNAMIC UI UPDATERS
  function updateCartUI() {
    // 1. Navigation Badges
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = cart.reduce((acc, curr) => acc + curr.quantity, 0);
      if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    // 2. Lateral Drawer Render
    const drawerContainer = document.getElementById('cart-drawer-items');
    const drawerSubtotalSpan = document.getElementById('cart-drawer-subtotal');
    if (drawerContainer) {
      if (cart.length > 0) {
        let subtotal = 0;
        let html = '<div class="space-y-4">';
        
        cart.forEach(item => {
          const itemTotal = item.price * item.quantity;
          subtotal += itemTotal;
          
          html += `
            <div class="flex items-center space-x-3 py-3 border-b border-gray-50 last:border-0">
              <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded-lg border">
              <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-primary truncate">${item.name}</h4>
                <p class="text-[10px] text-text-muted mt-0.5">${item.quantity}x R$ ${item.price.toFixed(2).replace('.', ',')}</p>
              </div>
              <div class="flex flex-col items-end space-y-1">
                <span class="text-xs font-bold text-primary">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
                <button type="button" onclick="removeFromCart('${item.id}')" class="text-[10px] text-danger font-semibold hover:underline">Remover</button>
              </div>
            </div>
          `;
        });
        html += '</div>';
        drawerContainer.innerHTML = html;
        drawerSubtotalSpan.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
      } else {
        drawerContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full text-center text-text-muted space-y-3 py-10">
            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p class="text-xs font-semibold">Seu carrinho está vazio.</p>
            <a href="/produtos" class="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-lg shadow-sm">Ver Catálogo</a>
          </div>
        `;
        drawerSubtotalSpan.innerText = 'R$ 0,00';
      }
    }

    // 3. Complete Cart View Page Render
    renderCartPageUI();

    // 4. Checkout View Page Render
    renderCheckoutPageUI();
  }

  function renderCartPageUI() {
    const desktopTbody = document.getElementById('cart-desktop-tbody');
    const mobileList = document.getElementById('cart-mobile-list');
    const emptyState = document.getElementById('cart-empty-state');
    const mainContainer = document.getElementById('cart-main-container');

    if (!desktopTbody) return;

    if (cart.length === 0) {
      if (mainContainer) mainContainer.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (mainContainer) mainContainer.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    let subtotal = 0;
    let desktopHtml = '';
    let mobileHtml = '';

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      // Desktop Row
      desktopHtml += `
        <tr>
          <td class="py-4">
            <div class="flex items-center space-x-4">
              <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-xl border">
              <div>
                <a href="/produtos/${item.slug}" class="text-xs font-bold text-primary hover:text-primary-light">${item.name}</a>
                <span class="text-[9px] text-text-muted block mt-0.5">SKU: ${item.sku}</span>
              </div>
            </div>
          </td>
          <td class="py-4 text-center">
            <div class="flex items-center justify-center space-x-2">
              <button onclick="updateQty('${item.id}', ${item.quantity - 1})" class="w-7 h-7 bg-surface rounded-lg border border-border flex items-center justify-center hover:bg-gray-100 font-bold">-</button>
              <span class="text-xs font-bold w-6 text-center">${item.quantity}</span>
              <button onclick="updateQty('${item.id}', ${item.quantity + 1})" class="w-7 h-7 bg-surface rounded-lg border border-border flex items-center justify-center hover:bg-gray-100 font-bold">+</button>
            </div>
          </td>
          <td class="py-4 text-right text-xs">R$ ${item.price.toFixed(2).replace('.', ',')}</td>
          <td class="py-4 text-right text-xs font-bold text-primary">R$ ${itemTotal.toFixed(2).replace('.', ',')}</td>
          <td class="py-4 text-center">
            <button onclick="removeFromCart('${item.id}')" class="text-danger hover:text-red-700">
              <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </td>
        </tr>
      `;

      // Mobile Row
      mobileHtml += `
        <div class="py-4 flex items-center space-x-3">
          <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-xl border">
          <div class="flex-1 min-w-0">
            <a href="/produtos/${item.slug}" class="text-xs font-bold text-primary truncate block">${item.name}</a>
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center space-x-2">
                <button onclick="updateQty('${item.id}', ${item.quantity - 1})" class="w-6 h-6 bg-surface rounded border flex items-center justify-center font-bold text-xs">-</button>
                <span class="text-xs font-bold w-5 text-center">${item.quantity}</span>
                <button onclick="updateQty('${item.id}', ${item.quantity + 1})" class="w-6 h-6 bg-surface rounded border flex items-center justify-center font-bold text-xs">+</button>
              </div>
              <span class="text-xs font-bold text-primary">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      `;
    });

    desktopTbody.innerHTML = desktopHtml;
    mobileList.innerHTML = mobileHtml;

    // Apply Coupon discount if exists
    let discount = 0;
    const discountRow = document.getElementById('cart-summary-discount-row');
    const discountSpan = document.getElementById('cart-summary-discount');
    const couponLabel = document.getElementById('cart-summary-coupon-code');

    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        discount = (subtotal * appliedCoupon.value) / 100;
      } else {
        discount = appliedCoupon.value;
      }

      if (discount > subtotal) discount = subtotal;

      if (discountRow) {
        couponLabel.innerText = appliedCoupon.code;
        discountSpan.innerText = `- R$ ${discount.toFixed(2).replace('.', ',')}`;
        discountRow.classList.remove('hidden');
      }
    } else {
      if (discountRow) discountRow.classList.add('hidden');
    }

    // Shipping cost calculation (Free shipping over R$150, otherwise R$15.00)
    const shipping = subtotal >= 150 ? 0.00 : 15.00;
    const total = Math.max(0, subtotal - discount + shipping);

    document.getElementById('cart-summary-subtotal').innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-summary-shipping').innerText = shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-summary-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }

  function renderCheckoutPageUI() {
    const listContainer = document.getElementById('checkout-items-list');
    if (!listContainer) return;

    if (cart.length === 0) {
      listContainer.innerHTML = '<p class="text-xs text-text-muted py-4">Seu carrinho está vazio.</p>';
      return;
    }

    let subtotal = 0;
    let html = '';

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      html += `
        <div class="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-xs">
          <div>
            <span class="font-bold text-primary">${item.name}</span>
            <span class="text-text-muted block text-[10px]">${item.quantity}x R$ ${item.price.toFixed(2).replace('.', ',')}</span>
          </div>
          <span class="font-bold text-primary">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    // Apply Coupon
    let discount = 0;
    const discountRow = document.getElementById('checkout-discount-row');
    const discountSpan = document.getElementById('checkout-discount');
    const couponLabel = document.getElementById('checkout-coupon-label');

    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        discount = (subtotal * appliedCoupon.value) / 100;
      } else {
        discount = appliedCoupon.value;
      }
      if (discount > subtotal) discount = subtotal;

      // Sync hidden coupon code field
      const hiddenCoupInput = document.getElementById('checkout-coupon-code');
      if (hiddenCoupInput) hiddenCoupInput.value = appliedCoupon.code;

      if (discountRow) {
        couponLabel.innerText = appliedCoupon.code;
        discountSpan.innerText = `- R$ ${discount.toFixed(2).replace('.', ',')}`;
        discountRow.classList.remove('hidden');
      }
    } else {
      if (discountRow) discountRow.classList.add('hidden');
    }

    const shipping = subtotal >= 150 ? 0 : 15;
    const total = Math.max(0, subtotal - discount + shipping);

    document.getElementById('checkout-subtotal').innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('checkout-shipping').innerText = shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2).replace('.', ',')}`;
    document.getElementById('checkout-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }

  function updateWishlistUI() {
    // Sync heart colors dynamically on active cards
    const buttons = document.querySelectorAll('[data-wishlist-id]');
    buttons.forEach(btn => {
      const id = btn.getAttribute('data-wishlist-id');
      const svg = btn.querySelector('svg');
      if (wishlist.includes(id)) {
        svg.classList.add('fill-red-500', 'text-danger');
        svg.classList.remove('fill-none');
      } else {
        svg.classList.remove('fill-red-500', 'text-danger');
        svg.classList.add('fill-none');
      }
    });

    // Badge Count
    const badge = document.getElementById('wishlist-badge');
    if (badge) {
      if (wishlist.length > 0) {
        badge.innerText = wishlist.length;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  // DRAWER TOGGLE UTILS
  function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const content = document.getElementById('cart-drawer-content');
    
    if (drawer) {
      drawer.classList.remove('hidden');
      setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        content.classList.remove('translate-x-full');
      }, 50);
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const content = document.getElementById('cart-drawer-content');

    if (drawer) {
      backdrop.classList.add('opacity-0');
      content.classList.add('translate-x-full');
      setTimeout(() => {
        drawer.classList.add('hidden');
      }, 300);
    }
  }

  // LISTENERS REGISTER
  function setupCartListeners() {
    // 1. Hook dynamic add to cart buttons
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-cart-add-id]');
      if (addBtn) {
        const id = addBtn.getAttribute('data-cart-add-id');
        const name = addBtn.getAttribute('data-cart-add-name');
        const price = addBtn.getAttribute('data-cart-add-price');
        const sku = addBtn.getAttribute('data-cart-add-sku');
        const weight = addBtn.getAttribute('data-cart-add-weight');
        const image = addBtn.getAttribute('data-cart-add-image');
        const slug = addBtn.getAttribute('data-cart-add-slug');
        addToCart(id, name, price, sku, weight, image, slug);
      }

      // 2. Hook bundle buy buttons (cross-sell)
      const bundleBtn = e.target.closest('#btn-buy-bundle');
      if (bundleBtn) {
        const items = JSON.parse(bundleBtn.getAttribute('data-bundle-items'));
        items.forEach(item => {
          addToCart(item.id, item.name, item.price, item.sku, item.weight, item.image, item.slug, 1);
        });
      }

      // 3. Hook wishlist heart buttons
      const wishlistBtn = e.target.closest('[data-wishlist-id]');
      if (wishlistBtn) {
        const id = wishlistBtn.getAttribute('data-wishlist-id');
        toggleWishlist(id);
      }
    });

    // 4. Drawer triggers
    const trigger = document.getElementById('cart-drawer-trigger');
    if (trigger) trigger.addEventListener('click', openCartDrawer);

    const closeBtn = document.getElementById('cart-drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeCartDrawer);

    // 5. Coupon Application Form (Cart page)
    const applyCoupBtn = document.getElementById('btn-apply-coupon');
    if (applyCoupBtn) {
      applyCoupBtn.addEventListener('click', () => {
        const codeInput = document.getElementById('cart-coupon-input');
        const feedback = document.getElementById('coupon-feedback');
        if (!codeInput || !feedback) return;

        const code = codeInput.value.trim().toUpperCase();
        if (code === '') {
          feedback.innerHTML = 'Digite o código do cupom.';
          feedback.className = 'text-[10px] text-danger block';
          return;
        }

        const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

        feedback.innerHTML = 'Verificando...';
        feedback.className = 'text-[10px] text-text-muted block';

        fetch('/api/coupons/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, cart_total: subtotal })
        })
          .then(res => {
            if (!res.ok) {
              return res.json().then(err => { throw err; });
            }
            return res.json();
          })
          .then(data => {
            feedback.innerHTML = data.message;
            feedback.className = 'text-[10px] text-success font-bold block';
            
            // Save coupon state locally
            appliedCoupon = {
              code: data.code,
              type: data.type,
              value: data.value
            };
            localStorage.setItem('applied_coupon', JSON.stringify(appliedCoupon));
            updateCartUI();
          })
          .catch(err => {
            feedback.innerHTML = err.error || 'Erro ao validar cupom.';
            feedback.className = 'text-[10px] text-danger block';
            appliedCoupon = null;
            localStorage.removeItem('applied_coupon');
            updateCartUI();
          });
      });
    }

    // 6. Checkout Submission Form Action
    const submitOrderBtn = document.getElementById('btn-submit-order');
    if (submitOrderBtn) {
      submitOrderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const feedbackDiv = document.getElementById('checkout-feedback');
        if (!feedbackDiv) return;

        feedbackDiv.innerHTML = 'Processando pedido...';
        feedbackDiv.className = 'text-xs text-text-muted block font-semibold';

        // Collect identification
        const name = document.getElementById('shipping_name').value;
        const email = document.getElementById('shipping_email').value;
        const phone = document.getElementById('shipping_phone').value;

        // Collect address
        const zip = document.getElementById('shipping_zip').value;
        const address = document.getElementById('shipping_address').value;
        const number = document.getElementById('shipping_number').value;
        const complement = document.getElementById('shipping_complement').value;
        const city = document.getElementById('shipping_city').value;
        const state = document.getElementById('shipping_state').value;

        // Collect payment
        const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

        // Validations
        if (!name || !email || !phone || !zip || !address || !number || !city || !state) {
          feedbackDiv.innerHTML = 'Por favor, preencha todos os campos obrigatórios (*).';
          feedbackDiv.className = 'text-xs text-danger block font-bold';
          return;
        }

        const data = {
          items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          shipping_name: name,
          shipping_email: email,
          shipping_phone: phone,
          shipping_zip: zip,
          shipping_address: address,
          shipping_number: number,
          shipping_complement: complement,
          shipping_city: city,
          shipping_state: state,
          payment_method: paymentMethod,
          _csrf: document.querySelector('input[name="_csrf"]').value
        };

        // If card, extract card details
        if (paymentMethod === 'credit_card') {
          data.card_number = document.getElementById('card_number').value;
          data.card_name = document.getElementById('card_name').value;
          data.card_expiry = document.getElementById('card_expiry').value;
          data.card_cvv = document.getElementById('card_cvv').value;

          // Perform client-side Luhn verification
          const ccClean = data.card_number.replace(/\D/g, '');
          if (!ccClean || ccClean.length < 13 || ccClean.length > 19 || !checkLuhn(data.card_number)) {
            feedbackDiv.innerHTML = 'Número de cartão inválido. O cartão falhou na verificação de integridade.';
            feedbackDiv.className = 'text-xs text-danger block font-bold';
            return;
          }
        }

        fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
          .then(res => {
            if (!res.ok) {
              return res.json().then(err => { throw err; });
            }
            return res.json();
          })
          .then(orderData => {
            // Success! Clear cart and coupon states
            cart = [];
            appliedCoupon = null;
            saveCart();
            localStorage.removeItem('applied_coupon');
            updateCartUI();

            // Redirect to success page
            window.location.href = `/pedidos/confirmado/${orderData.order.id}`;
          })
          .catch(err => {
            feedbackDiv.innerHTML = err.error || 'Ocorreu um erro ao concluir a sua compra. Tente novamente.';
            feedbackDiv.className = 'text-xs text-danger block font-bold';
          });
      });
    }
  }

  // Double check luhn checker for form submission safety
  function checkLuhn(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i), 10);
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
  }
})();
