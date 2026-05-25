import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import DifficultyBadge from '../components/DifficultyBadge';
import { toast } from 'react-toastify';

function ContestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [activeTab, setActiveTab] = useState('problems');
  const [timeLeft, setTimeLeft] = useState('');

  const asArray = (value) => (Array.isArray(value) ? value : []);

  const fetchContest = useCallback(async () => {
    try {
      const [contestRes, rankRes] = await Promise.all([
        contestAPI.getById(id),
        contestAPI.getRankings(id),
      ]);
      setContest(contestRes.data);
      setRankings(asArray(rankRes.data));

      if (user) {
        try {
          const regRes = await contestAPI.isRegistered(id);
          setRegistered(regRes.data.registered);
        } catch { /* not logged in */ }
      }
    } catch (err) {
      console.error('Failed to fetch contest:', err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { fetchContest(); }, [fetchContest]);

  // Countdown timer
  useEffect(() => {
    if (!contest) return;
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(contest.endTime);
      const start = new Date(contest.startTime);

      if (contest.status === 'ACTIVE') {
        const diff = end - now;
        if (diff <= 0) { setTimeLeft('Ended'); return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else if (contest.status === 'UPCOMING') {
        const diff = start - now;
        if (diff <= 0) { setTimeLeft('Starting...'); return; }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        setTimeLeft('Ended');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  const handleRegister = async () => {
    if (!user) { toast.info('Please login to register'); return; }
    try {
      await contestAPI.register(id);
      setRegistered(true);
      toast.success('Registered for contest!');
      fetchContest();
    } catch (err) {
      toast.error('Failed to register');
    }
  };

  if (loading) return <LoadingSpinner text="Loading contest..." />;
  if (!contest) return <div className="text-center text-dark-400 py-12">Contest not found</div>;

  const isActive = contest.status === 'ACTIVE';
  const isUpcoming = contest.status === 'UPCOMING';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Contest Header */}
      <div className={`rounded-2xl border p-6 sm:p-8 mb-8 ${
        isActive ? 'bg-gradient-to-r from-green-900/20 to-dark-900 border-green-500/30' :
        isUpcoming ? 'bg-gradient-to-r from-blue-900/20 to-dark-900 border-blue-500/30' :
        'bg-dark-900 border-dark-700'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${
                isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                isUpcoming ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                'bg-dark-700 text-dark-400 border-dark-600'
              }`}>
                {isActive && '🔴 '}{contest.status}
              </span>
              <span className="text-dark-500">{contest.durationMinutes} min</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{contest.title}</h1>
            <p className="text-dark-400">{contest.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-dark-400">
              <span>📝 {contest.problemCount} problems</span>
              <span>👥 {contest.participantCount} participants</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3">
            {/* Timer */}
            <div className={`text-center px-6 py-4 rounded-xl border ${
              isActive ? 'bg-green-900/30 border-green-500/30' :
              isUpcoming ? 'bg-blue-900/30 border-blue-500/30' :
              'bg-dark-800 border-dark-600'
            }`}>
              <div className="text-xs text-dark-400 mb-1">
                {isActive ? 'Time Remaining' : isUpcoming ? 'Starts In' : 'Contest Ended'}
              </div>
              <div className={`text-2xl font-mono font-bold ${
                isActive ? 'text-green-400' : isUpcoming ? 'text-blue-400' : 'text-dark-400'
              }`}>
                {timeLeft || '--:--:--'}
              </div>
            </div>
            {(isActive || isUpcoming) && !registered && (
              <button
                onClick={handleRegister}
                className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                  isActive ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isActive ? 'Join Now' : 'Register'}
              </button>
            )}
            {registered && (
              <span className="text-green-400 text-sm font-medium">✓ Registered</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-900 rounded-xl p-1.5 border border-dark-700 mb-6 w-fit">
        {['problems', 'rankings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-dark-700 text-white shadow-lg'
                : 'text-dark-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            {tab === 'problems' ? `📝 Problems (${contest.problemCount})` : `🏆 Rankings (${rankings.length})`}
          </button>
        ))}
      </div>

      {/* Problems Tab */}
      {activeTab === 'problems' && (
        <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
          {asArray(contest.problems).length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Problem</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Difficulty</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {asArray(contest.problems).map((problem, idx) => (
                  <tr key={problem.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4 text-dark-400 font-medium">{String.fromCharCode(65 + idx)}</td>
                    <td className="px-6 py-4 text-white font-medium">{problem.title}</td>
                    <td className="px-6 py-4"><DifficultyBadge difficulty={problem.difficulty} /></td>
                    <td className="px-6 py-4">
                      {(isActive || contest.status === 'ENDED') ? (
                        <Link to={`/solve/${problem.id}`}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500 transition-colors">
                          Solve →
                        </Link>
                      ) : (
                        <span className="text-dark-500 text-sm">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-dark-400">
              {isUpcoming ? 'Problems will be revealed when the contest starts' : 'No problems found'}
            </div>
          )}
        </div>
      )}

      {/* Rankings Tab */}
      {activeTab === 'rankings' && (
        <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
          {rankings.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Solved</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((entry, idx) => (
                  <tr key={entry.userId} className={`border-b border-dark-800 hover:bg-dark-800/50 transition-colors ${
                    idx < 3 ? 'bg-dark-800/30' : ''
                  }`}>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-300' :
                        entry.rank === 3 ? 'text-orange-400' : 'text-dark-400'
                      }`}>
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{entry.username}</td>
                    <td className="px-6 py-4 text-primary-400 font-bold">{entry.totalScore}</td>
                    <td className="px-6 py-4 text-green-400">{entry.problemsSolved}/{contest.problemCount}</td>
                    <td className="px-6 py-4 text-dark-400">{entry.totalTimePenalty} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-dark-400">
              No participants yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContestDetail;
