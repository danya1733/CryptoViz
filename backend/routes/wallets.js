// routes/wallets.js
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  UserWallet,
  UserWalletImage,
  UserWalletLabel,
  UserApiKey,
} = require('../models');

const router = express.Router();

// Middleware для проверки JWT-токена
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Добавление кошелька
router.post('/add', async (req, res) => {
  try {
    const { userId, walletAddress, cryptoType } = req.body;
    await UserWallet.findOrCreate({
      where: { userId, walletAddress, cryptoType },
      defaults: { userId, walletAddress, cryptoType },
    });
    res.status(201).json({ message: 'Wallet added successfully' });
  } catch (error) {
    console.error('Error adding wallet:', error);
    res.status(500).json({ error: 'Failed to add wallet' });
  }
});

// Добавление/обновление изображения кошелька
router.post('/image', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { walletAddress, imageType, cryptoType } = req.body;
    await UserWalletImage.upsert({ userId, walletAddress, imageType, cryptoType });
    res.status(200).json({ message: 'Wallet image updated successfully' });
  } catch (error) {
    console.error('Error updating wallet image:', error);
    res.status(500).json({ error: 'Failed to update wallet image' });
  }
});

// Получение изображений кошельков
router.get('/images', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { cryptoType } = req.query;
    const images = await UserWalletImage.findAll({ where: { userId, cryptoType } });
    const walletImages = images.reduce((acc, { walletAddress, imageType }) => {
      acc[walletAddress] = imageType;
      return acc;
    }, {});
    res.json(walletImages);
  } catch (error) {
    console.error('Error fetching wallet images:', error);
    res.status(500).json({ error: 'Failed to fetch wallet images' });
  }
});

// Удаление изображения кошелька
router.delete('/image', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { walletAddress, cryptoType } = req.query;
    await UserWalletImage.destroy({ where: { userId, walletAddress, cryptoType } });
    res.status(200).json({ message: 'Wallet image deleted successfully' });
  } catch (error) {
    console.error('Error deleting wallet image:', error);
    res.status(500).json({ error: 'Failed to delete wallet image' });
  }
});

// Добавление/обновление ярлыка кошелька
router.post('/label', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { walletAddress, label, cryptoType } = req.body;
    await UserWalletLabel.upsert({ userId, walletAddress, label, cryptoType });
    res.status(200).json({ message: 'Wallet label updated successfully' });
  } catch (error) {
    console.error('Error updating wallet label:', error);
    res.status(500).json({ error: 'Failed to update wallet label' });
  }
});

// Удаление ярлыка кошелька
router.delete('/label', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { walletAddress, cryptoType } = req.query;
    await UserWalletLabel.destroy({ where: { userId, walletAddress, cryptoType } });
    res.status(200).json({ message: 'Wallet label deleted successfully' });
  } catch (error) {
    console.error('Error deleting wallet label:', error);
    res.status(500).json({ error: 'Failed to delete wallet label' });
  }
});

// Получение ярлыков кошельков
router.get('/labels', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { cryptoType } = req.query;
    const labelsData = await UserWalletLabel.findAll({ where: { userId, cryptoType } });
    const labels = labelsData.reduce((acc, { walletAddress, label }) => {
      acc[walletAddress] = label;
      return acc;
    }, {});
    res.json(labels);
  } catch (error) {
    console.error('Error fetching wallet labels:', error);
    res.status(500).json({ error: 'Failed to fetch wallet labels' });
  }
});

// Получение списка кошельков
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { cryptoType } = req.query;
    const walletsData = await UserWallet.findAll({ where: { userId, cryptoType } });
    const wallets = walletsData.map(wallet => wallet.walletAddress);
    res.json(wallets);
  } catch (error) {
    console.error('Error fetching user wallets:', error);
    res.status(500).json({ error: 'Failed to fetch user wallets' });
  }
});

// Удаление кошелька
router.delete('/:walletAddress', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { walletAddress } = req.params;
    const { cryptoType } = req.query;
    await UserWallet.destroy({ where: { userId, walletAddress, cryptoType } });
    res.json({ message: 'Wallet removed successfully' });
  } catch (error) {
    console.error('Error removing wallet:', error);
    res.status(500).json({ error: 'Failed to remove wallet' });
  }
});

// Сохранение API-ключа
router.post('/apiKey', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { apiKey } = req.body;
    await UserApiKey.upsert({ userId, apiKey });
    res.status(200).json({ message: 'API key saved successfully' });
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// Получение API-ключа
router.get('/apiKey', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const apiKeyRecord = await UserApiKey.findOne({ where: { userId } });
    const apiKey = apiKeyRecord ? apiKeyRecord.apiKey : '';
    res.json({ apiKey });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
});

module.exports = router;
