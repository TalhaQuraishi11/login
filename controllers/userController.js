const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const {
  generateOTP,
  storeOTP,
  getStoredOTP,
  deleteStoredOTP,
  sendEmail
} = require('../utils/otpManager');

// Login Controller
const login = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if an OTP has been sent to the user
  const storedOtp = getStoredOTP(email);

  // If no OTP is found, generate and send one
  if (!storedOtp) {
    if (!password) {
      res.status(400);
      throw new Error('Password is required to generate OTP');
    }
    
    // Verify password before generating OTP
    if (!(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const otp = generateOTP();
    storeOTP(email, otp);
    await sendEmail(email, otp);
    res.status(400).json({ message: 'OTP sent to email. Please verify the OTP.' });
    return;
  }

  // If OTP is found, verify it
  if (storedOtp !== otp) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  // OTP is valid, delete it and respond with user data
  deleteStoredOTP(email);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: generateToken(user._id),
  });
});
// Register Controller
const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    isAdmin,
    address,
    additionalPhoneNumbers,
    additionalEmailAddresses,
    website,
    memberNumber,
    membershipDate,
    gpsLocation,
    otherPersonalInformation,
  } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields: name, email, and password');
  }

  if (isAdmin) {
    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) {
      res.status(400);
      throw new Error('An admin already exists. You cannot create another admin.');
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin: true,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin: false,
      address,
      additionalPhoneNumbers,
      additionalEmailAddresses,
      website,
      memberNumber,
      membershipDate,
      gpsLocation,
      otherPersonalInformation,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  }
});

const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500);
    throw new Error('Error fetching users');
  }
});

const requestProfileUpdate = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = generateOTP();
  storeOTP(email, otp);
  await sendEmail(email, otp);

  res.status(200).json({ message: "OTP sent to your email address." });
});

const verifyAndUpdateProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { otp, ...updateData } = req.body;

  // Retrieve user based on userId
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Retrieve stored OTP for the user's email
  const storedOtp = getStoredOTP(user.email);

  if (!storedOtp) {
    return res
      .status(400)
      .json({
        message: "OTP is required or expired. Please request a new OTP.",
      });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  deleteStoredOTP(user.email);

  // Update user profile fields
  Object.keys(updateData).forEach((field) => {
    if (user[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  if (updateData.password) {
    user.password = await bcrypt.hash(updateData.password, 10);
  }

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
    memberNumber: updatedUser.memberNumber,
    membershipDate: updatedUser.membershipDate,
    token: generateToken(updatedUser._id),
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;

    // Ensure the user to delete exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
})
module.exports = { login, register, requestProfileUpdate, verifyAndUpdateProfile, getUsers ,deleteUser };
