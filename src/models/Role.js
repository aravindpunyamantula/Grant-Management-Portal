const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    validate: {
      isIn: [['ADMIN', 'GRANTOR', 'GRANTEE']],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true,
});

module.exports = Role;
