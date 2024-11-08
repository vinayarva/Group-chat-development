const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()

const sequelize = require('./database/db');

const userRoute = require('./routes/userRoute');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(userRoute); 

sequelize
    .sync({ force: false }) 
    .then(() => {
        app.listen(process.env.SERVER_PORT, () => {
            console.log('Server is running on http://localhost:4000/');
        });
    })
    .catch((err) => {
        console.error('Error connecting to database:', err);
    });