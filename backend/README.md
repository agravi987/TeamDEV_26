# Clinic Management System – Backend API

A production-ready Node.js/Express backend for a Clinic Management System with video consultations, built with MySQL (Amazon RDS) and AWS S3.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| ORM | Sequelize v6 |
| Database | MySQL 8 / Amazon RDS |
| File Storage | AWS S3 (AWS SDK v3) |
| Auth | JWT + bcryptjs |
| Video Consult | Jitsi Meet |
| Containerization | Docker |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── aws.js            # AWS S3 client
│   │   └── db.js             # Sequelize connection (with pooling)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── doctorController.js
│   │   ├── prescriptionController.js
│   │   └── videoSessionController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js       # JWT auth + role-based authorization
│   │   ├── uploadMiddleware.js     # Multer + multer-s3 for S3 uploads
│   │   └── validationMiddleware.js # express-validator error handler
│   ├── models/
│   │   ├── index.js          # Model associations
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   └── Prescription.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── prescriptionRoutes.js
│   │   └── videoSessionRoutes.js
│   ├── utils/
│   │   ├── jwt.js            # Token generation & verification
│   │   └── response.js       # Standardized response helpers
│   └── app.js                # Express app setup
├── server.js                 # Server entry + DB sync
├── schema.sql                # Raw SQL schema
├── Dockerfile
├── .env.example
└── package.json
```

---

## Setup

### 1. Prerequisites

- Node.js 20+
- MySQL 8 (or an Amazon RDS instance)
- AWS account with S3 bucket

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

**Required env variables:**

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `DB_HOST` | RDS endpoint |
| `DB_USER` | DB username |
| `DB_PASSWORD` | DB password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret key for JWT signing |
| `AWS_ACCESS_KEY` | AWS IAM Access Key ID |
| `AWS_SECRET_KEY` | AWS IAM Secret Access Key |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `S3_BUCKET_NAME` | Your S3 bucket name |

### 4. Setup database

```bash
# Run the provided SQL schema
mysql -h <DB_HOST> -u <DB_USER> -p < schema.sql
```

> **Alternatively**, the app uses Sequelize's `sync()` on startup, which will auto-create tables in development mode.

### 5. Run in development

```bash
npm run dev
```

### 6. Run in production

```bash
npm start
```

### 7. Run in Docker

```bash
docker build -t clinic-backend .
docker run -p 5000:5000 --env-file .env clinic-backend
```

---

## API Reference

All routes are prefixed with `/api/v1`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a user (patient or doctor) |
| POST | `/auth/login` | No | Login and get JWT token |
| GET | `/auth/me` | ✅ JWT | Get current user profile |

### Doctors

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/doctors` | No | List all doctors |
| GET | `/doctors/:id` | No | Get doctor by ID |
| PATCH | `/doctors/profile` | ✅ Doctor | Update own profile |

### Appointments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/appointments` | ✅ Patient | Book an appointment |
| GET | `/appointments/:userId` | ✅ JWT | Get appointments for a user |
| PATCH | `/appointments/:id/status` | ✅ Doctor/Admin | Update appointment status |

### Prescriptions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/prescriptions/upload` | ✅ Doctor | Upload prescription to S3 |
| GET | `/prescriptions/:appointmentId` | ✅ JWT | List prescriptions for appointment |

### Video Sessions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/video-session` | ✅ JWT | Generate Jitsi meeting link |

---

## Health Check

```
GET /health
```

Returns `{ "status": "ok", "timestamp": "..." }`.

---

## Security Notes

- Passwords are hashed using **bcrypt** (salt rounds: 12)
- All protected routes require a valid **JWT Bearer token**
- File uploads are restricted to PDF, JPEG, and PNG (max 10 MB)
- S3 objects are stored with `private` ACL
- Helmet.js sets secure HTTP headers
- Docker container runs as a **non-root user**
