const { validationResult } = require('express-validator');
const { Grant, User, Application } = require('../models');

const createGrant = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, amount, deadline } = req.body;
  const grantorId = req.user.userId;

  try {
    const grant = await Grant.create({
      title,
      description,
      amount,
      deadline,
      grantor_id: grantorId,
    });

    return res.status(201).json(grant);
  } catch (err) {
    console.error('Create grant error:', err);
    return res.status(500).json({ message: 'Server error while creating grant.' });
  }
};

const getAllGrants = async (req, res) => {
  try {
    const grants = await Grant.findAll({
      include: [{ model: User, as: 'grantor', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json(grants);
  } catch (err) {
    console.error('Get grants error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const getGrantById = async (req, res) => {
  try {
    const grant = await Grant.findByPk(req.params.grantId, {
      include: [{ model: User, as: 'grantor', attributes: ['id', 'name', 'email'] }],
    });

    if (!grant) {
      return res.status(404).json({ message: 'Grant not found.' });
    }

    return res.status(200).json(grant);
  } catch (err) {
    console.error('Get grant error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const updateGrant = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const grant = await Grant.findByPk(req.params.grantId);

    if (!grant) {
      return res.status(404).json({ message: 'Grant not found.' });
    }

    if (grant.grantor_id !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden. You can only update your own grants.' });
    }

    const { title, description, amount, deadline, status } = req.body;
    await grant.update({ title, description, amount, deadline, status });

    return res.status(200).json(grant);
  } catch (err) {
    console.error('Update grant error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const deleteGrant = async (req, res) => {
  try {
    const grant = await Grant.findByPk(req.params.grantId);

    if (!grant) {
      return res.status(404).json({ message: 'Grant not found.' });
    }

    if (grant.grantor_id !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden. You can only delete your own grants.' });
    }

    await grant.destroy();
    return res.status(200).json({ message: 'Grant deleted successfully.' });
  } catch (err) {
    console.error('Delete grant error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const getGrantApplications = async (req, res) => {
  try {
    const grant = await Grant.findByPk(req.params.grantId);

    if (!grant) {
      return res.status(404).json({ message: 'Grant not found.' });
    }

    if (grant.grantor_id !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden. You can only view applications for your own grants.' });
    }

    const applications = await Application.findAll({
      where: { grant_id: req.params.grantId },
      include: [{ model: User, as: 'grantee', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json(applications);
  } catch (err) {
    console.error('Get grant applications error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createGrant, getAllGrants, getGrantById, updateGrant, deleteGrant, getGrantApplications };
