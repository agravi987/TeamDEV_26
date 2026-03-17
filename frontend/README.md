# Clinic Management System – Frontend Application

A production-ready React (Vite) frontend for the Clinic Management System featuring role-based dashboards, video consultations (Jitsi), and S3 prescription uploads.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 / Vite |
| Routing | React Router v6 |
| Styling | Custom CSS Design System (Dark Theme) |
| Icons | Lucide React |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Video | Jitsi Iframe API |

---

## Folder Structure

```
frontend/
├── src/
│   ├── components/         # Shared UI components
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx # Global auth state & logic
│   ├── pages/              # Application views
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── DoctorsList.jsx
│   │   ├── PatientDashboard.jsx
│   │   ├── DoctorDashboard.jsx
│   │   └── VideoSession.jsx
│   ├── services/
│   │   └── api.js          # Centralized API calls & Axios interceptors
│   ├── App.jsx             # React Router setup & Toaster
│   ├── main.jsx            # Entry point
│   └── index.css           # Global design system variables
├── .env                    # Environment variables (VITE_API_URL)
└── package.json
```

---

## Setup & Running

### 1. Prerequisites
- Node.js 20+
- The `backend` must be running locally on port 5000.

### 2. Install dependencies
```bash
cd frontend
npm install
```

### 3. Environment Variables
Make sure the `.env` file exists in the root of the `frontend` folder:
```
VITE_API_URL=http://localhost:5000/api/v1
```

### 4. Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## Testing Scenarios

1. **Registration & Roles:** Register a new user and toggle the tab to select "Patient" or "Doctor". Doctors require a "Specialization".
2. **Book Appointment (Patient):** Login as a patient, browse the Doctors list, and click "Book Appointment".
3. **Accept/Manage (Doctor):** Login as the doctor requested. See the schedule in the dashboard.
4. **Video Session:** Both doctor and patient will see a "Join Video Session" button. It opens a Jitsi iframe securely.
5. **Prescription Upload (Doctor):** In the doctor dashboard, select "Complete & Upload Rx" to securely upload a PDF to AWS S3. The patient can then download it.
