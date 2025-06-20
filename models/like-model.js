module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define('Like', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Comment',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    pollId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Polls',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    isLiked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'isLiked',
    },
  }, {
    timestamps: true,
    tableName: 'likes',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'commentId'],
        name: 'unique_user_comment_like'
      }
    ]
  });

  Like.associate = (models) => {
    Like.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Like.belongsTo(models.Comment, {
      foreignKey: 'commentId',
      as: 'comment',
    });

    Like.belongsTo(models.Polls, {
      foreignKey: 'pollId',
      as: 'poll',
    });
  };

  return Like;
};