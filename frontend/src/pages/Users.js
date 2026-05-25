import React, { useState, useEffect } from 'react';
import { leaderboardAPI, userAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Users() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const formatCount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toLocaleString() : '0';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaderboardRes, countRes] = await Promise.all([
          leaderboardAPI.get(),
          userAPI.getCount(),
        ]);
        setUsers(leaderboardRes.data || []);
        setTotalUsers(countRes.data?.total ?? countRes.data?.totalUsers ?? countRes.data?.count ?? 0);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = searchQuery
    ? users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : users;

  if (loading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Community</h1>
          <p className="text-dark-400 text-sm mt-1">Explore the CodingStar community</p>
        </div>
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800/80 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 placeholder-dark-500 transition-all"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 text-center">
          <div className="text-3xl font-bold text-white">{formatCount(totalUsers)}</div>
          <div className="text-dark-400 text-sm mt-1">Total Users</div>
        </div>
        <div className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 text-center">
          <div className="text-3xl font-bold text-green-400">
            {users.filter(u => u.totalSolved > 0).length}
          </div>
          <div className="text-dark-400 text-sm mt-1">Active Solvers</div>
        </div>
        <div className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 text-center">
          <div className="text-3xl font-bold text-yellow-400">
            {formatCount(users.reduce((sum, u) => sum + (u.stars || 0), 0))}
          </div>
          <div className="text-dark-400 text-sm mt-1">Total Stars</div>
        </div>
        <div className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 text-center">
          <div className="text-3xl font-bold text-primary-400">
            {formatCount(users.reduce((sum, u) => sum + (u.totalSolved || 0), 0))}
          </div>
          <div className="text-dark-400 text-sm mt-1">Problems Solved</div>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block rounded-2xl overflow-hidden border border-dark-700/50">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-800/50">
              <th className="px-5 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-16">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider w-28">Problems Solved</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider w-24">Stars</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider w-24">Score</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider w-28">Submissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800/50">
            {filtered.map((user, i) => (
              <tr key={user.userId} className={`hover:bg-dark-800/40 transition-colors ${i % 2 === 0 ? 'bg-dark-900/30' : ''}`}>
                <td className="px-5 py-3.5">
                  {user.rank <= 3 ? (
                    <span className="text-lg">{user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}</span>
                  ) : (
                    <span className="text-dark-500 text-sm font-mono">{user.rank}</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                      user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                      user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      user.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                      'bg-dark-700'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium text-sm">{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-green-400 font-semibold text-sm">{user.totalSolved}</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-yellow-400 font-bold text-sm">{user.stars} ⭐</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-primary-400 font-semibold text-sm">{user.score}</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-dark-400 text-sm">{user.totalSubmissions}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="text-dark-500 text-lg mb-2">No users found</div>
                  <p className="text-dark-600 text-sm">Try a different search</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-2">
        {filtered.map((user) => (
          <div key={user.userId} className="bg-dark-800/40 rounded-xl border border-dark-700/50 p-4 hover:bg-dark-800/70 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 text-center">
                  {user.rank <= 3 ? (
                    <span className="text-lg">{user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}</span>
                  ) : (
                    <span className="text-dark-500 text-sm font-mono">{user.rank}</span>
                  )}
                </span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  user.rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-dark-700'
                }`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{user.username}</div>
                  <div className="text-dark-500 text-xs">{user.totalSolved} solved · {user.totalSubmissions} submissions</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-bold text-sm">{user.stars} ⭐</div>
                <div className="text-primary-400 text-xs">{user.score} pts</div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-dark-500 py-16">No users found</div>
        )}
      </div>
    </div>
  );
}

export default Users;
