const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// POST Endpoint: /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, age, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All crucial input fields are required." });
    }

    try {
        // Check if user already exists
        const { data: userExists, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase());

        if (checkError) {
            // Handle scenario where table does not exist yet
            if (checkError.code === 'PGS00' || checkError.message.includes('relation "users" does not exist')) {
                return res.status(500).json({
                    success: false,
                    message: "Database Setup Required: The 'users' table does not exist in Supabase yet. Please run the SQL queries in 'schema.sql' inside your Supabase SQL Editor to initialize your tables."
                });
            }
            throw checkError;
        }

        if (userExists && userExists.length > 0) {
            return res.status(400).json({ success: false, message: "A user profile with this email already exists." });
        }

        const newUser = {
            email: email.toLowerCase(),
            password: password,
            name: name,
            age: age || "21"
        };

        const { error: insertError } = await supabase
            .from('users')
            .insert([newUser]);

        if (insertError) {
            throw insertError;
        }

        console.log(`✨ New mind registration successfully committed to Supabase: ${email}`);
        res.status(201).json({ 
            success: true, 
            message: "Your account was successfully synchronized to Supabase!", 
            user: {
                identifier: newUser.email,
                name: newUser.name,
                age: newUser.age
            } 
        });

    } catch (err) {
        console.error("Critical fail inside /signup endpoint:", err);
        res.status(500).json({ 
            success: false, 
            message: "Database sync error during registration.", 
            error: err.message 
        });
    }
});

// POST Endpoint: /api/auth/login
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ success: false, message: "Missing username email or security password." });
    }

    try {
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', identifier.toLowerCase());

        if (fetchError) {
            if (fetchError.code === 'PGS00' || fetchError.message.includes('relation "users" does not exist')) {
                return res.status(500).json({
                    success: false,
                    message: "Database Setup Required: The 'users' table does not exist in Supabase yet. Please run the SQL queries in 'schema.sql' inside your Supabase SQL Editor to initialize your tables."
                });
            }
            throw fetchError;
        }

        const user = users && users[0];
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: "Authentication credentials rejected. Please try again." });
        }

        res.status(200).json({ 
            success: true, 
            message: "Synchronized pipeline connected via Supabase!", 
            user_full_name: user.name,
            user_email: user.email,
            user_age: user.age
        });

    } catch (err) {
        console.error("Critical fail inside /login endpoint:", err);
        res.status(500).json({ 
            success: false, 
            message: "Database sync error during authentication.", 
            error: err.message 
        });
    }
});

module.exports = router;
