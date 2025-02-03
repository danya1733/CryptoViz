// models/userWalletImage.js
module.exports = (sequelize, DataTypes) => {
    const UserWalletImage = sequelize.define(
        'UserWalletImage',
        {
            walletAddress: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            imageType: {
                type: DataTypes.STRING(20),
            },
            cryptoType: {
                type: DataTypes.STRING(10),
            },
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['userId', 'walletAddress', 'cryptoType'],
                },
            ],
        }
    );
    return UserWalletImage;
};
