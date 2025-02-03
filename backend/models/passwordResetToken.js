// models/passwordResetToken.js
module.exports = (sequelize, DataTypes) => {
    const PasswordResetToken = sequelize.define('PasswordResetToken', {
        token: {
            type: DataTypes.STRING,
            unique: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
        },
    });
    return PasswordResetToken;
};
