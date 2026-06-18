const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING, // e.g. 'credit_card', 'pix', 'boleto'
    allowNull: false
  },
  payment_status: {
    type: DataTypes.STRING, // e.g. 'pending', 'approved', 'refunded'
    defaultValue: 'pending',
    allowNull: false
  },
  shipping_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_zip: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_state: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
