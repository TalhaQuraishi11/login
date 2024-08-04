const express = require('express');
const {
  getUsers,
  login,
  register,
  requestProfileUpdate,
  verifyAndUpdateProfile,
  deleteUser,
} = require('../controllers/userController'); // Adjusted to CommonJS
const { admin, protect } = require('../middlewares/authMiddleware'); // Adjusted to CommonJS

const router = express.Router();

// User registration
router.post('/register', register);

// User login
router.post('/login', login);

// Request OTP for profile update
router.post('/request-profile-update', requestProfileUpdate);

// Verify OTP and update profile
router.put('/verify-and-update-profile/:id', verifyAndUpdateProfile);

// Get all users - Protected and accessible only by admin
router.get('/', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
