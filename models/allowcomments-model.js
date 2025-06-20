module.exports = (sequelize, DataTypes) => {
    const Allowcomments = sequelize.define('Allowcomments', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
        commentPermission: {
            type: DataTypes.ENUM('from everyone', 'followers', 'inner circle', 'people i follow and people who follow me','disallow comments'),
            allowNull: false,
        },
    }, {
        timestamps: false,
        tableName: 'Allowcomments',
    });
    return Allowcomments;
};
