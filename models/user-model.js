module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user',
      allowNull: false,
    },    
    signupMethod: {
      type: DataTypes.ENUM('email', 'phone'),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    countryCode: {
      type: DataTypes.STRING,
      validate: {
        is: /^\+\d{1,4}$/,
      },
    },
    phone: {
      type: DataTypes.STRING,
      validate: {
        isNumeric: true,
        len: [6, 15],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Countries',
        key: 'name',
      },
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'State',
        key: 'name',
      },
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'City',
        key: 'name',
      },
    },
    annual_income: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'AnnualIncome',
        key: 'name',
      },
    },
    education: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Education',
        key: 'name',
      },
    },
    get_expertise: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Get_expertise',
        key: 'name',
      },
    },
    political_affiliation: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'PoliticalAffiliation',
        key: 'name',
      },
    },
    race: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Race',
        key: 'name',
      },
    },
    relationship: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'RelationshipStatus',
        key: 'name',
      },
    },
    gender: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'gender-model',
        key: 'id',
      },
    },
    birthdayMonth: {
      type: DataTypes.ENUM(
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ),
      allowNull: false,
    },
    birthdayDay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 31,
      },
    },
    birthdayYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1930,
        max: new Date().getFullYear(),
      },
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationStatus: {
      type: DataTypes.ENUM('unverified', 'verified', 'blocked'),
      defaultValue: 'unverified',
      allowNull: false,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['countryCode', 'phone'],
      },
    ],
    tableName: 'users'
  });

  User.associate = models => {
    User.belongsToMany(User, {
      as: 'Followers',
      through: 'UserFollows',
      foreignKey: 'followingId',
      otherKey: 'followerId'
    });

    User.belongsToMany(User, {
      as: 'Followings',
      through: 'UserFollows',
      foreignKey: 'followerId',
      otherKey: 'followingId'
    });

    User.hasMany(models.GroupMember, {
      foreignKey: 'userId',
      as: 'groupMemberships'
    });    

    User.belongsToMany(models.Group, {
      through: 'GroupMember',
      as: 'groups'
    });
    
  };
  return User;
};
