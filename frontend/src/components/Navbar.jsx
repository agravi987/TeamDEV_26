import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="page-wrapper" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text)' }}>
          <div style={{ background: 'var(--color-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
            <Stethoscope size={20} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
            Health<span style={{ color: 'var(--color-primary)' }}>Sync</span>
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {user?.role !== 'doctor' && (
              <Link to="/doctors" className="btn btn-ghost btn-sm">Find Doctors</Link>
            )}
            
            <Link 
              to={user?.role === 'doctor' ? '/doctor-dashboard' : '/dashboard'} 
              className="btn btn-primary btn-sm"
            >
              Dashboard
            </Link>

            <div style={{ height: '30px', width: '1px', background: 'var(--color-border)', margin: '0 0.5rem' }}></div>
            
            <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={16} />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{user?.name}</span>
            </div>

            <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout" style={{ padding: '0.4rem' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
