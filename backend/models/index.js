// models/index.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Импорт моделей
db.User = require('./user')(sequelize, Sequelize);
db.UserWallet = require('./userWallet')(sequelize, Sequelize);
db.UserWalletImage = require('./userWalletImage')(sequelize, Sequelize);
db.UserWalletLabel = require('./userWalletLabel')(sequelize, Sequelize);
db.PasswordResetToken = require('./passwordResetToken')(sequelize, Sequelize);
db.UserApiKey = require('./userApiKey')(sequelize, Sequelize);

// Определение связей
db.User.hasMany(db.UserWallet, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.UserWallet.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.UserWalletImage, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.UserWalletImage.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.UserWalletLabel, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.UserWalletLabel.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.PasswordResetToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.PasswordResetToken.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasOne(db.UserApiKey, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.UserApiKey.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;
