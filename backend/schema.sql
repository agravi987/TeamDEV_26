-- ============================================================
--  Clinic Management System – SQL Schema
--  Compatible with MySQL 8.x (Amazon RDS)
-- ============================================================

CREATE DATABASE IF NOT EXISTS clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinic_db;

-- ─── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  phone_number VARCHAR(20),
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','doctor','patient') NOT NULL DEFAULT 'patient',
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  email_otp   VARCHAR(10),
  email_otp_expiry DATETIME,
  phone_otp   VARCHAR(10),
  phone_otp_expiry DATETIME,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ─── doctors ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id                CHAR(36)       NOT NULL DEFAULT (UUID()),
  user_id           CHAR(36)       NOT NULL,
  specialization    VARCHAR(150)   NOT NULL,
  availability      JSON,
  experience_years  INT            DEFAULT 0,
  consultation_fee  DECIMAL(10,2),
  bio               TEXT,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doctors_user_id (user_id),
  KEY idx_doctors_specialization (specialization),
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── appointments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                CHAR(36)      NOT NULL DEFAULT (UUID()),
  doctor_id         CHAR(36)      NOT NULL,
  patient_id        CHAR(36)      NOT NULL,
  appointment_time  DATETIME      NOT NULL,
  status            ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  meeting_link      VARCHAR(500),
  reason            TEXT,
  notes             TEXT,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appt_doctor_id    (doctor_id),
  KEY idx_appt_patient_id   (patient_id),
  KEY idx_appt_status       (status),
  KEY idx_appt_time         (appointment_time),
  CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES users(id),
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ─── prescriptions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  appointment_id  CHAR(36)     NOT NULL,
  file_url        VARCHAR(1000) NOT NULL,
  file_key        VARCHAR(500),
  notes           TEXT,
  uploaded_by     CHAR(36)     NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pres_appointment_id (appointment_id),
  KEY idx_pres_uploaded_by    (uploaded_by),
  CONSTRAINT fk_pres_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_pres_uploader    FOREIGN KEY (uploaded_by)    REFERENCES users(id)
) ENGINE=InnoDB;
