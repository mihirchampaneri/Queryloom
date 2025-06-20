module.exports = (sequelize, DataTypes) => {
  const Saved = sequelize.define('Saved', {
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
  }, {
    timestamps: true,
    tableName: 'saved',

    indexes: [
      {
        unique: true,
        fields: ['userId', 'pollId'],
        name: 'unique_user_poll_save' 
      }
    ]
  });

  Saved.associate = (models) => {
    Saved.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Saved.belongsTo(models.Polls, {
      foreignKey: 'pollId',
      as: 'poll',
    });
  };

  return Saved;
};