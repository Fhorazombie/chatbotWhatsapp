// conect to database with sequelize on sqlite
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database/chatbotWhatsapp.db'),
  logging: false, // Disable logging for cleaner output
});
// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
// Export the sequelize instance
module.exports = sequelize;