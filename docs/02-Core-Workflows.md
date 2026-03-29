# Core Workflows & User Journeys

The Clinic Management System orchestrates sophisticated workflows between Patients, Doctors, and Cloud Services to provide a seamless telemedicine experience. Below are the primary workflows of the platform.

## 1. User Registration & Authentication

1. **Sign-up**: Users register with Role Selection (**Patient** or **Doctor**). Passwords and critical information are hashed securely using bcrypt before being persisted to the **MySQL RDS**.
2. **Verification**: 
   - A multi-channel verification payload is crafted. 
   - Using **Nodemailer**, an email OTP is dispatched via **AWS SES**.
   - Concurrently, an SMS notification is generated and transmitted via **AWS SNS** ensuring rapid user validation.
3. **Session Management**: Upon successful login, the Node.js backend issues a signed **JWT (JSON Web Token)**. All subsequent API interactions require a valid Bearer token for access control.

## 2. Appointment Booking & Management

1. **Discovery (Patient)**: Patients query the API to fetch a list of available doctors filtered by specialization.
2. **Scheduling**: A patient selects an available slot and submits an appointment request. This triggers the creation of a pending `Appointment` record in the RDS database.
3. **Action (Doctor)**: Doctors access their specialized dashboard to review pending requests. They can accept, decline, or complete appointments. Status changes trigger SMS alerts (via AWS SNS) to notify the patient immediately.

## 3. Telemedicine Video Sessions

1. **Initiation**: At the scheduled time, both Patient and Doctor navigate to the appointment details and click "Join Video Session".
2. **Secure Link Generation**: The backend Express controller intercepts the request, validates session permissions (via JWT), and dynamically generates a secure, unique meeting session link.
3. **Jitsi Integration**: The unique URL is returned to the frontend, rendering a secure iframe interface leveraging the **Jitsi Meet API** directly within the clinic's UI—guaranteeing data privacy and encrypted peer-to-peer WebRTC connections.

## 4. Digital Prescription Delivery

1. **Generation (Doctor)**: Post-consultation, the Doctor fills out a structured digital prescription form directly from the dashboard. The frontend packages the data and sends a multipart/form-data POST request.
2. **Processing & PDF Creation**: The backend handles the data, merges it with doctor/patient metadata, and programmatically generates a professional, standardized PDF.
3. **Cloud Storage**: The resulting file is securely uploaded directly to an **AWS S3 Bucket** via `multer-s3` and the AWS SDK.
4. **Retrieval**: The S3 Object URL or Presigned URL is safely persisted to the database and returned to the frontend payload, allowing the patient to click and download their permanent digital Rx.
