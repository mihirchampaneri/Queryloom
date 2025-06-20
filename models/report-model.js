module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      }
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    groupPostId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'GroupPost',
        key: 'id'
      }
    },
    pollId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Polls',
        key: 'id'
      }
    },
    reportUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'pollId']
      }
    ]
  });

  Report.associate = (models) => {
    Report.belongsTo(models.User, { 
      foreignKey: 'userId' 
    });
    
    Report.belongsTo(models.User, { 
      foreignKey: 'reportUserId' 
    });
    
    Report.belongsTo(models.GroupPost, { 
      foreignKey: 'groupPostId' 
    });
    
    Report.belongsTo(models.Polls, { 
      foreignKey: 'pollId' 
    });
  };

  return Report;
};
