module.exports = (sequelize, DataTypes) => {
  const Race = sequelize.define('Race', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: 'Races',
    timestamps: true,
  });

  return Race;
};
