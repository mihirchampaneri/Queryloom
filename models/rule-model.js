module.exports = (sequelize, DataTypes) => {
    const Rule = sequelize.define('Rule', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isCustom:{
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
    });  

    Rule.associate = (models) => {
      Rule.belongsToMany(models.Group, {
        through: 'GroupRules',
        foreignKey: 'ruleId',
        as: 'Groups',
      });
      };
      
    return Rule;
  };
  