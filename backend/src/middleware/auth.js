const db = require('../db');
const { verifySession } = require('../auth');

function getBearerToken(header = '') {
  if (!header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization || '');
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  try {
    const payload = verifySession(token);
    const session = db.prepare('SELECT token, user_id, expires_at FROM sessions WHERE token = ?').get(token);
    if (!session) return res.status(401).json({ error: 'Session not found' });
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.auth = { token, user };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }
}

module.exports = { requireAuth };
