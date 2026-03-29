# Frontend & UI Architecture

The Clinic Management System frontend is a high-performance, responsive Single Page Application (SPA) designed exclusively via **React 18** and **Vite**. It provides a sleek, modern, and dark-themed UI focused on a seamless patient-doctor user experience.

## Technology Stack

- **Framework & Build Tool**: React 18 / Vite
- **Routing Engine**: React Router DOM v6
- **Styling Methodology**: Custom Utility & Component-based Vanilla CSS (Dark Theme System)
- **Iconography**: Lucide React
- **Network Requests**: Intercepting configured Axios Client
- **State Management**: Centralized Context API (`AuthContext`)
- **Notifications**: React Hot Toast

## Component & Layout Blueprint

The application divides UI interactions via clear structural boundaries located in the `src/` directory:

1. **Pages Directory (`/pages`)**
   - High-level composite views such as `PatientDashboard.jsx`, `DoctorDashboard.jsx`, and `VideoSession.jsx`.
   - Distinct logic isolates data fetching from representation.
   
2. **Components Layer (`/components`)**
   - Reusable, stateless UI blocks.
   - Example: `ProtectedRoute.jsx` wraps around sensitive React Router paths, referencing the `AuthContext` to instantly redirect unauthenticated users to the `/login` portal.

3. **Context Layer (`/context`)**
   - `AuthContext.jsx` manages the global authentication state.
   - Persists JWT tokens, manages active User payloads, and exposes centralized `login()`, `logout()`, and `verify()` handles across the tree.

4. **Services Layer (`/services`)**
   - Centralizes the Axios instantiated client (`api.js`).
   - Automatically injects the JWT Bearer token into HTTP headers on every request via Interceptors. Enables universal error handling for 401/403 responses.

## Key UI Workflows

- **Role-Dependent Dashboards**: 
  - Patients see visual cards categorized into "Doctors", "My Appointments", and "Prescriptions".
  - Doctors receive tailored tables to "Manage Schedule", "Upcoming Sessions", and specialized "Complete Consultation" forms for PDF uploads.
- **Embedded Telehealth (Jitsi)**:
  - Complex logic wraps a raw `iframe` integration to bind real-time Jitsi video conferences directly into the UI, without disrupting the SPA state or breaking the user away from their session.
- **Dynamic Feedback**: Implements non-blocking, elegant toast notifications using `react-hot-toast` to notify users of successful bookings, OTP verifications, or session expirations.
