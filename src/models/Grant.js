const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grant = sequelize.define('Grant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'OPEN',
    validate: {
      isIn: [['OPEN', 'CLOSED', 'DRAFT']],
    },
  },
  grantor_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'grants',
  timestamps: true,
  underscored: true,
});

module.exports = Grant;
