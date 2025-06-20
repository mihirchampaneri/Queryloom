module.exports = (sequelize, DataTypes) => {
  const PoliticalAffiliation = sequelize.define('PoliticalAffiliation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.ENUM('Democrat', 'Republican', 'Other'),
      allowNull: false,
      defaultValue: 'Other',
    },
  }, {
    tableName: 'political_affiliation',
    timestamps: false,
  });
  return PoliticalAffiliation;
};
