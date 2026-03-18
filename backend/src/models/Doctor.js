const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Doctor = sequelize.define(
  'Doctor',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    specialization: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    availability: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object with available days/times, e.g. { "monday": ["09:00", "17:00"] }',
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    consultation_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avg_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0.0,
      comment: 'Auto-calculated average from patient ratings',
    },
  },
  {
    tableName: 'doctors',
    indexes: [{ fields: ['user_id'] }, { fields: ['specialization'] }],
  }
);

module.exports = Doctor;
