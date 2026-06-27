const { validationResult } = require('express-validator');
const axios = require('axios');
const { User, Role } = require('../models');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const user = await User.create({ name, email, password });

    const granteeRole = await Role.findOne({ where: { name: 'GRANTEE' } });
    if (granteeRole) {
      await user.addRole(granteeRole);
    }

    const userJson = user.toJSON();
    return res.status(201).json({
      id: userJson.id,
      name: userJson.name,
      email: userJson.email,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, through: { attributes: [] } }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const roles = user.Roles ? user.Roles.map((r) => r.name) : [];
    const accessToken = generateToken(user.id, roles);

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

const googleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required.' });
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.OAUTH_CALLBACK_URL,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id: oauthId, name, email } = profileResponse.data;

    let user = await User.findOne({
      where: { email },
      include: [{ model: Role, through: { attributes: [] } }],
    });

    if (!user) {
      user = await User.create({
        name,
        email,
        oauth_provider: 'google',
        oauth_id: oauthId,
      });

      const granteeRole = await Role.findOne({ where: { name: 'GRANTEE' } });
      if (granteeRole) {
        await user.addRole(granteeRole);
      }

      user = await User.findOne({
        where: { id: user.id },
        include: [{ model: Role, through: { attributes: [] } }],
      });
    }

    const roles = user.Roles ? user.Roles.map((r) => r.name) : [];
    const accessToken = generateToken(user.id, roles);

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    return res.status(500).json({ message: 'OAuth authentication failed.' });
  }
};

module.exports = { register, login, googleCallback };
