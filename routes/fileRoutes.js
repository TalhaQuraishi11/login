const express = require('express');
const fileController = require('../controllers/fileController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define routes with authentication and authorization
router.post('/upload', protect, admin, fileController.uploadFile);
router.post('/export', protect, admin, fileController.exportData);

module.exports = router;
