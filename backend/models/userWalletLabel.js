// models/userWalletLabel.js
module.exports = (sequelize, DataTypes) => {
    const UserWalletLabel = sequelize.define(
        'UserWalletLabel',
        {
            walletAddress: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            label: {
                type: DataTypes.STRING,
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
    return UserWalletLabel;
};
