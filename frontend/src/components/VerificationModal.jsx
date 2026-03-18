import { useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock } from 'lucide-react';

const VerificationModal = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  const [step, setStep] = useState(1); // 1 = Request, 2 = Verify
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      await authAPI.sendVerification({ medium: 'email' });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    try {
      setLoading(true);
      await authAPI.verifyOtp({ medium: 'email', otp });
      toast.success('Email verified successfully! ✅');
      
      const updatedUser = { ...user, is_email_verified: true };
      const token = localStorage.getItem('clinic_token');
      login(token, updatedUser);

      setStep(1);
      setOtp('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(0,212,170,0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
            <Mail size={28} />
          </div>
          <h2 style={{ margin: 0 }}>Verify Your Email</h2>
        </div>

        {user.is_email_verified ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ color: 'var(--color-success)', marginBottom: '1rem' }}><Lock size={48} /></div>
            <h3>Already Verified</h3>
            <p className="text-muted">Your email has been successfully verified.</p>
          </div>
        ) : (
          <div>
            {step === 1 ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                  We'll send a 6-digit verification code to<br />
                  <strong style={{ color: 'var(--color-text)' }}>{user.email}</strong>
                </p>
                <button className="btn btn-primary btn-full" onClick={handleSendOTP} disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP to Email'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group text-center">
                  <label className="form-label" style={{ textAlign: 'center' }}>Enter Verification Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem' }}
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="──────"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationModal;
