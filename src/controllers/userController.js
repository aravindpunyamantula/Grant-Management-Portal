const { validationResult } = require('express-validator');
const { User, Role } = require('../models');

const assignRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.params;
  const { roleName } = req.body;

  try {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, through: { attributes: [] } }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      return res.status(404).json({ message: `Role '${roleName}' not found.` });
    }

    const hasRole = user.Roles && user.Roles.some((r) => r.name === roleName);
    if (hasRole) {
      return res.status(409).json({ message: `User already has the '${roleName}' role.` });
    }

    await user.addRole(role);

    const updatedUser = await User.findByPk(userId, {
      include: [{ model: Role, through: { attributes: [] } }],
    });

    return res.status(200).json({
      message: `Role '${roleName}' assigned successfully.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        roles: updatedUser.Roles.map((r) => r.name),
      },
    });
  } catch (err) {
    console.error('Assign role error:', err);
    return res.status(500).json({ message: 'Server error while assigning role.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, through: { attributes: [] } }],
    });

    return res.status(200).json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        roles: u.Roles ? u.Roles.map((r) => r.name) : [],
      }))
    );
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { assignRole, getAllUsers };
