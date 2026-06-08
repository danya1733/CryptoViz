// models/userApiKey.js
module.exports = (sequelize, DataTypes) => {
    const UserApiKey = sequelize.define(
        'UserApiKey',
        {
            apiKey: {
                type: DataTypes.TEXT,
            },
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['userId'],
                },
            ],
        }
    );
    return UserApiKey;
};
