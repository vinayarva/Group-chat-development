const { Sequelize, DataTypes } = require('sequelize');
const db = require('../database/db')
const User = db.define('User', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^[0-9]+$/ 
        }
    }
});

module.exports = User;