const express = require('express');
const Controller = require('../controllers/userController');



const route = express.Router();


route.post('/signup',Controller.signup);


module.exports = route;





