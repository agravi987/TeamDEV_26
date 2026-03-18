import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { ratingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const RatingModal = ({ isOpen, onClose, appointment, onRated }) => {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stars === 0) {
      toast.error('Please select a star rating');
      return;
    }
    try {
      setLoading(true);
      await ratingsAPI.submit({
        appointment_id: appointment.id,
        stars,
        comment: comment.trim() || undefined,
      });
      toast.success('Thank you for your feedback! ⭐');
      onRated(appointment.id, stars);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⭐</div>
          <h2 style={{ margin: '0 0 0.5rem' }}>Rate Your Experience</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            How was your consultation with <strong style={{ color: 'var(--color-text)' }}>Dr. {appointment.doctor?.name}</strong>?
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Star Selector */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    transition: 'transform 0.15s ease',
                    transform: (hovered || stars) >= n ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <Star
                    size={36}
                    fill={(hovered || stars) >= n ? '#f59e0b' : 'none'}
                    stroke={(hovered || stars) >= n ? '#f59e0b' : 'var(--color-text-faint)'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {(hovered || stars) > 0 && (
              <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                {starLabels[hovered || stars]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="form-group">
            <label className="form-label">Comment (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Share your experience to help other patients..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || stars === 0}>
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
