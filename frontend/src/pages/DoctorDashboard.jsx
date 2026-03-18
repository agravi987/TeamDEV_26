import { useState, useEffect } from 'react';
import { appointmentsAPI, videoSessionAPI, prescriptionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarCheck, Video, CheckCircle, UploadCloud, Loader2, CalendarX, FileText, Clock } from 'lucide-react';
import VerificationBanner from '../components/VerificationBanner';
import DeleteAccountButton from '../components/DeleteAccountButton';
import ScheduleEditor from '../components/ScheduleEditor';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  
  // Rx Generation State
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [rxNotes, setRxNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentsAPI.getByUserId(user.id);
      setAppointments(res.data.data);
    } catch (err) {
      toast.error('Failed to load clinical schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentsAPI.updateStatus(id, status);
      toast.success(`Appointment marked as ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleArchive = async (id) => {
    try {
      await appointmentsAPI.archive(id);
      toast.success('Appointment hidden from dashboard');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to hide appointment');
    }
  };

  const startVideoSession = async (apptId) => {
    try {
      const res = await videoSessionAPI.create(apptId);
      // Backend automatically marks status as confirmed when session is generated
      toast.success('Session Generated. Joining...');
      fetchAppointments();
      navigate(`/session/${apptId}?link=${encodeURIComponent(res.data.data.meeting_link)}`);
    } catch (err) {
      toast.error('Failed to start session');
    }
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated.length ? updated : [{ name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleGeneratePrescription = async (e) => {
    e.preventDefault();
    
    // Filter out empty medicine entries
    const validMedicines = medicines.filter(m => m.name.trim() !== '');

    if (validMedicines.length === 0 && !rxNotes.trim()) {
      return toast.error('Please add at least one medicine or consultation note');
    }

    try {
      setGenerating(true);
      await prescriptionsAPI.generate({
        appointment_id: selectedAppt.id,
        medicines: validMedicines,
        notes: rxNotes
      });
      
      toast.success('Prescription generated and securely saved');
      
      // Auto-complete the appointment
      await appointmentsAPI.updateStatus(selectedAppt.id, 'completed');
      
      setSelectedAppt(null);
      setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
      setRxNotes('');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const openPrescriptionModal = (appt) => {
    setSelectedAppt(appt);
    setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setRxNotes('');
  };

  return (
    <div className="page-wrapper">
      <VerificationBanner />
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="section-title">Doctor Dashboard</h1>
          <p className="section-subtitle">Manage consultations, patients, and e-prescriptions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setScheduleEditorOpen(true)}>
          <Clock size={18} /> Set Working Hours
        </button>
      </div>

      <div className="grid-3 mb-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.1)', color: 'var(--color-primary)' }}>
            <CalendarCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length}</div>
            <div className="stat-label">Upcoming</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{appointments.filter(a => a.status === 'completed').length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Your Schedule</h2>

      {loading ? (
        <div className="loading-screen"><Loader2 className="spinner" /></div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <CalendarCheck size={48} />
          <h3>Schedule Clear</h3>
          <p>No appointments booked yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Time</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => (
                <tr key={appt.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{appt.patient.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{appt.patient.email}</div>
                  </td>
                  <td>
                    <div>{new Date(appt.appointment_time).toLocaleDateString()}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>{new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td><span className={`badge badge-${appt.status}`}>{appt.status}</span></td>
                  <td style={{ maxWidth: '200px' }}><div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.85rem' }}>{appt.reason || '-'}</div></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {(appt.status === 'pending' || appt.status === 'confirmed') && (
                        <>
                          <button className="btn btn-accent btn-sm" title="Start Session" onClick={() => startVideoSession(appt.id)}>
                            <Video size={16} />
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Generate Rx & Complete" onClick={() => openPrescriptionModal(appt)}>
                            <FileText size={16} />
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Cancel" style={{ color: 'var(--color-danger)' }} onClick={() => handleUpdateStatus(appt.id, 'cancelled')}>
                            <CalendarX size={16} />
                          </button>
                        </>
                      )}
                      {appt.status === 'completed' && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Finalized
                        </span>
                      )}
                      {(appt.status === 'completed' || appt.status === 'cancelled') && (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title="Hide from Dashboard" 
                          style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem', padding: '0.2rem' }} 
                          onClick={() => handleArchive(appt.id)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteAccountButton />

      {/* Generate Prescription Modal */}
      {selectedAppt && (
        <div className="modal-overlay" onClick={() => setSelectedAppt(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Generate e-Prescription</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAppt(null)}>&times;</button>
            </div>
            
            <form onSubmit={handleGeneratePrescription} className="flex flex-col gap-3">
              <div style={{ background: 'var(--color-surface-2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Patient:</div>
                <div style={{ fontWeight: 600 }}>{selectedAppt.patient.name}</div>
              </div>

              <div className="form-group mb-0">
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label mb-0">Medicines</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddMedicine}>
                    + Add Medicine
                  </button>
                </div>
                
                <div className="flex flex-col gap-2" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {medicines.map((med, index) => (
                    <div key={index} style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Medicine #{index + 1}</span>
                        <button type="button" onClick={() => handleRemoveMedicine(index)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>&times;</button>
                      </div>
                      <div className="grid-2 gap-2 mb-2">
                        <input 
                          type="text" className="form-input form-sm" placeholder="Medicine Name" 
                          value={med.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)} required={index === 0 && !rxNotes}
                        />
                        <input 
                          type="text" className="form-input form-sm" placeholder="Dosage (e.g., 500mg)" 
                          value={med.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        />
                      </div>
                      <div className="grid-2 gap-2">
                        <input 
                          type="text" className="form-input form-sm" placeholder="Frequency (e.g., 1-0-1)" 
                          value={med.frequency} onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        />
                        <input 
                          type="text" className="form-input form-sm" placeholder="Duration (e.g., 5 days)" 
                          value={med.duration} onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group mt-2">
                <label className="form-label">Consultation Notes & Instructions</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="General advice, next visit date, or specific instructions..."
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedAppt(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={generating}>
                  {generating ? 'Generating PDF...' : <><FileText size={18} /> Generate & Send PDF</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Editor Modal */}
      <ScheduleEditor 
        isOpen={scheduleEditorOpen} 
        onClose={() => setScheduleEditorOpen(false)} 
      />
    </div>
  );
};

export default DoctorDashboard;
