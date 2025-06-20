module.exports = (sequelize, DataTypes) => {
    const Publish = sequelize.define('Publish', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
        publishAt: {
            type: DataTypes.ENUM('Public', 'followers', 'inner circle', 'Group'),
            allowNull: false,
        },
    }, {
        timestamps: false,
        tableName: 'Publish',
    });
    return Publish;
};