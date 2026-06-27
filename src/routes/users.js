const express = require('express');
const { body } = require('express-validator');
const { assignRole, getAllUsers } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), getAllUsers);

router.post(
  '/:userId/roles',
  authenticate,
  authorize('ADMIN'),
  [
    body('roleName')
      .notEmpty()
      .withMessage('Role name is required')
      .isIn(['ADMIN', 'GRANTOR', 'GRANTEE'])
      .withMessage('Role must be one of: ADMIN, GRANTOR, GRANTEE'),
  ],
  assignRole
);

module.exports = router;
