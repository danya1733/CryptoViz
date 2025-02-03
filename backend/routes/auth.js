// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

const { User, PasswordResetToken } = require('../models');
const router = express.Router();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    // Создаём запись с токеном сброса пароля
    await PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt,
    });

    const resetUrl = `http://localhost:5173/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send password reset link' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const resetToken = await PasswordResetToken.findOne({
      where: {
        token,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const user = await User.findByPk(resetToken.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    // Удаляем токен сброса пароля
    await PasswordResetToken.destroy({ where: { userId: user.id } });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
