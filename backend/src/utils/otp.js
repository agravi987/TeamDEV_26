const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Configure Nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const generateNumericOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

// ─── Email sending helper ──────────────────────────────────────

const sendMail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: `"HealthSync Clinic" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`[Mailer] Email sent to ${to} | MsgId: ${info.messageId}`);
  return info;
};

// ─── OTP Verification Email ────────────────────────────────────

const sendEmailOTP = async (email, otp) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #00d4aa, #0073e6); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">🏥 HealthSync</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Email Verification</p>
      </div>
      <div style="padding: 36px 32px; background: #1e293b;">
        <h2 style="color: #f1f5f9; font-size: 20px; margin-top: 0;">Your verification code</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Use the code below to verify your email address. It expires in <strong style="color:#00d4aa">10 minutes</strong>.</p>
        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #00d4aa; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div style="padding: 16px 32px; background: #0f172a; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 HealthSync Clinic. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendMail(email, '🔐 Your HealthSync Verification Code', html);
};

// ─── Welcome Email (sent on registration) ─────────────────────

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #00d4aa, #0073e6); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">🏥 HealthSync</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Welcome aboard!</p>
      </div>
      <div style="padding: 36px 32px; background: #1e293b;">
        <h2 style="color: #f1f5f9; font-size: 22px; margin-top: 0;">Hi ${name}! 👋</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          Welcome to <strong style="color:#00d4aa">HealthSync</strong> — your trusted digital health platform. Your account has been created successfully.
        </p>
        <p style="color: #94a3b8; line-height: 1.6;">
          Please verify your email address to unlock all features. A separate OTP email has been sent to you.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email" 
             style="background: linear-gradient(135deg, #00d4aa, #0073e6); color: #fff; text-decoration: none; 
                    padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            Verify My Email →
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't create this account, please ignore this email.</p>
      </div>
      <div style="padding: 16px 32px; background: #0f172a; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 HealthSync Clinic. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendMail(email, '🎉 Welcome to HealthSync!', html);
};

// ─── Appointment Booked Email ──────────────────────────────────

const sendAppointmentBookedEmail = async ({ patientEmail, patientName, doctorEmail, doctorName, appointmentTime, reason }) => {
  const formattedTime = new Date(appointmentTime).toLocaleString('en-IN', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });

  // To patient
  const patientHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0073e6, #00d4aa); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🏥 HealthSync</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Appointment Confirmation</p>
      </div>
      <div style="padding: 36px 32px; background: #1e293b;">
        <h2 style="color: #f1f5f9; margin-top: 0;">Hi ${patientName}!</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Your appointment request has been sent successfully. Here are the details:</p>
        <div style="background: #0f172a; border-left: 4px solid #00d4aa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Doctor:</strong> Dr. ${doctorName}</p>
          <p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Date & Time:</strong> ${formattedTime}</p>
          ${reason ? `<p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Reason:</strong> ${reason}</p>` : ''}
          <p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Status:</strong> <span style="color:#f59e0b">⏳ Pending Confirmation</span></p>
        </div>
        <p style="color: #64748b; font-size: 13px;">You'll receive another email once the doctor confirms your appointment.</p>
      </div>
      <div style="padding: 16px 32px; background: #0f172a; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 HealthSync Clinic.</p>
      </div>
    </div>
  `;

  // To doctor
  const doctorHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #7c3aed, #0073e6); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🏥 HealthSync</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">New Appointment Request</p>
      </div>
      <div style="padding: 36px 32px; background: #1e293b;">
        <h2 style="color: #f1f5f9; margin-top: 0;">New request, Dr. ${doctorName}</h2>
        <p style="color: #94a3b8; line-height: 1.6;">A patient has requested an appointment with you:</p>
        <div style="background: #0f172a; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Patient:</strong> ${patientName}</p>
          <p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Date & Time:</strong> ${formattedTime}</p>
          ${reason ? `<p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Reason:</strong> ${reason}</p>` : ''}
        </div>
        <p style="color: #64748b; font-size: 13px;">Please log in to your dashboard to confirm or decline this request.</p>
      </div>
      <div style="padding: 16px 32px; background: #0f172a; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 HealthSync Clinic.</p>
      </div>
    </div>
  `;

  await Promise.all([
    sendMail(patientEmail, '📅 Appointment Request Sent — HealthSync', patientHtml),
    sendMail(doctorEmail, '🔔 New Appointment Request — HealthSync', doctorHtml),
  ]);
};

// ─── Appointment Status Update Email ──────────────────────────

const sendAppointmentStatusEmail = async ({ patientEmail, patientName, doctorName, appointmentTime, status }) => {
  const formattedTime = new Date(appointmentTime).toLocaleString('en-IN', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });

  const statusInfo = {
    confirmed: { icon: '✅', color: '#22c55e', label: 'Confirmed', message: 'Your appointment has been confirmed by the doctor. Please be ready at the scheduled time.' },
    cancelled: { icon: '❌', color: '#ef4444', label: 'Cancelled', message: 'Unfortunately, your appointment has been cancelled. Please book a new slot at your convenience.' },
    completed: { icon: '🎉', color: '#00d4aa', label: 'Completed', message: 'Your appointment has been marked as completed. Thank you for choosing HealthSync!' },
  };

  const s = statusInfo[status] || { icon: 'ℹ️', color: '#64748b', label: status, message: 'Your appointment status has been updated.' };

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, ${s.color}, #0073e6); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🏥 HealthSync</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Appointment ${s.label}</p>
      </div>
      <div style="padding: 36px 32px; background: #1e293b;">
        <h2 style="color: #f1f5f9; margin-top: 0;">${s.icon} Hi ${patientName}!</h2>
        <p style="color: #94a3b8; line-height: 1.6;">${s.message}</p>
        <div style="background: #0f172a; border-left: 4px solid ${s.color}; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Doctor:</strong> Dr. ${doctorName}</p>
          <p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Date & Time:</strong> ${formattedTime}</p>
          <p style="margin: 6px 0; color: #94a3b8;"><strong style="color:#f1f5f9">Status:</strong> <span style="color:${s.color}">${s.icon} ${s.label}</span></p>
        </div>
      </div>
      <div style="padding: 16px 32px; background: #0f172a; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 HealthSync Clinic.</p>
      </div>
    </div>
  `;

  return sendMail(patientEmail, `${s.icon} Appointment ${s.label} — HealthSync`, html);
};

