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

// Simplified log - only shows we're connecting to the database
console.log('Connecting to database...');

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
    process.exit(1); // Exit with error code
  });

// Регистрируем маршруты
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
