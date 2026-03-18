import { useState, useEffect } from 'react';
import { X, Clock, Plus, Trash2 } from 'lucide-react';
import { doctorsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ScheduleEditor = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await doctorsAPI.getById(user.id);
      const doctor = res.data.data;
      setSchedule(doctor?.availability || {});
    } catch (err) {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDay = (day) => {
    setSchedule(prev => ({ ...prev, [day]: ['09:00', '17:00'] }));
  };

  const handleRemoveDay = (day) => {
    const updated = { ...schedule };
    delete updated[day];
    setSchedule(updated);
  };

  const handleTimeChange = (day, index, value) => {
    const updated = { ...schedule };
    updated[day][index] = value;
    setSchedule(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await doctorsAPI.updateProfile({ availability: schedule });
      toast.success('Working hours updated successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Clock size={24} style={{ color: 'var(--color-accent)' }} /> 
            Set Working Hours
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Configure your weekly availability. Patients can book 30-minute slots within these hours.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {DAYS_OF_WEEK.map(day => {
                const isWorking = schedule.hasOwnProperty(day);
                
                return (
                  <div key={day} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem', 
                    background: isWorking ? 'rgba(0, 212, 170, 0.05)' : 'var(--color-surface-2)',
                    border: `1px solid ${isWorking ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{ textTransform: 'capitalize', fontWeight: 600, width: '100px', color: isWorking ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {day}
                    </div>
                    
                    {isWorking ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'flex-end' }}>
                        <input 
                          type="time" 
                          className="form-input form-sm" 
                          style={{ width: 'auto' }}
                          value={schedule[day][0]}
                          onChange={(e) => handleTimeChange(day, 0, e.target.value)}
                          required
                        />
                        <span style={{ color: 'var(--color-text-muted)' }}>to</span>
                        <input 
                          type="time" 
                          className="form-input form-sm" 
                          style={{ width: 'auto' }}
                          value={schedule[day][1]}
                          onChange={(e) => handleTimeChange(day, 1, e.target.value)}
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveDay(day)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0.25rem', marginLeft: '0.5rem' }}
                          title={`Mark ${day} as off`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => handleAddDay(day)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', color: 'var(--color-text-muted)' }}
                      >
                        <Plus size={14} /> Add Hours
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScheduleEditor;
