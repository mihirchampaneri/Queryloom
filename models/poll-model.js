module.exports = (sequelize, DataTypes) => {
  const Polls = sequelize.define('Polls', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    questionText: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postType: {
      type: DataTypes.ENUM('post', 'poll'),
      allowNull: false,
      defaultValue: 'post',
    },
    expiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    visibility: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Publish',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    commentPermission: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Allowcomments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    incognito: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    unpublish: {
      type: DataTypes.BOOLEAN,
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
    tableName: 'Polls',
    timestamps: true,
  });

  Polls.associate = models => {
    Polls.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'user',
    });

    Polls.hasMany(models.Option, {
      foreignKey: 'pollId',
      as: 'options',
      onDelete: 'CASCADE',
    });

    Polls.hasMany(models.Comment, {
      foreignKey: 'pollId',
      as: 'comments',
      onDelete: 'CASCADE',
    });
    
    Polls.hasMany(models.GroupPost, {
      foreignKey: 'pollId',
      as: 'groupposts',
      onDelete: 'CASCADE',
    });

    Polls.hasMany(models.Vote, {
      foreignKey: 'pollId',
      as: 'votes',
      onDelete: 'CASCADE',
    });

    Polls.hasMany(models.Like, {
      foreignKey: 'pollId',
      as: 'likes',
      onDelete: 'CASCADE',
    });

    Polls.hasMany(models.Saved, {
      foreignKey: 'pollId',
      as: 'saves',
      onDelete: 'CASCADE',
    });

    Polls.hasMany(models.Attachment, {
      foreignKey: 'pollId',
      as: 'attachments',
      onDelete: 'CASCADE',
    });

    Polls.hasMany(models.Report, {
      foreignKey: 'pollId',
      as: 'reports',
      onDelete: 'CASCADE',
    });
  };
  return Polls;
};