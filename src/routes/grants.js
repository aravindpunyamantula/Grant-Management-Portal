const express = require('express');
const { body } = require('express-validator');
const {
  createGrant,
  getAllGrants,
  getGrantById,
  updateGrant,
  deleteGrant,
  getGrantApplications,
} = require('../controllers/grantController');
const { applyForGrant } = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const grantValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
];

router.get('/', authenticate, getAllGrants);

router.post('/', authenticate, authorize('GRANTOR'), grantValidation, createGrant);

router.get('/:grantId', authenticate, getGrantById);

router.put('/:grantId', authenticate, authorize('GRANTOR'), updateGrant);

router.delete('/:grantId', authenticate, authorize('GRANTOR'), deleteGrant);

router.get('/:grantId/applications', authenticate, authorize('GRANTOR'), getGrantApplications);

router.post(
  '/:grantId/apply',
  authenticate,
  authorize('GRANTEE'),
  [body('proposal').trim().notEmpty().withMessage('Proposal is required')],
  applyForGrant
);

module.exports = router;
