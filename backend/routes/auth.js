const express = require('express');
const router = express.Router();

// A local database simulation to manage user registration state
const localUserDatabase = [
    { identifier: "kratishrivastava@gmail.com", password: "krati04", name: "Krati Shrivastava" }
];

// POST Endpoint: /api/auth/signup
router.post('/signup', (req, res) => {
    const { name, age, email, password } = req.body;
    
    // FIXED: Removed the trailing minus sign (-) typo
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All input fields are required." });
    }

    // FIXED: Changed identifier to email to match your destructured variables
    const userExists = localUserDatabase.find(u => u.identifier.toLowerCase() === email.toLowerCase());
    if (userExists) {
        return res.status(400).json({ success: false, message: "User profile identifier already exists." });
    }

    // Push new account seamlessly into our memory array database
    localUserDatabase.push({ 
        identifier: email.toLowerCase(), 
        password: password, 
        name: name 
    });
    
    console.log(`✨ New account saved: ${email}`);
    res.status(201).json({ success: true, message: "Account created successfully!" });
});

// POST Endpoint: /api/auth/login
// FIXED: Un-commented the login handler block so it works with your frontend form
router.post('/login', (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ success: false, message: "Missing username or password fields." });
    }

    const user = localUserDatabase.find(u => u.identifier.toLowerCase() === identifier.toLowerCase());
    
    // Simple verification check against database array parameters
    if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: "Invalid credentials. Please try again!" });
    }

    res.status(200).json({ 
        success: true, 
        message: "Authentication successful!", 
        user_full_name: user.name 
    });
});

module.exports = router;