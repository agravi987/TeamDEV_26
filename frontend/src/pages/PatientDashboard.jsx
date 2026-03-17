import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI, videoSessionAPI, prescriptionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Calendar, Video, FileText, Download, Loader2, Hospital } from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentsAPI.getByUserId(user.id);
      const appts = res.data.data;
      setAppointments(appts);
      
      // Fetch prescriptions for each completed appointment
      appts.forEach(appt => {
        if (appt.status === 'completed') {
          fetchPrescriptions(appt.id);
        }
      });
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async (apptId) => {
    try {
      const res = await prescriptionsAPI.getByAppointment(apptId);
      if (res.data.data.length > 0) {
        setPrescriptions(prev => ({ ...prev, [apptId]: res.data.data }));
      }
    } catch (err) {
      console.error('Failed to fetch prescriptions', err);
    }
  };

  const joinVideoSession = async (appt) => {
    try {
      if (!appt.meeting_link) {
        // Generate link if doctor hasn't yet, but patient is trying to join
        const res = await videoSessionAPI.create(appt.id);
        navigate(`/session/${appt.id}?link=${encodeURIComponent(res.data.data.meeting_link)}`);
      } else {
        navigate(`/session/${appt.id}?link=${encodeURIComponent(appt.meeting_link)}`);
      }
    } catch (err) {
      toast.error('Failed to join session');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="section-title">Patient Dashboard</h1>
          <p className="section-subtitle">Manage your appointments and medical records.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/doctors')}>
          <Calendar size={18} /> Book New Appointment
        </button>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Your Appointments</h2>

      {loading ? (
        <div className="loading-screen"><Loader2 className="spinner" /></div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <Hospital size={48} />
          <h3>No Appointments Yet</h3>
          <p>You haven't booked any consultations.</p>
          <button className="btn btn-ghost mt-2" onClick={() => navigate('/doctors')}>Find a Doctor</button>
        </div>
      ) : (
        <div className="grid-auto">
          {appointments.map(appt => (
            <div key={appt.id} className="card flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className={`badge badge-${appt.status}`}>{appt.status}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {new Date(appt.appointment_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <div>
                <h3 className="card-title">Dr. {appt.doctor.name}</h3>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {new Date(appt.appointment_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {appt.reason && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>
                    "{appt.reason}"
                  </p>
                )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(appt.status === 'confirmed' || appt.status === 'pending') && (
                  <button 
                    className="btn btn-accent btn-full"
                    onClick={() => joinVideoSession(appt)}
                  >
                    <Video size={18} /> Join Check-in
                  </button>
                )}

                {appt.status === 'completed' && prescriptions[appt.id] && prescriptions[appt.id].map(rx => (
                  <a 
                    key={rx.id}
                    href={rx.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-ghost btn-full"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <FileText size={16} /> View Rx.pdf <Download size={14} style={{ marginLeft: 'auto' }} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
