module.exports = (sequelize, DataTypes) => {
  const RelationshipStatus = sequelize.define('RelationshipStatus', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    timestamps: false,
    tableName: 'Relationshipstatuses',
  });
  return RelationshipStatus;
};