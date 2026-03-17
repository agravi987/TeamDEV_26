import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsAPI, appointmentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Star, CalendarHeart, Loader2 } from 'lucide-react';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Booking modal state
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await doctorsAPI.getAll();
      setDoctors(res.data.data);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (doc) => {
    if (!isAuthenticated) {
      toast('Please login to book an appointment', { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (user?.role !== 'patient') {
      toast.error('Only patients can book appointments');
      return;
    }
    setBookingDoctor(doc);
    // Suggest next hour as default time
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    setAppointmentTime(nextHour.toISOString().slice(0, 16));
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    try {
      setBookingLoading(true);
      
      const timeObj = new Date(appointmentTime);
      if (timeObj < new Date()) {
        toast.error('Cannot book in the past');
        return;
      }

      await appointmentsAPI.book({
        doctor_id: bookingDoctor.user.id,
        appointment_time: timeObj.toISOString(),
        reason
      });

      toast.success('Appointment requested successfully!');
      setBookingDoctor(null);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    doc.user.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-3 mb-4" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">Find a Specialist</h1>
        <p className="section-subtitle">Book appointments with top medical professionals.</p>
        
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by specialty, condition, or doctor name..." 
            style={{ paddingLeft: '2.8rem', borderRadius: 'var(--radius-lg)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><Loader2 className="spinner" /></div>
      ) : filteredDoctors.length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <h3>No doctors found</h3>
          <p>Try adjusting your search query</p>
        </div>
      ) : (
        <div className="grid-auto">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="card flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-doctor">{doc.specialization}</span>
                  <div className="flex items-center gap-1" style={{ fontSize: '0.85rem', color: 'var(--color-warning)' }}>
                    <Star size={14} fill="currentColor" /> 4.9
                  </div>
                </div>
                
                <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Dr. {doc.user.name}</h3>
                
                <div className="flex flex-col gap-2 mb-4" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  <div className="flex items-center gap-2"><MapPin size={16} /> Online Video Consultation</div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <strong>{doc.experience_years}+ Years</strong> Experience
                  </div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                    <strong>${doc.consultation_fee || '50'}</strong> per session
                  </div>
                </div>

                {doc.bio && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc.bio}
                  </p>
                )}
              </div>

              <button 
                className="btn btn-primary btn-full mt-auto"
                onClick={() => handleBookClick(doc)}
              >
                <CalendarHeart size={18} /> Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal via Portal pattern logic (simplified absolute overlay) */}
      {bookingDoctor && (
        <div className="modal-overlay" onClick={() => setBookingDoctor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book Appointment</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setBookingDoctor(null)}>&times;</button>
            </div>
            
            <form onSubmit={submitBooking} className="flex flex-col gap-3">
              <div style={{ background: 'var(--color-surface-2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Booking with:</div>
                <div style={{ fontWeight: 600 }}>Dr. {bookingDoctor.user.name} ({bookingDoctor.specialization})</div>
                <div style={{ color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.25rem' }}>Fee: ${bookingDoctor.consultation_fee || '50'}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Visit (Symptoms, notes)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Describe what you're feeling..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setBookingDoctor(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={bookingLoading}>
                  {bookingLoading ? 'Requesting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
