module.exports = (sequelize, DataTypes) => {
  const AnnualIncome = sequelize.define('AnnualIncome', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    range: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    timestamps: false,
    tableName: 'AnnualIncomes',
  });
  return AnnualIncome;
};
