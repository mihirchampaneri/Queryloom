module.exports = (sequelize, DataTypes) => {
  const GetExpertise = sequelize.define('Get_expertise', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    delete_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: false,
    tableName: 'get_expertise'
  });
  return GetExpertise;
};