// ─── Prescription Ready Email ──────────────────────────────────

const sendPrescriptionEmail = async ({ patientEmail, patientName, doctorName, appointmentTime }) => {
  const formattedTime = new Date(appointmentTime).toLocaleString('en-IN', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0073e6, #7c3aed); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🏥 HealthSync</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Prescription Ready</p>
      </div>
      <div style="padding: 36px 32px; background: #1e293b;">
        <h2 style="color: #f1f5f9; margin-top: 0;">📄 Hi ${patientName}!</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          Dr. <strong style="color:#f1f5f9">${doctorName}</strong> has uploaded your prescription for the appointment on <strong style="color:#f1f5f9">${formattedTime}</strong>.
        </p>
        <p style="color: #94a3b8; line-height: 1.6;">You can view and download it from your patient dashboard.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
             style="background: linear-gradient(135deg, #0073e6, #7c3aed); color: #fff; text-decoration: none;
                    padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            View Prescription →
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">Keep this prescription safe and follow all medication instructions.</p>
      </div>
      <div style="padding: 16px 32px; background: #0f172a; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 HealthSync Clinic.</p>
      </div>
    </div>
  `;

  return sendMail(patientEmail, '📄 Your Prescription is Ready — HealthSync', html);
};

module.exports = {
  generateNumericOTP,
  sendEmailOTP,
  sendWelcomeEmail,
  sendAppointmentBookedEmail,
  sendAppointmentStatusEmail,
  sendPrescriptionEmail,
};
