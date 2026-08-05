const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...sanitized } = user;
  return sanitized;
};

// @route   POST /api/auth/login
// @desc    Authenticate user against Supabase employees table
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Employee record not found.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server database error during login' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new employee into Supabase
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, title, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address is already registered in employees.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await db.createUser({
      name,
      email,
      password: hashedPassword,
      title: title || 'Software Engineer',
      department: department || 'Engineering'
    });

    const payload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully in Supabase',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('Register Error:', err);
    return res.status(500).json({ success: false, message: 'Server database error during registration' });
  }
});

// @route   GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    return res.json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error' });
  }
});

// @route   PUT /api/auth/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, title, department, phone, location, avatar, currentPassword, newPassword } = req.body;

    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (title) updates.title = title;
    if (department) updates.department = department;
    if (phone) updates.phone = phone;
    if (location) updates.location = location;
    if (avatar) updates.avatar = avatar;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
      }
      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
      updates.password = newPassword;
    }

    const updatedUser = await db.updateUser(user.id, updates);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error updating profile' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all employees directory list
router.get('/users', verifyToken, async (req, res) => {
  try {
    const users = await db.getUsers();
    return res.json({
      success: true,
      users: users.map(sanitizeUser)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error loading users' });
  }
});

// @route   PUT /api/auth/users/:id/role
router.put('/users/:id/role', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { role, title, department } = req.body;
    const { id } = req.params;

    const targetUser = await db.findUserById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updates = {};
    if (role) updates.role = role;
    if (title) updates.title = title;
    if (department) updates.department = department;

    const updatedUser = await db.updateUser(id, updates);

    return res.json({
      success: true,
      message: 'Employee permissions updated',
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error updating user role' });
  }
});

module.exports = router;
