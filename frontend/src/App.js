import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import ProblemDetails from './pages/ProblemDetails';
import CodeEditor from './pages/CodeEditor';
import Submissions from './pages/Submissions';
import Leaderboard from './pages/Leaderboard';
import SQLPractice from './pages/SQLPractice';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Contests from './pages/Contests';
import Topics from './pages/Topics';
import ContestDetail from './pages/ContestDetail';
import OAuthCallback from './pages/OAuthCallback';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/sql-practice" element={<SQLPractice />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/problems/:id" element={<ProblemDetails />} />
          <Route path="/solve/:id" element={<PrivateRoute><CodeEditor /></PrivateRoute>} />
          <Route path="/submissions" element={<PrivateRoute><Submissions /></PrivateRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/contests/:id" element={<ContestDetail />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer className="border-t border-dark-700 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-dark-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Online Coding Judge System. All rights reserved.</p>
          <p className="mt-1">Design by Baba Otooru</p>
        </div>
      </footer>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
