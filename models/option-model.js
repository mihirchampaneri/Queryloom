module.exports = (sequelize, DataTypes) => {
  const Option = sequelize.define('Option', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Option name cannot be empty."
        }
      }
    },
  }, {
    timestamps: true, 
  });

  Option.associate = (models) => {
    Option.belongsTo(models.Polls, {
      foreignKey: 'pollId',
      as: 'poll',
    });

    Option.hasMany(models.Vote, {
      foreignKey: 'optionId',
      as: 'votes'
    });
    
  };

  return Option;
};