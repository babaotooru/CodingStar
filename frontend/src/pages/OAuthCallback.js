import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setOAuthUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const degraded = searchParams.get('degraded') === 'true';

    if (token && username) {
      const userData = { token, username, email, role };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setOAuthUser(userData);
      toast[degraded ? 'warning' : 'success'](
        degraded
          ? `Signed in as ${username}, but the backend could not persist the user record.`
          : `Welcome, ${username}!`
      );
      setTimeout(() => navigate('/problems', { replace: true }), 100);
    } else {
      toast.error('OAuth login failed');
      navigate('/login', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-dark-400">Completing sign in...</p>
      </div>
    </div>
  );
}

export default OAuthCallback;
