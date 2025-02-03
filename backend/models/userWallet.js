// models/userWallet.js
module.exports = (sequelize, DataTypes) => {
    const UserWallet = sequelize.define(
        'UserWallet',
        {
            walletAddress: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            cryptoType: {
                type: DataTypes.STRING(10),
                allowNull: false,
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
    return UserWallet;
};
