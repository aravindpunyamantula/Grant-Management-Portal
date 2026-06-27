const jwt = require('jsonwebtoken');

const generateToken = (userId, roles) => {
  return jwt.sign(
    {
      userId,
      roles,
    },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

module.exports = { generateToken };
