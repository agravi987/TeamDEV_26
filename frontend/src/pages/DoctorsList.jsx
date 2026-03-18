import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsAPI, appointmentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Star, CalendarHeart, Loader2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Booking modal state
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
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
    setSelectedSlot('');
    setAvailableSlots([]);
    setReason('');
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    fetchSlots(doc.user.id, dateStr);
  };

  const fetchSlots = async (doctorUserId, date) => {
    try {
      setSlotsLoading(true);
      setSelectedSlot('');
      const res = await doctorsAPI.getAvailableSlots(doctorUserId, date);
      setAvailableSlots(res.data.data || []);
    } catch (err) {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (bookingDoctor) {
      fetchSlots(bookingDoctor.user.id, newDate);
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    try {
      setBookingLoading(true);
      await appointmentsAPI.book({
        doctor_id: bookingDoctor.user.id,
        appointment_time: selectedSlot,
        reason,
      });
      toast.success('Appointment requested! Check your email for confirmation.');
      setBookingDoctor(null);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatSlot = (isoStr) => {
    return new Date(isoStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    });
  };

  // Min date: today
  const minDate = new Date().toISOString().split('T')[0];

  const filteredDoctors = doctors.filter(doc => 
    doc.user.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating) => {
    const r = parseFloat(rating) || 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        {[1,2,3,4,5].map(n => (
          <Star 
            key={n} 
            size={13} 
            fill={n <= Math.round(r) ? '#f59e0b' : 'none'}
            stroke={n <= Math.round(r) ? '#f59e0b' : 'var(--color-text-faint)'}
            strokeWidth={1.5}
          />
        ))}
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '2px' }}>
          {r > 0 ? r.toFixed(1) : 'No ratings'}
        </span>
      </div>
    );
  };

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
                </div>
                
                <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>Dr. {doc.user.name}</h3>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  {renderStars(doc.avg_rating)}
                </div>

                <div className="flex flex-col gap-2 mb-4" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  <div className="flex items-center gap-2"><MapPin size={16} /> Online Video Consultation</div>
                  {doc.experience_years > 0 && (
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      <strong>{doc.experience_years}+ Years</strong> Experience
                    </div>
                  )}
                  {doc.consultation_fee && (
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                      <strong>₹{doc.consultation_fee}</strong> per session
                    </div>
                  )}
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

      {/* ─── Booking Modal ─── */}
      {bookingDoctor && (
        <div className="modal-overlay" onClick={() => setBookingDoctor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-header">
              <h2>Book Appointment</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setBookingDoctor(null)}>&times;</button>
            </div>
            
            <form onSubmit={submitBooking} className="flex flex-col gap-3">
              {/* Doctor info */}
              <div style={{ background: 'var(--color-surface-2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Booking with:</div>
                <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>Dr. {bookingDoctor.user.name}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{bookingDoctor.specialization}</div>
              </div>

              {/* Date picker */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CalendarHeart size={15} /> Select Date
                </label>
                <input 
                  type="date" 
                  className="form-input"
                  value={selectedDate}
                  min={minDate}
                  onChange={handleDateChange}
                  required
                />
              </div>

              {/* Time slot grid */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} /> Available Time Slots
                </label>

                {slotsLoading ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                    <Loader2 size={20} className="spinner" style={{ display: 'inline-block' }} /> Loading slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '1.5rem',
                    background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-muted)', fontSize: '0.9rem'
                  }}>
                    😔 No slots scheduled for this day.<br />
                    <small>The doctor hasn't set working hours for this weekday.</small>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {availableSlots.map(slot => {
                      const isFree = slot.status === 'free';
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!isFree}
                          onClick={() => isFree && setSelectedSlot(slot.time)}
                          title={isFree ? 'Click to select' : 'Already booked'}
                          style={{
                            padding: '0.6rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected
                              ? '2px solid var(--color-accent)'
                              : isFree
                                ? '1px solid var(--color-border)'
                                : '1px solid rgba(239,68,68,0.25)',
                            background: isSelected
                              ? 'rgba(0,212,170,0.15)'
                              : isFree
                                ? 'var(--color-surface-2)'
                                : 'rgba(239,68,68,0.06)',
                            color: isSelected
                              ? 'var(--color-accent)'
                              : isFree
                                ? 'var(--color-text)'
                                : 'var(--color-text-faint)',
                            fontWeight: isSelected ? 700 : 400,
                            cursor: isFree ? 'pointer' : 'not-allowed',
                            fontSize: '0.85rem',
                            textDecoration: isFree ? 'none' : 'line-through',
                            opacity: isFree ? 1 : 0.5,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {formatSlot(slot.time)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="form-group">
                <label className="form-label">Reason for Visit (optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Describe your symptoms or reason for the visit..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setBookingDoctor(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={bookingLoading || !selectedSlot}>
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
