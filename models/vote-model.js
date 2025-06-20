module.exports = (sequelize, DataTypes) => {
  const Vote = sequelize.define('Vote', {
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
      allowNull: false,
      references: {
        model: 'Polls',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    optionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Option',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  }, {
    timestamps: true,
    tableName: 'votes',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'pollId'] 
      }
    ]
  });

  Vote.associate = (models) => {
    Vote.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Vote.belongsTo(models.Polls, {
      foreignKey: 'pollId',
      as: 'poll',
    });

    Vote.belongsTo(models.Option, {
      foreignKey: 'optionId',
      as: 'option',
    });
  };

  return Vote;
};