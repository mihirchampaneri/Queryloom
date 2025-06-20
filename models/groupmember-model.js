module.exports = (sequelize, DataTypes) => {
    const GroupMember = sequelize.define('GroupMember', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },  
      groupId: {
        type: DataTypes.INTEGER,
        references: { model: 'Group', key: 'id' },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        }
      },      
      role: {
        type: DataTypes.ENUM('admin','sub-admin', 'member'),
        defaultValue: 'member',
        allowNull: false,
      },
      approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    });

    GroupMember.associate = models => {
      GroupMember.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user' 
      });

      GroupMember.belongsTo(models.Group, {
         foreignKey: 'groupId' 
        });
      
    };
  
    return GroupMember;
  };
  