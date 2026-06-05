const express = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const router = express.Router();

// Get profile
router.get('/', requireAuth, (req, res) => {
    const profile = db.prepare(`
        SELECT * FROM profiles WHERE user_id = ?
    `).get(req.auth.user.id);
    
    res.json(profile || { user_id: req.auth.user.id });
});

// Update profile
router.put('/', requireAuth, (req, res) => {
    const { name, avatar_url } = req.body;
    const now = new Date().toISOString();
    
    db.prepare(`
        INSERT OR REPLACE INTO profiles (user_id, name, avatar_url, updated_at)
        VALUES (?, ?, ?, ?)
    `).run(req.auth.user.id, name, avatar_url, now);
    
    res.json({ success: true });
});

module.exports = router;