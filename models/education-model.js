module.exports = (sequelize, DataTypes) => {
  const Education = sequelize.define('Education', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    timestamps: false,
    tableName: 'educations',
  });

  return Education;
};