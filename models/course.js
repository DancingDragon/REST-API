'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Course.init({
    title: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			notEmpty: {
				msg: 'Please provide a title.',
			},
		},
	},
    description: {
		type: DataTypes.TEXT,
		allowNull: false,
		validate: {
			notEmpty: {
				msg: 'Please provide a description.',
			},
		},
	},
    estimatedTime: DataTypes.STRING,
    materialsNeeded: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Course',
  });
  
  //Set up association one to one
  Course.associate = (models) => {
	Course.belongsTo(models.User, {
		foreignKey: {
			fieldName: 'userId',
			allowNull: false
		},
	});

  };
  
  
  return Course;
};