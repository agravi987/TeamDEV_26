import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Video, ShieldAlert, LogOut } from 'lucide-react';

const VideoSession = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    // If we only have the appointment ID, we technically need the Jitsi meeting link.
    // Assuming the user navigated here from their dashboard with the link available, 
    // or we can generate/fetch the room name. We should probably fetch the link from backend.

    // Using the Jitsi Iframe API.
    const loadJitsiScript = () => {
      if (!window.JitsiMeetExternalAPI) {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = initJitsi;
        document.body.appendChild(script);
      } else {
        initJitsi();
      }
    };

    const initJitsi = () => {
      // Create a predictable room name for this appointment 
      // Extract first 8 chars of appointment ID to keep it somewhat secure but consistent
      const roomName = `HealthSync-Consult-${appointmentId.split('-')[0]}`;
      
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        height: '100%',
        width: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user?.name,
          email: user?.email,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: true,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
          ],
        },
      };

      setLoading(false);
      try {
        const api = new window.JitsiMeetExternalAPI(domain, options);
        // Event listeners
        api.addEventListener('videoConferenceLeft', () => {
          toast.success('Call ended');
          if (user?.role === 'doctor') navigate('/doctor-dashboard');
          else navigate('/dashboard');
        });
      } catch (err) {
        console.error('Jitsi err:', err);
        setLoading(false);
        toast.error('Failed to load video session.');
      }
    };

    loadJitsiScript();

    return () => {
      // Clean up jitsi container when leaving page
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = '';
      }
    };
  }, [appointmentId, user, navigate]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', display: 'flex', flexDirection: 'column' }}>
      
      {/* Custom Header over Jitsi */}
      <div style={{ height: '60px', background: '#111', borderBottom: '1px solid #333', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2" style={{ color: '#fff' }}>
          <Video size={20} color="var(--color-primary)" />
          <span style={{ fontWeight: 600 }}>HealthSync Video Consultation</span>
          <span className="badge badge-pending" style={{ marginLeft: '1rem', background: 'rgba(255,255,255,0.1)' }}>
            Encrypted Session
          </span>
        </div>

        <button className="btn btn-danger btn-sm" onClick={() => navigate(user?.role === 'doctor' ? '/doctor-dashboard' : '/dashboard')}>
          <LogOut size={16} /> Leave
        </button>
      </div>

      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          Initializing Encrypted Video Session...
        </div>
      )}

      {/* Jitsi Iframe Container */}
      <div 
        ref={jitsiContainerRef} 
        style={{ flex: 1, width: '100%' }}
      />
    </div>
  );
};

export default VideoSession;
