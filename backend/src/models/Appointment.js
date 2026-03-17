const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define(
  'Appointment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    appointment_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    meeting_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Post-consultation notes by the doctor',
    },
  },
  {
    tableName: 'appointments',
    indexes: [
      { fields: ['doctor_id'] },
      { fields: ['patient_id'] },
      { fields: ['status'] },
      { fields: ['appointment_time'] },
    ],
  }
);

module.exports = Appointment;
