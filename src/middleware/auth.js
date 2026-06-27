const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const hasRole = req.user.roles.some((role) => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
