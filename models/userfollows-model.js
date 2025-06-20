module.exports = (sequelize, DataTypes) => {
  const UserFollows = sequelize.define('UserFollows', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'User',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    followingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'User',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    blocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'userfollows',
    timestamps: true,
  });

  UserFollows.associate = models => {
    UserFollows.belongsTo(models.User, { 
      foreignKey: 'followingId', 
      as: 'BlockedUser' 
    });

    UserFollows.belongsTo(models.User, {
      foreignKey: 'followerId',
      as: 'Follower'
    });
  
    UserFollows.belongsTo(models.User, {
      foreignKey: 'followingId',
      as: 'Following'
    });
  };
  return UserFollows;
};
