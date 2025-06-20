module.exports = (sequelize, DataTypes) => {
    const City = sequelize.define("City", {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      timestamps: false,
    });
    return City;
  };
  