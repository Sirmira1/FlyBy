const express = require('express');
const router = express.Router();
const supabase = require('../lib/db');

// User registration
router.post ('/register', async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username are required' });
    }
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
    if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { username },
        email_confirm: true
    });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json({ message: 'Account created successfully', user: { id: data.user.id, email, username } 
    });
});

// User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return res.status(401).json({ error: error.message });
    }
    res.json({ token: data.session.access_token,
        refresh: data.session.refresh_token,
        user: data.user,
    });
});

module.exports = router;
