module.exports = (sequelize, DataTypes) => {
    const GroupRules = sequelize.define('GroupRules', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Group',
                key: 'id'
            }
        },
        ruleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Rule',
                key: 'id'
            }
        }
    }, {
        timestamps: false
    });

    return GroupRules;
};
