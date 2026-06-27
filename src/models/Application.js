const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  proposal: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'PENDING',
    validate: {
      isIn: [['PENDING', 'APPROVED', 'REJECTED']],
    },
  },
  grantee_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  grant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'applications',
  timestamps: true,
  underscored: true,
});

module.exports = Application;
