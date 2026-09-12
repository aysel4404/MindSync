const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../frontend')));

const authRouter = require('./routes/auth');
const journalRouter = require('./routes/journal');

app.use('/api/auth', authRouter);
app.use('/api/journal', journalRouter);

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 MindSync Core Architecture Synchronized! Open: http://localhost:${PORT}`);
});