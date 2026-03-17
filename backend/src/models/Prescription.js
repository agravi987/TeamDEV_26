const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Prescription = sequelize.define(
  'Prescription',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    file_url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      comment: 'S3 URL of the uploaded prescription file',
    },
    file_key: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'S3 object key for future operations',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'prescriptions',
    indexes: [{ fields: ['appointment_id'] }, { fields: ['uploaded_by'] }],
  }
);

module.exports = Prescription;
