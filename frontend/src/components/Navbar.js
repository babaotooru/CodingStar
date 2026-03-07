import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-500">&lt;/&gt;</span>
            <span className="text-xl font-bold text-white">CodeJudge</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/problems" className="text-dark-300 hover:text-white transition-colors">
              Problems
            </Link>
            <Link to="/leaderboard" className="text-dark-300 hover:text-white transition-colors">
              Leaderboard
            </Link>
            {user && (
              <Link to="/submissions" className="text-dark-300 hover:text-white transition-colors">
                My Submissions
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-dark-300">
                  Hello, <span className="text-primary-400 font-semibold">{user.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-dark-300 hover:text-white"
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
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/problems" className="block px-4 py-2 text-dark-300 hover:text-white" onClick={() => setMenuOpen(false)}>
              Problems
            </Link>
            <Link to="/leaderboard" className="block px-4 py-2 text-dark-300 hover:text-white" onClick={() => setMenuOpen(false)}>
              Leaderboard
            </Link>
            {user ? (
              <>
                <Link to="/submissions" className="block px-4 py-2 text-dark-300 hover:text-white" onClick={() => setMenuOpen(false)}>
                  My Submissions
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-dark-300 hover:text-white">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 text-dark-300 hover:text-white" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="block px-4 py-2 text-primary-400 hover:text-primary-300" onClick={() => setMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
