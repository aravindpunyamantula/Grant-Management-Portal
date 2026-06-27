const { validationResult } = require('express-validator');
const { Application, Grant, User } = require('../models');

const applyForGrant = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { grantId } = req.params;
  const { proposal } = req.body;
  const granteeId = req.user.userId;

  try {
    const grant = await Grant.findByPk(grantId);
    if (!grant) {
      return res.status(404).json({ message: 'Grant not found.' });
    }

    if (grant.status !== 'OPEN') {
      return res.status(400).json({ message: 'This grant is not accepting applications.' });
    }

    const existingApplication = await Application.findOne({
      where: { grantee_id: granteeId, grant_id: grantId },
    });

    if (existingApplication) {
      return res.status(409).json({ message: 'You have already applied for this grant.' });
    }

    const application = await Application.create({
      proposal,
      grantee_id: granteeId,
      grant_id: grantId,
    });

    return res.status(201).json(application);
  } catch (err) {
    console.error('Apply for grant error:', err);
    return res.status(500).json({ message: 'Server error while submitting application.' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { grantee_id: req.user.userId },
      include: [{ model: Grant, as: 'grant' }],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json(applications);
  } catch (err) {
    console.error('Get my applications error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { applyForGrant, getMyApplications };
