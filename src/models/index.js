const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Grant = require('./Grant');
const Application = require('./Application');

// User <-> Role (many-to-many)
User.belongsToMany(Role, {
  through: 'user_roles',
  foreignKey: 'user_id',
  otherKey: 'role_id',
  timestamps: false,
});
Role.belongsToMany(User, {
  through: 'user_roles',
  foreignKey: 'role_id',
  otherKey: 'user_id',
  timestamps: false,
});

// Grant belongs to User (grantor)
Grant.belongsTo(User, { foreignKey: 'grantor_id', as: 'grantor' });
User.hasMany(Grant, { foreignKey: 'grantor_id', as: 'grants' });

// Application belongs to User (grantee) and Grant
Application.belongsTo(User, { foreignKey: 'grantee_id', as: 'grantee' });
Application.belongsTo(Grant, { foreignKey: 'grant_id', as: 'grant' });
User.hasMany(Application, { foreignKey: 'grantee_id', as: 'applications' });
Grant.hasMany(Application, { foreignKey: 'grant_id', as: 'applications' });

module.exports = { sequelize, User, Role, Grant, Application };
