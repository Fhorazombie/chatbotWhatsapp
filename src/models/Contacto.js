const { Sequelize, DataTypes, ConnectionAcquireTimeoutError } = require('sequelize');
const sequelize = require('../config/conexiondb.js'); // Import the sequelize instance

const Contacto = sequelize.define(
  'Contacto', // Model name
  {
    // Model attributes are defined here
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numWhatsapp: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    saldo: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: true,
    }
  }
);
Contacto.sync()

module.exports = Contacto;