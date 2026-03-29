# Backend & API Architecture

The core logic of the Clinic Management System is powered by a scalable, modular Node.js REST API built with Express.js. Designed for high performance and extensibility, the backend interfaces directly with Amazon RDS, secure AWS Cloud services, and manages video endpoints.

## Technology Stack

- **Runtime Environment**: Node.js 20
- **Framework**: Express.js
- **Object Relational Mapping (ORM)**: Sequelize v6
- **Database**: MySQL 8 (Amazon RDS)
- **Containerization**: Docker & Docker Compose
- **Cloud Interactions**: AWS SDK v3 for Node.js (S3, SES, SNS)
- **Security & Validation**: JWT, bcryptjs, Express-Validator, Helmet, Morgan

## Security & Reliability Design

1. **Role-Based Access Control (RBAC)**
   - The API uses rigorous middleware layers (`authMiddleware.js`) to parse JWTs, extract user context, and enforce strict role boundaries (Patient vs Doctor).
2. **Input Sanitization & Protection**
   - Implements `express-validator` to scrub and sanitize all incoming payloads, preventing SQL inject-style attacks and data corruption before it reaches the controller logic.
   - `Helmet.js` provides automatic secure HTTP headers.
3. **Container-Native**
   - Fully containerized with a highly optimized `Dockerfile` tailored for AWS ECS or Fargate deployments. Runs seamlessly with a `docker-compose.yml` for aligned local development with MySQL.

## API Structure

The application follows the classic Controller-Route-Model pattern within the `src/` directory to ensure modularity and ease of maintenance:

- **Controllers**: Handle incoming HTTP requests, orchestrate business logic, and send responses. (e.g., `appointmentController.js`, `prescriptionController.js`)
- **Middlewares**: Process requests intermediately for Auth validations and File Uploads (leveraging `multer-s3`).
- **Models**: Sequelize models defining strict schema types (`User`, `Doctor`, `Appointment`, `Prescription`) and relationship associations governing the database structure.
- **Routes**: Clean API routing definitions prefixed strictly to `/api/v1` (e.g., `/api/v1/video-session`).
- **Config**: Manage database pooling (`db.js`) and AWS SDK instantiation (`aws.js`).

## Storage Interfacing
The crucial `Prescriptions` service bypasses local server storage entirely:
- Employs **AWS S3** as the primary storage layer.
- `uploadMiddleware.js` utilizes `multer` chained directly to an S3 bucket stream.
- Objects are restricted with a private ACL architecture ensuring medical records remain firmly protected from unauthorized public access.
