const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Create checkout session
router.post('/create-checkout', requireAuth, async (req, res) => {
    const { variantId } = req.body;
    
    if (!variantId) {
        return res.status(400).json({ error: 'variantId is required' });
    }
    
    const baseUrl = process.env.BILLING_CHECKOUT_BASE_URL || 'https://api.lemonsqueezy.com/v1';
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    
    if (!apiKey || !storeId) {
        return res.status(500).json({ error: 'Billing not configured' });
    }
    
    try {
        const response = await fetch(`${baseUrl}/checkouts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            email: req.auth.user.email,
                            custom: {
                                user_id: req.auth.user.id
                            }
                        }
                    },
                    relationships: {
                        store: {
                            data: {
                                type: 'stores',
                                id: storeId
                            }
                        },
                        variant: {
                            data: {
                                type: 'variants',
                                id: variantId
                            }
                        }
                    }
                }
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Lemon Squeezy error:', data);
            return res.status(500).json({ error: 'Failed to create checkout' });
        }
        
        res.json({ url: data.data.attributes.url });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout' });
    }
});

module.exports = router;