const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../app');

router.get('/dashboard', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Welcome to the admin dashboard.' });
});

module.exports = router;
