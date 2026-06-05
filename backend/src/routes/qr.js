const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { generateId } = require('../auth');
const db = require('../db');
const router = express.Router();

// Generate QR code
router.post('/generate', requireAuth, async (req, res) => {
    const { content, type } = req.body;
    const qrId = generateId('qr');
    const now = new Date().toISOString();
    
    db.prepare(`
        INSERT INTO qr_codes (id, user_id, content, type, created_at)
        VALUES (?, ?, ?, ?, ?)
    `).run(qrId, req.auth.user.id, content, type, now);
    
    res.json({ id: qrId, content, type });
});

// Get user's QR codes
router.get('/my-qrs', requireAuth, (req, res) => {
    const qrs = db.prepare(`
        SELECT * FROM qr_codes 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `).all(req.auth.user.id);
    
    res.json(qrs);
});

module.exports = router;