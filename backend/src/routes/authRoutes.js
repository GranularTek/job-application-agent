const express = require('express');
const { register, login, getCurrentUser, renewToken } = require('../controllers/authController');
const { authenticateToken } = require('../app');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/renew', authenticateToken, renewToken); // 🔁 Renew token

module.exports = router;
