var express = require('express');
var router = express.Router();

const { Sequelize, User, Course } =  require('../models/');
const { Op } = Sequelize;

const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

//Generic error handler
function asyncHandler(cb) {
	return async (req, res, next) => {
		try {
			await cb(req, res, next);
		} catch (error) {
			error.message = error.message || "Sorry! There was an unexpected error on the server.";
			error.status = (error.status || 500);
			console.log(error.status + ": " + res.locals.message); 
			res.status(error.status).json({"message":error.message});
		}
	}
		
}

//Authenticator authenticates authorities
const authenticateUser = async (req, res, next) => {
	//Use the basic auth library to authenticate user
	const credentials = auth(req);
	let message;
	if (credentials) {
		//Find related user
		const user = await User.findOne({ where: { emailAddress: credentials.name } });
		if (user) {
			//Check if passwords match
			const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
			
			if (authenticated) {
				console.log('Authentication successful for ' + user.emailAddress);
				req.currentUser = user;
			} else {
				message = `Authentication failure for email: ${user.emailAddress}`;
			}
		} else {
			message = `User not found for email: ${credentials.name}`;
		}
	} else {
		message = 'Auth header not found';
	}
	if (message) {
		console.warn(message);

		// Return a response with a 401 Unauthorized HTTP status code.
		res.status(401).json({ message: 'Access Denied' });
	} else {
		next();
	}
}


//USERS
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
	//Get the current logged in user
	const currentUser = req.currentUser;
	const user = await User.findByPk(currentUser.id, {attributes: {exclude: ["password", "createdAt", "updatedAt"]}});
	res.status(200).json(user);
}));

router.post('/users', asyncHandler(async (req, res) => {
	try {
		//Create a new user. Password is hashed in the User password setter.
		const user = await User.create(req.body);
		res.location('/').status(201).json();
	} catch (error) {
		console.log(error);
		//Check for validation errors or constraint error
		if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
			const errors = { "errors":error.errors.map(err => err.message)};
			res.status(400).json(errors);
		} else {
			throw Error("Error creating a new user");
		}
	}
}));

//COURSES

router.get('/courses', asyncHandler(async (req, res) => {
	//find the courses and exclude createdAt, updatedAt
	const courses = await Course.findAll({
		include: [{
			model: User,
			attributes: ["id", "firstName", "lastName", "emailAddress"]
		}],
		attributes: {  
			exclude: ["createdAt", "updatedAt"]	
		}
	});
	res.status(200).json(courses);
}));


router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
	let errors = [];
	//CHeck for title and description
	if (!req.body.title) errors.push("Requires a title.");
	if (!req.body.description) errors.push("Requires a description.");
	
	if (errors.length > 0) {
		res.status(400).json({errors});
		return;
	}
	
	//authenticate user
	if (!req.currentUser.id) {
		res.status(401).json("Access denied.");
		return;
	}
	
	//Create the course
	try {
		//set the userId to the currently logged in user
		req.body.userId = req.currentUser.id;
		//create course
		const course = await Course.create(req.body);
		const courseId = course.dataValues.id;
		res.location('/courses/' + courseId).status(201).json();
	} catch (error) {
		if (error.name === 'SequelizeValidationError') {
			const errors = {"errors":error.errors.map(err => err.message)};
			res.status(400).json(errors)
		} else {
			throw Error("Error creating a new course");
		}
	}
}));

router.get('/courses/:id', asyncHandler(async (req, res) => {
	//find the course and exclude createdAt, updatedAt
	const course = await Course.findByPk(req.params.id, {
		include: [{
			model: User,
			attributes: ["id", "firstName", "lastName", "emailAddress"]
		}],
		attributes: {  
			exclude: ["createdAt", "updatedAt"]	
		}
	});
	
	//Throw 404 if courseid not found in database
	if (course) {
		res.status(200).json(course);
	} else {
		res.status(404).json({"message": "Course not found"});
	}
}));

router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
	const course = await Course.findByPk(req.params.id);
	
	let errors = [];
	//CHeck for title and description
	if (!req.body.title) errors.push("Requires a title.");
	if (!req.body.description) errors.push("Requires a description.");
	
	if (errors.length > 0) {
		res.status(400).json({errors});
		return;
	}
	
	//authenticate user
	if (req.currentUser.id !== course.userId) {
		res.status(403).json("Access denied.");
		return;
	}
	
	//Throw 404 if courseid not found in database
	if (course) {
		await course.update(req.body);
		res.status(204).json();
	} else {
		res.status(404).json({"message":"Course not found."});
	}
}));

router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
	const course = await Course.findByPk(req.params.id);
	//authenticate user
	if (req.currentUser.id !== course.userId) {
		res.status(403).json("Access denied.");
		return;
	}
	
	//Throw 404 if courseid not found in database
	if (course) {
		await course.destroy();
		res.status(204).json();
	} else {
		res.status(404).json({"message":"Course not found."});
	}
}));



module.exports = router;