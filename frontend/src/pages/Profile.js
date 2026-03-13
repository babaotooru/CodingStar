import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        setProfile(response.data);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (!profile) return <div className="text-center text-dark-400 py-12">Profile not found</div>;

  const solvedByDifficulty = profile.solvedProblems ? {
    easy: profile.solvedProblems.filter(p => p.difficulty === 'EASY').length,
    medium: profile.solvedProblems.filter(p => p.difficulty === 'MEDIUM').length,
    hard: profile.solvedProblems.filter(p => p.difficulty === 'HARD').length,
  } : { easy: 0, medium: 0, hard: 0 };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="relative bg-dark-800/40 rounded-2xl border border-dark-700/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-purple-600/5" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-primary-500/20 flex-shrink-0">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              <p className="text-dark-400 text-sm mt-1">{profile.email || 'No email'}</p>
              <p className="text-dark-500 text-xs mt-1">
                Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>
            {profile.rank && (
              <div className="text-center">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">#{profile.rank}</div>
                <div className="text-dark-500 text-xs uppercase tracking-wider mt-1">Global Rank</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: profile.stars, label: 'Stars', icon: '⭐', color: 'text-yellow-400' },
          { value: profile.score, label: 'Score', icon: '🎯', color: 'text-primary-400' },
          { value: profile.totalSolved, label: 'Solved', icon: '✅', color: 'text-green-400' },
          { value: profile.totalSubmissions, label: 'Submissions', icon: '📊', color: 'text-blue-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-dark-800/40 rounded-xl border border-dark-700/50 p-4 text-center hover:bg-dark-800/60 transition-all">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-dark-500 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Difficulty Breakdown */}
      <div className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Solve Distribution</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Easy', count: solvedByDifficulty.easy, color: 'bg-green-500', textColor: 'text-green-400' },
            { label: 'Medium', count: solvedByDifficulty.medium, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
            { label: 'Hard', count: solvedByDifficulty.hard, color: 'bg-red-500', textColor: 'text-red-400' },
          ].map((d, i) => (
            <div key={i} className="text-center">
              <div className={`text-2xl font-bold ${d.textColor}`}>{d.count}</div>
              <div className="text-dark-500 text-xs mb-2">{d.label}</div>
              <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${d.color} rounded-full transition-all duration-500`}
                  style={{ width: `${profile.totalSolved > 0 ? (d.count / profile.totalSolved * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Solved Problems */}
      <div className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Solved Problems</h2>
          <span className="text-dark-500 text-sm">{profile.solvedProblems?.length || 0} problems</span>
        </div>
        {!profile.solvedProblems || profile.solvedProblems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-dark-500 text-lg mb-2">No problems solved yet</p>
            <Link to="/problems" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
              Start solving →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {profile.solvedProblems.map((p) => (
              <Link
                key={p.id}
                to={`/problems/${p.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-700/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-white text-sm truncate group-hover:text-primary-400 transition-colors">{p.title}</span>
                </div>
                <DifficultyBadge difficulty={p.difficulty} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
