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

function verifySessionSafe(token) {
  try {
    return { valid: true, payload: jwt.verify(token, jwtSecret) };
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expired'
      : err.name === 'JsonWebTokenError'
      ? 'Invalid token'
      : 'Authentication failed';
    return { valid: false, error: message };
  }
}

module.exports = { generateId, signSession, verifySession, verifySessionSafe };
