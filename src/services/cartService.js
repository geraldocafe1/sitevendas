const { Product } = require('../models');

/**
 * Validates the shopping cart items against current database stock and active status.
 * Adjusts quantities to match available stock if necessary.
 * @param {Array} cartItems - Array of { product_id, quantity }
 * @returns {Promise<Object>} - Validation result: { items: Array, subtotal: Number, hasChanges: Boolean }
 */
const validateCart = async (cartItems = []) => {
  let subtotal = 0;
  let hasChanges = false;
  const validatedItems = [];

  for (const item of cartItems) {
    if (!item.product_id) continue;

    const product = await Product.findByPk(item.product_id);

    // If product doesn't exist or is inactive, it's removed (skip adding to validatedItems)
    if (!product || !product.is_active) {
      hasChanges = true;
      continue;
    }

    let qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      qty = 1;
      hasChanges = true;
    }

    // Cap quantity at available stock
    if (qty > product.stock) {
      qty = product.stock;
      hasChanges = true;
    }

    // Only include if stock is actually > 0
    if (qty > 0) {
      const itemPrice = parseFloat(product.price);
      const totalItemPrice = itemPrice * qty;
      subtotal += totalItemPrice;

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: itemPrice,
        compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
        images: product.images,
        sku: product.sku,
        weight_kg: parseFloat(product.weight_kg),
        quantity: qty,
        total_price: totalItemPrice,
        stock: product.stock
      });
    } else {
      // Stock is zero, item removed from validated items
      hasChanges = true;
    }
  }

  return {
    items: validatedItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    hasChanges
  };
};

module.exports = {
  validateCart
};
