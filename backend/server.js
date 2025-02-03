// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models'); // Импортируем экземпляр Sequelize и модели

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallets');

const app = express();
app.use(express.json());
app.use(cors());

// Подключаемся к базе и синхронизируем модели
db.sequelize
  .authenticate()
  .then(() => {
    console.log('Connected to PostgreSQL with Sequelize');
    return db.sequelize.sync(); // При необходимости создаст таблицы, если их ещё нет
  })
  .then(() => {
    console.log('Models synchronized');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Регистрируем маршруты
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
