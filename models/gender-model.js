module.exports = (sequelize, DataTypes) => {
    const Gender = sequelize.define("Gender", {
      value: {
        type: DataTypes.ENUM('Male','Female','Other'),
        allowNull: false,
      },
    });
    return Gender;
  };
  