const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const frontendPath = path.resolve(__dirname, '../frontend');
const uploadsPath = path.resolve(__dirname, '../frontend/uploads');


if (!fs.existsSync(frontendPath)) {
    fs.mkdirSync(frontendPath, { recursive: true });
}
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}


app.use(express.static(frontendPath));


const authRouter = require('./routes/auth');
const journalRouter = require('./routes/journal');

app.use('/api/auth', authRouter);
app.use('/api/journal', journalRouter);


app.get('/', (req, res) => {
    res.sendFile(path.resolve(frontendPath, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.resolve(frontendPath, 'signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.resolve(frontendPath, 'dashboard.html'));
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n===============================================================`);
    console.log(`🚀 MindSync Platform Online & Persistent Memory Synced!`);
    console.log(`📡 Access Link: http://localhost:${PORT}`);
    console.log(`===============================================================\n`);
});
