import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const DeleteAccountButton = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone and will erase all your data."
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      await authAPI.deleteAccount();
      toast.success('Account deleted successfully. We are sorry to see you go!');
      logout(); // This will clear context state and token, triggering ProtectedRoute to bounce the user to login
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '3rem', padding: '1.5rem', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
      <h3 style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', marginTop: 0 }}>
        <Trash2 size={20} /> Danger Zone
      </h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Permanently delete your account and remove all associated data. This action is irreversible.
      </p>
      <button 
        onClick={handleDelete} 
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: 'var(--color-danger)', color: '#fff',
          border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600, fontSize: '0.9rem',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        <Trash2 size={16} /> 
        {loading ? 'Deleting...' : 'Delete Account'}
      </button>
    </div>
  );
};

export default DeleteAccountButton;
