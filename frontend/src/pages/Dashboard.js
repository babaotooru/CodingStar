import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-white mb-4">
          Master Your <span className="text-primary-500">Coding Skills</span>
        </h1>
        <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-8">
          Solve challenging problems, compete with developers worldwide, and level up your programming expertise.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/problems"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-lg"
          >
            Start Solving
          </Link>
          {!user && (
            <Link
              to="/register"
              className="px-8 py-3 bg-dark-800 text-white rounded-lg font-semibold hover:bg-dark-700 transition-colors text-lg border border-dark-600"
            >
              Create Account
            </Link>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 text-center">
          <div className="text-4xl font-bold text-green-400 mb-2">500+</div>
          <div className="text-dark-400">Coding Problems</div>
        </div>
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 text-center">
          <div className="text-4xl font-bold text-primary-400 mb-2">5</div>
          <div className="text-dark-400">Languages Supported</div>
        </div>
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-2">Real-time</div>
          <div className="text-dark-400">Code Execution</div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-8">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Multiple Languages', desc: 'Write code in Java, Python, C++, C, and JavaScript', icon: '🌐' },
            { title: 'Instant Feedback', desc: 'Get real-time results for your code submissions', icon: '⚡' },
            { title: 'Leaderboard', desc: 'Compete with others and climb the rankings', icon: '🏆' },
            { title: 'Difficulty Levels', desc: 'Problems categorized by Easy, Medium, and Hard', icon: '📊' },
            { title: 'Contest Mode', desc: 'Participate in timed coding contests', icon: '🎯' },
            { title: 'Code Editor', desc: 'Feature-rich Monaco editor with syntax highlighting', icon: '✏️' },
          ].map((feature, i) => (
            <div key={i} className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-dark-500 transition-colors">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-dark-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
