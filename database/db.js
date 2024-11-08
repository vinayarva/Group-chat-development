
const { Sequelize } = require('sequelize');


const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    dialect: 'mysql',
    host: process.env.DB_PORT,
    // port: process.env.DB_PORT, // Optional: Ensure DB_PORT is defined in .env if used
    logging: false // Disable SQL logging for cleaner output
});

// // Test the database connection
// sequelize.authenticate()
//     .then(() => {
//         console.log('Connection has been established successfully.');
//     })
//     .catch(err => {
//         console.error('Error connecting to the database:', err);
//     });

module.exports = sequelize;
