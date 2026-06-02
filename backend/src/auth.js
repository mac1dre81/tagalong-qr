const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('./config');

function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function signSession(user) {
  return jwt.sign({ sub: user.id, email: user.email, plan: user.plan }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function verifySession(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { generateId, signSession, verifySession };
