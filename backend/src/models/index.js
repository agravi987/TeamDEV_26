const sequelize = require('../config/db');
const User = require('./User');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const Prescription = require('./Prescription');
const Rating = require('./Rating');

// ─── Associations ─────────────────────────────────────────────

// User <-> Doctor (one-to-one)
User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctorProfile', onDelete: 'CASCADE' });
Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (doctor) <-> Appointment
User.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'doctorAppointments' });
Appointment.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// User (patient) <-> Appointment
User.hasMany(Appointment, { foreignKey: 'patient_id', as: 'patientAppointments' });
Appointment.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });

// Appointment <-> Prescription
Appointment.hasMany(Prescription, { foreignKey: 'appointment_id', as: 'prescriptions', onDelete: 'CASCADE' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// Appointment <-> Rating (one-to-one)
Appointment.hasOne(Rating, { foreignKey: 'appointment_id', as: 'rating', onDelete: 'CASCADE' });
Rating.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// User (patient) <-> Rating
User.hasMany(Rating, { foreignKey: 'patient_id', as: 'givenRatings' });
Rating.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });

// User (doctor) <-> Rating
User.hasMany(Rating, { foreignKey: 'doctor_id', as: 'receivedRatings' });
Rating.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

module.exports = { sequelize, User, Doctor, Appointment, Prescription, Rating };
