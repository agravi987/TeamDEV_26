import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, CheckCircle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';

const VerifyEmail = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    try {
      setLoading(true);
      await authAPI.verifyOtp({ medium: 'email', otp });
      setVerified(true);
      
      // Update stored user state
      const token = localStorage.getItem('clinic_token');
      const updatedUser = { ...user, is_email_verified: true };
      login(token, updatedUser);

      toast.success('Email verified successfully! 🎉');
      setTimeout(() => {
        navigate(user?.role === 'doctor' ? '/doctor-dashboard' : '/dashboard');
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await authAPI.sendVerification({ medium: 'email' });
      toast.success('A new code has been sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleSkip = () => {
    navigate(user?.role === 'doctor' ? '/doctor-dashboard' : '/dashboard');
  };

  if (verified) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ maxWidth: '420px', padding: '3rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-success)', marginBottom: '1.5rem' }}>
            <CheckCircle size={64} strokeWidth={1.5} />
          </div>
          <h2 style={{ color: 'var(--color-text)', marginBottom: '0.75rem' }}>Email Verified!</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,115,230,0.15))',
            padding: '1.25rem',
            borderRadius: '50%',
            marginBottom: '1rem',
          }}>
            <Mail size={36} style={{ color: 'var(--color-accent)' }} />
          </div>
          <h1 className="section-title" style={{ fontSize: '1.75rem' }}>Check Your Inbox</h1>
          <p className="section-subtitle">
            We sent a 6-digit verification code to<br />
            <strong style={{ color: 'var(--color-text)' }}>{user?.email || 'your email'}</strong>
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>
              Enter Verification Code
            </label>
            <input
              type="text"
              className="form-input"
              style={{
                textAlign: 'center',
                letterSpacing: '0.6rem',
                fontSize: '1.75rem',
                fontWeight: 700,
                padding: '1rem',
                fontFamily: 'monospace',
              }}
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="──────"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || otp.length !== 6}
            style={{ padding: '0.875rem', fontSize: '1rem', gap: '0.5rem' }}
          >
            {loading ? 'Verifying...' : <><ShieldCheck size={18} /> Verify Email</>}
          </button>
        </form>

        {/* Actions */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RefreshCw size={14} />
            {resending ? 'Sending...' : "Didn't receive it? Resend code"}
          </button>

          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            Skip for now <ArrowRight size={14} />
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-faint)', marginTop: '1.5rem' }}>
          The code expires in 10 minutes.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
