import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/login');
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { path: '/problems', label: 'Problems', icon: '📋' },
    { path: '/topics', label: 'Topics', icon: '📚' },
    { path: '/sql-practice', label: 'SQL', icon: '🗄️' },
    { path: '/contests', label: 'Contests', icon: '🏆' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏅' },
    { path: '/users', label: 'Users', icon: '👥' },
  ];

  return (
    <nav className="bg-dark-900/95 backdrop-blur-md border-b border-dark-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-400/50 transition-all group-hover:scale-105">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M12 2l2.09 6.26L20.18 9l-4.64 3.89 1.34 6.5L12 16.1l-5.88 3.29 1.34-6.5L2.82 9l6.09-.74z" />
                <path d="M12 6l1 3h3.1l-2.5 1.9.7 3.1L12 12.5l-2.3 1.5.7-3.1L7.9 9H11z" fill="rgba(0,0,0,0.15)" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">Coding</span>
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Star</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-white bg-dark-700/70'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/submissions"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/submissions')
                    ? 'text-white bg-dark-700/70'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                📊 Submissions
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-all group relative"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-dark-800 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-dark-300 text-sm font-medium max-w-[120px] truncate">{user.username}</span>
                  <svg className={`w-4 h-4 text-dark-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-dark-800 rounded-xl border border-dark-600 shadow-2xl py-2 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-dark-700">
                      <p className="text-white font-medium text-sm">{user.username}</p>
                      <p className="text-dark-400 text-xs mt-0.5">{user.email || 'No email'}</p>
                    </div>
                    <Link to="/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors text-sm">
                      <span>👤</span> My Profile
                    </Link>
                    <Link to="/submissions" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors text-sm">
                      <span>📊</span> My Submissions
                    </Link>
                    <div className="border-t border-dark-700 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-dark-700/50 transition-colors text-sm w-full">
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-dark-300 hover:text-white transition-colors text-sm font-medium rounded-lg hover:bg-dark-800">
                  Sign in
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-all text-sm font-medium shadow-lg shadow-primary-600/20">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-dark-300 hover:text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-fadeIn">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path}
                className={`block px-4 py-3 rounded-lg text-sm ${isActive(link.path) ? 'text-white bg-dark-800' : 'text-dark-300 hover:text-white hover:bg-dark-800/50'}`}
                onClick={() => setMenuOpen(false)}>
                <span className="mr-2">{link.icon}</span>{link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/submissions" className="block px-4 py-3 text-dark-300 hover:text-white rounded-lg text-sm" onClick={() => setMenuOpen(false)}>
                  📊 Submissions
                </Link>
                <Link to="/profile" className="block px-4 py-3 text-dark-300 hover:text-white rounded-lg text-sm" onClick={() => setMenuOpen(false)}>
                  👤 Profile
                </Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-red-400 hover:text-red-300 rounded-lg text-sm">
                  🚪 Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2 px-4">
                <Link to="/login" className="flex-1 text-center px-4 py-2.5 text-dark-300 hover:text-white border border-dark-600 rounded-lg text-sm" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link to="/register" className="flex-1 text-center px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm" onClick={() => setMenuOpen(false)}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
