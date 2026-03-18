import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI, videoSessionAPI, prescriptionsAPI, ratingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Calendar, Video, FileText, Download, Loader2, Hospital, Star, X, CheckCircle } from 'lucide-react';
import VerificationBanner from '../components/VerificationBanner';
import DeleteAccountButton from '../components/DeleteAccountButton';
import RatingModal from '../components/RatingModal';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState({});
  const [ratings, setRatings] = useState({}); // appointmentId -> stars (or null)
  const [ratingModal, setRatingModal] = useState(null); // appointment to rate

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentsAPI.getByUserId(user.id);
      const appts = res.data.data;
      setAppointments(appts);
      
      // For completed appointments, fetch prescriptions + check if already rated
      appts.forEach(appt => {
        if (appt.status === 'completed') {
          fetchPrescriptions(appt.id);
          checkRating(appt.id);
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

  const checkRating = async (apptId) => {
    try {
      const res = await ratingsAPI.getMyRating(apptId);
      if (res.data.data) {
        setRatings(prev => ({ ...prev, [apptId]: res.data.data.stars }));
      } else {
        setRatings(prev => ({ ...prev, [apptId]: null }));
      }
    } catch (err) {
      setRatings(prev => ({ ...prev, [apptId]: null }));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentsAPI.updateStatus(id, status);
      toast.success(status === 'cancelled' ? 'Appointment cancelled' : 'Appointment marked as completed');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const joinVideoSession = async (appt) => {
    try {
      if (!appt.meeting_link) {
        const res = await videoSessionAPI.create(appt.id);
        navigate(`/session/${appt.id}?link=${encodeURIComponent(res.data.data.meeting_link)}`);
      } else {
        navigate(`/session/${appt.id}?link=${encodeURIComponent(appt.meeting_link)}`);
      }
    } catch (err) {
      toast.error('Failed to join session');
    }
  };

  const handleRated = (apptId, stars) => {
    setRatings(prev => ({ ...prev, [apptId]: stars }));
  };

  const renderRatingStars = (stars) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={14} fill={n <= stars ? '#f59e0b' : 'none'} stroke={n <= stars ? '#f59e0b' : '#94a3b8'} strokeWidth={1.5} />
      ))}
    </div>
  );

  return (
    <div className="page-wrapper">
      <VerificationBanner />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {new Date(appt.appointment_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <button 
                      onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0.2rem' }}
                      title="Cancel Appointment"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="card-title">Dr. {appt.doctor.name}</h3>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {new Date(appt.appointment_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
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

                {appt.status === 'confirmed' && (
                  <button
                    className="btn btn-ghost btn-full"
                    style={{ fontSize: '0.85rem', color: 'var(--color-text)', borderColor: 'var(--color-border)', marginTop: '0.25rem' }}
                    onClick={() => handleUpdateStatus(appt.id, 'completed')}
                  >
                    <CheckCircle size={16} /> Mark as Completed
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

                {/* Rating section for completed appointments */}
                {appt.status === 'completed' && (
                  ratings[appt.id] != null ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(245,158,11,0.08)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem', color: 'var(--color-text-muted)'
                    }}>
                      {renderRatingStars(ratings[appt.id])}
                      <span>Your rating</span>
                    </div>
                  ) : ratings[appt.id] === null ? (
                    <button
                      className="btn btn-ghost btn-full"
                      style={{ fontSize: '0.85rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                      onClick={() => setRatingModal(appt)}
                    >
                      <Star size={16} /> Rate This Consultation
                    </button>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteAccountButton />

      {/* Rating Modal */}
      <RatingModal
        isOpen={!!ratingModal}
        onClose={() => setRatingModal(null)}
        appointment={ratingModal}
        onRated={handleRated}
      />
    </div>
  );
};

export default PatientDashboard;
