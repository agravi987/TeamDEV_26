import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import VerificationModal from './VerificationModal';
import { useAuth } from '../context/AuthContext';

const VerificationBanner = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;
  if (user.is_email_verified) return null;

  return (
    <>
      <div style={{
        backgroundColor: 'rgba(255, 170, 0, 0.1)',
        border: '1px solid rgba(255, 170, 0, 0.3)',
        color: '#d97706',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>
            <strong>Action Required:</strong> Please verify your email address to secure your account.
          </span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          Verify Now
        </button>
      </div>

      <VerificationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default VerificationBanner;
