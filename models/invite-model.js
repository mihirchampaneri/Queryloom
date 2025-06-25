module.exports = (sequelize, DataTypes) => {
    const Invite = sequelize.define("Invite", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Group",
                key: "id",
            },
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "GroupMember",
                key: "id",
            },
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "User",
                key: "id",
            },
        },
        status: {
            type: DataTypes.ENUM("invited", "accepted", "declined"),
            allowNull: false,
            defaultValue: "invited",
        },
    },
        {
            timestamps: true,
            tableName: "invites",
        }
    );

    Invite.associate = (models) => {
        Invite.belongsTo(models.Group, { 
            foreignKey: "groupId" 
        });

        Invite.belongsTo(models.GroupMember, { 
            foreignKey: "memberId" 
        });
        
        Invite.belongsTo(models.User, { 
            foreignKey: "userId" 
        });
    };

    return Invite;
};
