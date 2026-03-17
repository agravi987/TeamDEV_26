import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    role: 'patient',
    specialization: '' // Used only if role === doctor
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authAPI.register(formData);
      login(res.data.data.token, res.data.data.user);
      
      toast.success('Registration successful!');
      if (res.data.data.user.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        // Validation errors from express-validator
        err.response.data.errors.forEach(error => {
          toast.error(`${error.field}: ${error.message}`);
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(0, 212, 170, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', color: 'var(--color-accent)' }}>
            <UserPlus size={32} />
          </div>
          <h1 className="section-title">Create Account</h1>
          <p className="section-subtitle">Join HealthSync today</p>
        </div>

        <div className="tabs mb-4" style={{ width: '100%' }}>
          <button 
            type="button" 
            className={`tab ${formData.role === 'patient' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'patient' })}
          >
            I'm a Patient
          </button>
          <button 
            type="button" 
            className={`tab ${formData.role === 'doctor' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'doctor' })}
          >
            I'm a Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required minLength={8} />
          </div>

          {formData.role === 'doctor' && (
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input type="text" name="specialization" className="form-input" placeholder="e.g. Cardiologist, Dermatologist" value={formData.specialization} onChange={handleChange} required />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
