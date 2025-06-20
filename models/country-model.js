module.exports = (sequelize, DataTypes) => {
    const Countries = sequelize.define("Countries", {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    }, {
      timestamps: false,
    });
    return Countries;
  };
  