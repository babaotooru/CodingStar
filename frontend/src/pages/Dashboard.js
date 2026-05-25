import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, problemsAPI, leaderboardAPI } from '../services/api';

function Dashboard() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    setVisible(true);
    
    // Clear profile when user logs out
    if (!user) {
      setProfile(null);
      setRecommended([]);
    }
    
    const fetchData = async () => {
      try {
        const [lbRes, countRes] = await Promise.all([
          leaderboardAPI.get(),
          userAPI.getCount(),
        ]);
        setLeaderboard(lbRes.data.slice(0, 5));
        setTotalUsers(countRes.data.total);
      } catch {}

      if (user) {
        try {
          const profileRes = await userAPI.getProfile();
          setProfile(profileRes.data);

          // Recommend problems based on what they haven't solved — pick from a difficulty they need
          const solvedCount = profileRes.data.totalSolved || 0;
          let recDifficulty = 'EASY';
          if (solvedCount > 50) recDifficulty = 'MEDIUM';
          if (solvedCount > 200) recDifficulty = 'HARD';

          const recRes = await problemsAPI.getByDifficulty(recDifficulty, Math.floor(Math.random() * 10), 6);
          setRecommended(recRes.data.content || []);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          setProfile(null);
        }
      }
    };
    fetchData();
  }, [user, user?.username]); // Re-fetch when user or username changes

  const features = [
    { title: 'Multiple Languages', desc: 'Java, Python, C++, C, and JavaScript', icon: '🌐', gradient: 'from-blue-500/10 to-cyan-500/10' },
    { title: 'Instant Feedback', desc: 'Real-time results with runtime & memory stats', icon: '⚡', gradient: 'from-yellow-500/10 to-orange-500/10' },
    { title: 'Global Leaderboard', desc: 'Compete and climb the rankings', icon: '🏆', gradient: 'from-purple-500/10 to-pink-500/10' },
    { title: 'Daily Contests', desc: 'Timed contests every day, 4x on Sundays', icon: '🎯', gradient: 'from-red-500/10 to-rose-500/10' },
    { title: 'Monaco Editor', desc: 'VS Code-powered editor with IntelliSense', icon: '✏️', gradient: 'from-green-500/10 to-emerald-500/10' },
    { title: 'Stars & Scores', desc: 'Earn stars and track your progress', icon: '⭐', gradient: 'from-amber-500/10 to-yellow-500/10' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Personalized Hero for logged-in users */}
      {user && profile ? (
        <section className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gradient-to-br from-dark-800/60 via-dark-800/40 to-primary-900/10 rounded-2xl border border-dark-700/50 p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl shadow-primary-500/20">
                {(profile && profile.username ? profile.username.charAt(0).toUpperCase() : '?')}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Welcome back, <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">{profile.username}</span>!
                </h1>
                <p className="text-dark-400 mt-1">
                  {profile.totalSolved === 0 ? 'Start solving problems to build your profile!' :
                   profile.totalSolved < 10 ? 'Great start! Keep solving to climb the ranks.' :
                   profile.totalSolved < 50 ? 'Nice progress! You\'re building strong skills.' :
                   profile.totalSolved < 200 ? 'Impressive! You\'re becoming a coding star.' :
                   'You\'re a coding machine! Keep pushing your limits.'}
                </p>
              </div>
              <Link to="/profile" className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg text-sm transition-colors">
                View Profile
              </Link>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-dark-800/60 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{profile.totalSolved}</div>
                <div className="text-dark-500 text-xs mt-1">Solved</div>
              </div>
              <div className="bg-dark-800/60 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{profile.stars} ⭐</div>
                <div className="text-dark-500 text-xs mt-1">Stars</div>
              </div>
              <div className="bg-dark-800/60 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary-400">{profile.score}</div>
                <div className="text-dark-500 text-xs mt-1">Score</div>
              </div>
              <div className="bg-dark-800/60 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">#{profile.rank}</div>
                <div className="text-dark-500 text-xs mt-1">Rank</div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Generic Hero for visitors */
        <section className={`text-center pt-16 pb-8 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative">
            <div className="absolute inset-0 -top-20 bg-gradient-to-b from-primary-600/5 via-transparent to-transparent blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 rounded-full text-primary-400 text-sm font-medium mb-6 border border-primary-500/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                5,000+ problems available
              </div>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-5 leading-tight">
                Level Up Your{' '}
                <span className="bg-gradient-to-r from-primary-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Coding Skills
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Solve challenges, compete in daily contests, and join a community of developers pushing their limits.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  to="/problems"
                  className="group px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-500 hover:to-primary-400 transition-all text-lg shadow-xl shadow-primary-600/20 hover:shadow-primary-500/30 hover:-translate-y-0.5"
                >
                  Start Solving
                  <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-3.5 bg-dark-800/80 text-white rounded-xl font-semibold hover:bg-dark-700 transition-all text-lg border border-dark-600 hover:border-dark-500 hover:-translate-y-0.5"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommended Problems (logged-in users) */}
      {user && recommended.length > 0 && (
        <section className={`transition-all duration-1000 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Recommended for You</h2>
              <p className="text-dark-500 text-sm mt-0.5">
                {profile?.totalSolved > 200 ? 'Challenge yourself with hard problems' :
                 profile?.totalSolved > 50 ? 'Level up with medium problems' :
                 'Build your foundation with these problems'}
              </p>
            </div>
            <Link to="/problems" className="text-primary-400 hover:text-primary-300 text-sm font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommended.map((p) => (
              <Link
                key={p.id}
                to={`/solve/${p.id}`}
                className="group bg-dark-800/40 rounded-xl border border-dark-700/50 p-4 hover:bg-dark-800/70 hover:border-dark-600 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    p.difficulty === 'EASY' ? 'bg-green-500/10 text-green-400' :
                    p.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>{p.difficulty}</span>
                  {p.category && <span className="text-dark-600 text-xs">{p.category}</span>}
                </div>
                <h3 className="text-white font-medium text-sm group-hover:text-primary-400 transition-colors truncate">{p.title}</h3>
                {p.acceptanceRate > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500/50 rounded-full" style={{ width: `${Math.min(p.acceptanceRate, 100)}%` }} />
                    </div>
                    <span className="text-dark-500 text-xs">{p.acceptanceRate}%</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Community Stats + Top Users */}
      <section className={`transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Stats */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Platform Stats</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '5000+', label: 'Problems', icon: '📝', color: 'from-green-500 to-emerald-600' },
                { value: totalUsers.toLocaleString(), label: 'Users', icon: '👥', color: 'from-primary-500 to-blue-600' },
                { value: 'Daily', label: 'Contests', icon: '🏆', color: 'from-yellow-500 to-orange-600' },
              ].map((stat, i) => (
                <div key={i} className="group relative bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 text-center hover:border-dark-600 transition-all hover:-translate-y-1">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className={`text-2xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</div>
                  <div className="text-dark-500 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Top Coders</h2>
              <Link to="/leaderboard" className="text-primary-400 hover:text-primary-300 text-sm font-medium">View all →</Link>
            </div>
            <div className="bg-dark-800/40 rounded-2xl border border-dark-700/50 overflow-hidden">
              {leaderboard.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between px-4 py-3 hover:bg-dark-800/40 transition-colors border-b border-dark-800/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center">
                      {entry.rank <= 3 ? (
                        <span className="text-sm">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                      ) : (
                        <span className="text-dark-500 text-xs font-mono">{entry.rank}</span>
                      )}
                    </span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                      entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                      'bg-dark-700'
                    }`}>{(entry && entry.username) ? entry.username.charAt(0).toUpperCase() : '?'}</div>
                    <span className="text-white text-sm font-medium">{entry && entry.username ? entry.username : 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 text-sm font-bold">{entry.stars} ⭐</span>
                    <span className="text-dark-500 text-xs">{entry.totalSolved} solved</span>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-dark-500 text-sm text-center py-6">No users yet</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Everything You Need</h2>
          <p className="text-dark-400 max-w-lg mx-auto">A complete platform for practicing, competing, and growing as a developer.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group bg-gradient-to-br ${feature.gradient} bg-dark-800/20 rounded-2xl border border-dark-700/40 p-6 hover:border-dark-600 transition-all hover:-translate-y-1`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-dark-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA for visitors */}
      {!user && (
        <section className={`text-center transition-all duration-1000 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gradient-to-r from-primary-600/10 via-purple-600/10 to-primary-600/10 rounded-2xl border border-primary-500/20 p-10">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to begin?</h2>
            <p className="text-dark-400 mb-6">Join {totalUsers > 0 ? totalUsers.toLocaleString() : 'thousands of'} developers improving their skills every day.</p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/20 hover:-translate-y-0.5"
            >
              Get Started — It's Free
            </Link>
          </div>
        </section>
      )}

      {/* Quick Actions for logged-in users */}
      {user && (
        <section className={`transition-all duration-1000 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/contests" className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all group text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="text-white font-semibold group-hover:text-yellow-400 transition-colors">Join Contest</h3>
              <p className="text-dark-500 text-xs mt-1">Compete in daily contests</p>
            </Link>
            <Link to="/submissions" className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all group text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-white font-semibold group-hover:text-primary-400 transition-colors">My Submissions</h3>
              <p className="text-dark-500 text-xs mt-1">Review your past work</p>
            </Link>
            <Link to="/leaderboard" className="bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group text-center">
              <div className="text-3xl mb-2">🏅</div>
              <h3 className="text-white font-semibold group-hover:text-purple-400 transition-colors">Leaderboard</h3>
              <p className="text-dark-500 text-xs mt-1">See where you stand</p>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
