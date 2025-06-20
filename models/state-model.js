module.exports = (sequelize, DataTypes) => {
  const State = sequelize.define('State', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    countryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    timestamps: true,
  });

  return State;
};
