# System Architecture

The Clinic Management System is designed with a modern, cloud-native, and microservices-oriented architecture to ensure high availability, scalability, and security. Below is a detailed breakdown of the infrastructure components and their roles in the system.

## High-Level Architecture Flow

1. **Client Access**: Users (Patients and Doctors) access the platform through a React SPA (Single Page Application).
2. **Content Delivery**: The frontend is hosted as a static website on **AWS S3** and distributed globally via **AWS CloudFront** for low latency and high performance.
3. **API Routing**: Client API requests are securely routed through **AWS API Gateway**, ensuring controlled access and rate-limiting.
4. **Load Balancing**: The **Elastic Load Balancer (ELB)** distributes incoming API traffic across multiple backend container instances.
5. **Compute**: The core business logic is handled by a containerized **Node.js/Express Backend** running on **AWS ECS** (Elastic Container Service).
6. **Data Persistence**: Relational data (User profiles, Doctor details, Appointments) is securely stored in an **Amazon RDS (MySQL)** managed database.
7. **Storage**: Medical records, specifically PDF prescriptions, are securely stored in a dedicated **AWS S3 Bucket** and accessed via the AWS SDK.
8. **Third-Party Integrations**:
   - **Video Conferencing**: Real-time telemedicine sessions are powered by **Jitsi**.
   - **Notifications**: Transactional emails (verification, notifications) are sent using **Nodemailer** (via AWS SES), while SMS alerts use **AWS SNS**.
9. **Observability**: **AWS CloudWatch** aggregates logs from the ECS containers for monitoring and debugging.

## Core AWS Services Utilized

- **S3 & CloudFront**: Delivers the frontend payload rapidly and securely. S3 is also used for immutable storage of prescription PDFs.
- **API Gateway & ELB**: Provides a robust entry point and load distribution layer for backend microservices.
- **ECS (Elastic Container Service)**: Hosts the stateless Node.js backend using Docker containers, allowing for rapid horizontal scaling based on load.
- **RDS (Relational Database Service)**: Provides a highly available and backed-up MySQL environment.
- **SNS**: Delivers critical SMS notifications directly to user devices.
- **CloudWatch**: Centralized logging and monitoring for the backend containers.

## Security & Scalability

By decoupling the frontend (S3/CloudFront) from the backend API (ECS/RDS), the system can independently scale compute and static asset delivery. Using AWS-managed services like RDS and API Gateway reduces the operational overhead while enhancing security through IAM roles, VPC isolation, and automated backups.
