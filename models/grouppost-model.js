module.exports = (sequelize, DataTypes) => {
  const GroupPost = sequelize.define('GroupPost', {
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
    pollId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Polls',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  });

  GroupPost.associate = (models) => {
    GroupPost.belongsTo(models.Polls, {
      foreignKey: 'pollId',
      as: 'poll'
    });

    GroupPost.belongsTo(models.Group, {
      foreignKey: 'groupId'
    });

    GroupPost.hasMany(models.Report, {
      foreignKey: 'groupPostId'
    });
  };
  return GroupPost;
};
