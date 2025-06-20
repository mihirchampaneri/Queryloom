module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
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
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    pollId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Polls',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Comment message cannot be empty."
        }
      }
    },
    attachments: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentCommentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Comments',
        key: 'id'
      }
    },    
  }, {
    timestamps: true,
    tableName: 'comments',
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Comment.belongsTo(models.Polls, {
      foreignKey: 'pollId',
      as: 'poll',
    });

    Comment.hasMany(Comment, { 
      as: 'subcomments', 
      foreignKey: 'parentCommentId' 
    });
    
    Comment.belongsTo(Comment, { 
      as: 'parentComment', 
      foreignKey: 'parentCommentId' 
    });

    Comment.hasMany(models.Like, { 
      as: 'likes', 
      foreignKey: 'commentId' 
    });

  };

  return Comment;
};