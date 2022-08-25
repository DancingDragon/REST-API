'use strict';
const {
  Model
} = require('sequelize');
const bcryptjs = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    firstName: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			notEmpty: {
				msg: 'Please provide a first name.',
			},
		},
	},
    lastName : {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			notEmpty: {
				msg: 'Please provide a last name.',
			},
		},
	},
    emailAddress: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: {
			msg: "Email already in use"
		},
		validate: {
			isEmail: {
				msg: 'Please provide a valid email adress.',
			},
		},
	},
    password: {
		type: DataTypes.STRING,
		allowNull: false,
		//set the password to a hashed value instead of plaintext
		set(value) {
			this.setDataValue("password", bcryptjs.hashSync(value));
		},
		validate: {
			notEmpty: {
				msg: 'Password can\'t be empty.',
			},
		},
	},
  }, {
    sequelize,
    modelName: 'User',
  });
  
  //Set up association one to many
  User.associate = (models) => {
	User.hasMany(models.Course, {
		foreignKey: {
			fieldName: 'userId',
			allowNull: false
		},
	});
  };

  
  return User;
};