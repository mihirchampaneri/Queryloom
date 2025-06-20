module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'User', key: 'id' },
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    groupInfo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    groupCategory: {
      type: DataTypes.STRING,
    },
    groupProfilePic: {
      type: DataTypes.STRING,
    },
    groupBackgroundImg: {
      type: DataTypes.STRING,
    },
    whoCanPost: {
      type: DataTypes.ENUM('admin', 'anyone'),
      defaultValue: 'anyone',
    },
    visibility: {
      type: DataTypes.ENUM('private', 'public'),
      defaultValue: 'public',
    },
    approvalRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allowIncognitoPost: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    postapproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  Group.associate = (models) => {

    Group.belongsToMany(models.User, {
      through: 'GroupMember',
      as: 'members',
      foreignKey: 'groupId',
      otherKey: 'userId'
    });

    Group.hasMany(models.Polls, {
      foreignKey: 'id',
      as: 'polls',
    });

    Group.belongsToMany(models.Rule, {
      through: 'GroupRules',
      foreignKey: 'groupId',
      as: 'Rules',
    });

    Group.hasMany(models.GroupPost, {
       foreignKey: 'groupId' 
      });

      Group.hasMany(models.GroupMember, { 
        foreignKey: 'groupId' 
      });
  };

  return Group;
};  