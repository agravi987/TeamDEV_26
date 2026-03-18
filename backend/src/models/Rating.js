const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rating = sequelize.define(
  'Rating',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // one rating per appointment
      references: { model: 'appointments', key: 'id' },
      onDelete: 'CASCADE',
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'ratings',
    indexes: [
      { unique: true, fields: ['appointment_id'] },
      { fields: ['doctor_id'] },
      { fields: ['patient_id'] },
    ],
  }
);

module.exports = Rating;
