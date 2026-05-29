import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { problemsAPI, submissionsAPI, problemNotesAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import SubmissionResultModal from '../components/SubmissionResultModal';
import Editorial from '../components/Editorial';
import NotesEditor from '../components/NotesEditor';
import { toast } from 'react-toastify';
import { resolveSampleFields } from '../utils/sampleFallback';

const languageDefaults = {
  JAVA: {
    label: 'Java',
    monaco: 'java',
    template: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
        sc.close();
    }
}`,
  },
  PYTHON: {
    label: 'Python',
    monaco: 'python',
    template: `# Write your solution here
import sys

def solve():
    # Read input
    line = input()
    # Process and print output
    print(line)

solve()`,
  },
  CPP: {
    label: 'C++',
    monaco: 'cpp',
    template: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`,
  },
  C: {
    label: 'C',
    monaco: 'c',
    template: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your solution here
    
    return 0;
}`,
  },
  JAVASCRIPT: {
    label: 'JavaScript',
    monaco: 'javascript',
    template: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    // Write your solution here
    
});`,
  },
  SQL: {
    label: 'SQL',
    monaco: 'sql',
    template: `-- Write your SQL query here
-- Example: SELECT column1, column2 FROM table_name WHERE condition;

SELECT * FROM employees;`,
  },
};

function CodeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('JAVA');
  const [code, setCode] = useState(languageDefaults.JAVA.template);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProblem, setShowProblem] = useState(true);
  const [adjacentProblems, setAdjacentProblems] = useState({ prev: null, next: null });
  const [activeTab, setActiveTab] = useState('problem');
  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionStats, setSubmissionStats] = useState(null);
  const [starred, setStarred] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarProblems, setSidebarProblems] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [hasNote, setHasNote] = useState(false);

  // Load saved code from localStorage when problem or language changes
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${id}_${language}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(languageDefaults[language].template);
    }
  }, [id, language]);

  // Auto-save code to localStorage when it changes
  useEffect(() => {
    if (code && id) {
      localStorage.setItem(`code_${id}_${language}`, code);
    }
  }, [code, id, language]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await problemsAPI.getById(id);
        setProblem(response.data);
      } catch (err) {
        toast.error('Failed to load problem');
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
    setResult(null);
  }, [id]);

  useEffect(() => {
    const fetchAdjacent = async () => {
      try {
        const prevId = parseInt(id) - 1;
        const nextId = parseInt(id) + 1;
        let prev = null, next = null;
        try { const r = await problemsAPI.getById(prevId); prev = r.data; } catch {}
        try { const r = await problemsAPI.getById(nextId); next = r.data; } catch {}
        setAdjacentProblems({ prev, next });
      } catch {}
    };
    fetchAdjacent();
  }, [id]);

  useEffect(() => {
    const checkNote = async () => {
      try {
        const response = await problemNotesAPI.hasNote(id);
        setHasNote(response.data);
      } catch {
        setHasNote(false);
      }
    };
    checkNote();
  }, [id]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    // Load saved code for this language if exists, otherwise use template
    const savedCode = localStorage.getItem(`code_${id}_${lang}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(languageDefaults[lang].template);
    }
  };

  const handleNextProblem = () => {
    if (!adjacentProblems.next) return;
    
    if (!hasNote) {
      toast.warning('Please document your solution before moving to the next problem!', {
        autoClose: 4000,
      });
      setActiveTab('mynotes'); // Switch to notes tab
      return;
    }
    
    navigate(`/solve/${parseInt(id) + 1}`);
  };

  const handleNoteSaved = async () => {
    // Refresh hasNote status
    try {
      const response = await problemNotesAPI.hasNote(id);
      setHasNote(response.data);
    } catch {
      setHasNote(false);
    }
  };

  const handleRandomProblem = async () => {
    try {
      const response = await problemsAPI.getRandom();
      const randomId = response.data.id;
      if (randomId !== parseInt(id)) {
        navigate(`/solve/${randomId}`);
      } else {
        // If same, try again
        const response2 = await problemsAPI.getRandom();
        navigate(`/solve/${response2.data.id}`);
      }
    } catch {
      toast.error('Failed to load random problem');
    }
  };

  const toggleSidebar = async () => {
    if (!showSidebar && sidebarProblems.length === 0) {
      setSidebarLoading(true);
      try {
        const response = await problemsAPI.getAll(0, 50);
        setSidebarProblems(response.data.content);
      } catch { }
      setSidebarLoading(false);
    }
    setShowSidebar(!showSidebar);
    if (showAI) setShowAI(false);
  };

  const handleAISend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    const newMessages = [...aiMessages, { role: 'user', content: userMsg }];
    setAiMessages(newMessages);
    setAiLoading(true);

    try {
      const systemPrompt = `You are CodingStar AI, a helpful coding assistant. The user is working on a coding problem titled "${problem.title}" (${problem.difficulty} difficulty).
Problem description: ${problem.description?.substring(0, 500)}
${problem.constraints ? `Constraints: ${problem.constraints}` : ''}
They are coding in ${languageDefaults[language].label}.

Rules:
- Give hints, NOT full solutions
- Help them think through the approach
- If they ask for a direct solution, guide them step by step instead
- Be concise and encouraging
- Use code snippets only for small illustrative examples`;

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: apiMessages,
          max_tokens: 512,
          temperature: 0.7,
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMsg = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
        setAiMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
      } else {
        setAiMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI service is currently unavailable. To enable the AI assistant, add your free Groq API key in the configuration. Visit groq.com to get a free key.' }]);
      }
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not connect to AI service. Check your internet connection and try again.' }]);
    }
    setAiLoading(false);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before running');
      return;
    }

    setRunning(true);
    setResult(null);
    try {
      const response = await submissionsAPI.run({
        problemId: parseInt(id),
        code,
        language,
      });
      setResult(response.data);
      if (response.data.status === 'ACCEPTED') {
        toast.success('All test cases passed!');
      } else {
        toast.error(`Verdict: ${response.data.status}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submissionsAPI.submit({
        problemId: parseInt(id),
        code,
        language,
      });
      setResult(response.data);
      
      // Fetch stats for beats comparison
      if (response.data.status === 'ACCEPTED') {
        try {
          const statsResponse = await submissionsAPI.getStats(
            parseInt(id),
            response.data.executionTimeMs,
            response.data.memoryUsedKb
          );
          setSubmissionStats(statsResponse.data);
        } catch {
          setSubmissionStats(null);
        }
      }
      
      // Show animated modal
      setShowResultModal(true);

      if (response.data.status === 'ACCEPTED') {
        const earned = [];
        if (response.data.scoreEarned > 0) earned.push(`+${response.data.scoreEarned} score`);
        if (response.data.starsEarned > 0) earned.push(`+${response.data.starsEarned} ⭐`);
        toast.success(`Solution accepted! ${earned.join(', ')}`);
      } else {
        toast.error(`Verdict: ${response.data.status}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading editor..." />;
  if (!problem) return <div className="text-center text-dark-400 py-12">Problem not found</div>;

  const { sampleInput, sampleOutput, sampleExplanation } = resolveSampleFields(problem);
  const testCasesPassed = Number(result?.testCasesPassed ?? result?.test_cases_passed ?? 0);
  const totalTestCases = Number(result?.totalTestCases ?? result?.total_test_cases ?? 0);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* LeetCode-style Navigation Bar */}
      <div className="bg-dark-900 border border-dark-700 rounded-t-xl px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Problems sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-sm ${
              showSidebar ? 'text-primary-400 bg-primary-500/10' : 'text-dark-300 hover:text-white hover:bg-dark-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="font-medium">Problems</span>
          </button>

          <div className="w-px h-5 bg-dark-700 mx-1" />

          {/* Prev / Next arrows */}
          <button
            onClick={() => adjacentProblems.prev && navigate(`/solve/${parseInt(id) - 1}`)}
            disabled={!adjacentProblems.prev}
            className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            title={adjacentProblems.prev ? `Prev: ${adjacentProblems.prev.title}` : 'No previous problem'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={handleNextProblem}
            disabled={!adjacentProblems.next}
            className={`p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-colors ${!hasNote && adjacentProblems.next ? 'relative' : ''}`}
            title={adjacentProblems.next ? `Next: ${adjacentProblems.next.title}${!hasNote ? ' (Document your solution first)' : ''}` : 'No next problem'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            {!hasNote && adjacentProblems.next && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            )}
          </button>

          {/* Shuffle / Random */}
          <button
            onClick={handleRandomProblem}
            className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            title="Random problem"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>
        </div>

        {/* Center: Problem title */}
        <div className="flex items-center gap-2 max-w-[40%]">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="text-white font-medium text-sm truncate">{problem.title}</span>
        </div>

        {/* Right: AI + Star + Problem ID */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAI(!showAI); if (showSidebar) setShowSidebar(false); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showAI ? 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30' : 'text-dark-400 hover:text-purple-400 hover:bg-dark-800'
            }`}
            title="AI Assistant"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            AI
          </button>
          <button
            onClick={() => setStarred(!starred)}
            className={`p-1.5 rounded-lg transition-all ${starred ? 'text-yellow-400 hover:text-yellow-300' : 'text-dark-500 hover:text-yellow-400'}`}
            title={starred ? 'Remove from favorites' : 'Add to favorites'}
          >
            {starred ? (
              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            )}
          </button>
          <span className="text-dark-500 text-xs font-mono">#{id}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 relative">
        {/* Problems Sidebar */}
        {showSidebar && (
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-dark-700 z-20 flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between p-3 border-b border-dark-700">
              <h3 className="text-white font-semibold text-sm">Problems</h3>
              <button onClick={() => setShowSidebar(false)} className="text-dark-400 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarLoading ? (
                <div className="text-dark-500 text-sm text-center py-8">Loading...</div>
              ) : (
                sidebarProblems.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { navigate(`/solve/${p.id}`); setShowSidebar(false); }}
                    className={`w-full text-left px-3 py-2.5 border-b border-dark-800/50 hover:bg-dark-800/60 transition-colors ${
                      parseInt(id) === p.id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${parseInt(id) === p.id ? 'text-primary-400 font-medium' : 'text-dark-300'}`}>
                        {p.id}. {p.title}
                      </span>
                      <span className={`text-xs flex-shrink-0 ml-2 ${
                        p.difficulty === 'EASY' ? 'text-green-400' : p.difficulty === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{p.difficulty?.charAt(0)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-2 border-t border-dark-700">
              <Link to="/problems" className="block text-center text-xs text-primary-400 hover:text-primary-300 py-1.5">
                View all problems →
              </Link>
            </div>
          </div>
        )}

        {/* AI Chat Panel */}
        {showAI && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-dark-900 border-l border-dark-700 z-20 flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between p-3 border-b border-dark-700">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
                <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded text-[10px] font-medium">Llama</span>
              </div>
              <button onClick={() => setShowAI(false)} className="text-dark-400 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiMessages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3">🤖</div>
                  <p className="text-dark-400 text-sm mb-1">Need a hint?</p>
                  <p className="text-dark-500 text-xs">Ask me about the approach, edge cases, or time complexity.</p>
                  <div className="mt-4 space-y-1.5">
                    {['Give me a hint', 'What data structure should I use?', 'Explain the approach'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setAiInput(q); }}
                        className="block w-full text-left px-3 py-2 bg-dark-800/60 rounded-lg text-dark-300 text-xs hover:bg-dark-800 hover:text-white transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-600/20 text-primary-100 rounded-br-sm'
                      : 'bg-dark-800 text-dark-200 rounded-bl-sm'
                  }`}>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{msg.content}</pre>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-dark-800 rounded-xl px-3 py-2 rounded-bl-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-dark-700">
              <form onSubmit={(e) => { e.preventDefault(); handleAISend(); }} className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask for a hint..."
                  className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/50 placeholder-dark-500"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Left Panel - Problem / Test Cases tabs */}
        <div className={`${showProblem ? 'lg:w-2/5 h-[40vh] lg:h-auto' : 'lg:w-0 h-0'} flex flex-col overflow-hidden transition-all border-x border-dark-700`}>
          {/* Tabs - LeetCode style */}
          <div className="flex bg-dark-900 border-b border-dark-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('problem')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'problem' ? 'text-white border-b-2 border-primary-400' : 'text-dark-400 hover:text-dark-200'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Description
            </button>
            <button
              onClick={() => setActiveTab('editorial')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'editorial' ? 'text-white border-b-2 border-primary-400' : 'text-dark-400 hover:text-dark-200'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Editorial
            </button>
            <button
              onClick={() => setActiveTab('mynotes')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'mynotes' ? 'text-white border-b-2 border-primary-400' : 'text-dark-400 hover:text-dark-200'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              My Notes
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'testcases' ? 'text-white border-b-2 border-primary-400' : 'text-dark-400 hover:text-dark-200'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Submissions
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-dark-900 p-4">
            {activeTab === 'problem' ? (
              <div className="space-y-4 text-sm">
                {/* Problem title + stars row */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">{problem.title}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    {problem.category && (
                      <span className="px-2 py-0.5 bg-dark-800 text-dark-400 rounded text-xs">{problem.category}</span>
                    )}
                    <button
                      onClick={() => setStarred(!starred)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        starred
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-dark-800 text-dark-400 border border-dark-700 hover:text-yellow-400 hover:border-yellow-500/30'
                      }`}
                    >
                      {starred ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      )}
                      {starred ? 'Starred' : 'Star'}
                    </button>
                  </div>
                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-dark-500">
                    {problem.totalSubmissions > 0 && (
                      <span>Submissions: <span className="text-dark-300">{problem.totalSubmissions}</span></span>
                    )}
                    {problem.acceptanceRate > 0 && (
                      <span>Acceptance: <span className="text-dark-300">{problem.acceptanceRate}%</span></span>
                    )}
                    <span>Time Limit: <span className="text-dark-300">{problem.timeLimitMs}ms</span></span>
                    <span>Memory: <span className="text-dark-300">{problem.memoryLimitMb}MB</span></span>
                  </div>
                </div>

                <div className="border-t border-dark-800 pt-3">
                  <div className="text-dark-300 whitespace-pre-wrap">{problem.description}</div>
                </div>

                {problem.inputFormat && (
                  <div>
                    <h3 className="font-semibold text-white mb-1">Input Format</h3>
                    <div className="text-dark-300 whitespace-pre-wrap">{problem.inputFormat}</div>
                  </div>
                )}

                {problem.outputFormat && (
                  <div>
                    <h3 className="font-semibold text-white mb-1">Output Format</h3>
                    <div className="text-dark-300 whitespace-pre-wrap">{problem.outputFormat}</div>
                  </div>
                )}

                {problem.constraints && (
                  <div>
                    <h3 className="font-semibold text-white mb-1">Constraints</h3>
                    <pre className="bg-dark-800 rounded p-3 text-dark-200 font-mono text-xs">{problem.constraints}</pre>
                  </div>
                )}

                {(sampleInput || sampleOutput || sampleExplanation) && (
                  <div>
                    <h3 className="font-semibold text-white mb-2">Sample</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="border border-blue-500/30 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between bg-blue-900/30 px-3 py-2">
                          <h4 className="font-semibold text-blue-300 text-sm flex items-center gap-2">
                            <span>📥</span> Input
                          </h4>
                          <button
                            onClick={() => navigator.clipboard.writeText(sampleInput || '')}
                            className="text-blue-400 hover:text-blue-200 text-xs flex items-center gap-1 transition-colors"
                            title="Copy"
                          >📋 Copy</button>
                        </div>
                        <pre className="bg-dark-800 p-3 text-green-300 font-mono text-sm whitespace-pre-wrap">{sampleInput || '—'}</pre>
                      </div>

                      <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between bg-emerald-900/30 px-3 py-2">
                          <h4 className="font-semibold text-emerald-300 text-sm flex items-center gap-2">
                            <span>📤</span> Output
                          </h4>
                          <button
                            onClick={() => navigator.clipboard.writeText(sampleOutput || '')}
                            className="text-emerald-400 hover:text-emerald-200 text-xs flex items-center gap-1 transition-colors"
                            title="Copy"
                          >📋 Copy</button>
                        </div>
                        <pre className="bg-dark-800 p-3 text-yellow-300 font-mono text-sm whitespace-pre-wrap">{sampleOutput || '—'}</pre>
                      </div>

                      <div className="bg-dark-800/60 border border-dark-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-dark-500 text-xs uppercase tracking-wide">Explanation</div>
                          <button
                            onClick={() => navigator.clipboard.writeText(sampleExplanation || '')}
                            className="text-dark-400 hover:text-dark-200 text-xs flex items-center gap-1 transition-colors"
                            title="Copy"
                          >📋 Copy</button>
                        </div>
                        <div className="text-dark-300 whitespace-pre-wrap text-sm">{sampleExplanation || '—'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'editorial' ? (
              <Editorial problem={problem} />
            ) : activeTab === 'mynotes' ? (
              <NotesEditor problemId={id} onNoteSaved={handleNoteSaved} />
            ) : (
              <div className="space-y-3">
                {result ? (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <StatusBadge status={result.status} />
                      <span className="text-dark-300 text-sm">
                        {testCasesPassed}/{totalTestCases} passed
                      </span>
                    </div>
                    {/* Individual test case results */}
                    {Array.from({ length: totalTestCases }, (_, i) => {
                      const passed = i < testCasesPassed;
                      return (
                        <div key={i} className={`rounded-lg border p-3 ${passed ? 'border-green-700/50 bg-green-900/10' : 'border-red-700/50 bg-red-900/10'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${passed ? 'text-green-400' : 'text-red-400'}`}>
                              {passed ? '✓' : '✗'} Test Case {i + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {result.errorMessage && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-red-400 mb-1">Error</h4>
                        <pre className="bg-dark-800 rounded p-3 text-red-400 font-mono text-xs overflow-x-auto">{result.errorMessage}</pre>
                      </div>
                    )}
                    {result.output && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-dark-300 mb-1">Output</h4>
                        <pre className="bg-dark-800 rounded p-3 text-dark-300 font-mono text-xs overflow-x-auto">{result.output}</pre>
                      </div>
                    )}
                    {/* Stars/Score earned */}
                    {(result.starsEarned > 0 || result.scoreEarned > 0) && (
                      <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.starsEarned > 0 && (
                            <span className="text-yellow-400 font-bold text-lg">+{result.starsEarned} ⭐</span>
                          )}
                          {result.scoreEarned > 0 && (
                            <span className="text-primary-400 font-bold text-lg">+{result.scoreEarned} pts</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-dark-500 text-sm">Run or submit your code to see test case results</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Editor + Results */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="bg-dark-900 border-y border-r border-dark-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProblem(!showProblem)}
                className="text-dark-400 hover:text-white transition-colors"
                title={showProblem ? 'Hide panel' : 'Show panel'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1.5 bg-dark-800 border border-dark-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(languageDefaults).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                disabled={running || submitting}
                className="px-4 py-1.5 bg-dark-600 text-white rounded-lg font-semibold hover:bg-dark-500 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {running ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run
                  </>
                )}
              </button>
              <button
                onClick={handleSubmit}
                disabled={running || submitting}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 border-r border-dark-700 min-h-0">
            <Editor
              height="100%"
              language={languageDefaults[language].monaco}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 16 },
              }}
            />
          </div>

          {/* Bottom Results Panel */}
          <div className="bg-dark-900 border border-dark-700 rounded-b-xl p-3 max-h-[180px] overflow-y-auto">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Result</h3>
            {result ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={result.status} />
                  <span className="text-dark-400 text-sm">
                    {result.testCasesPassed}/{result.totalTestCases} test cases passed
                  </span>
                  {result.executionTimeMs != null && (
                    <span className="text-dark-500 text-sm">{result.executionTimeMs}ms</span>
                  )}
                  {result.starsEarned > 0 && (
                    <span className="text-yellow-400 text-sm font-bold">+{result.starsEarned} ⭐</span>
                  )}
                  {result.scoreEarned > 0 && (
                    <span className="text-primary-400 text-sm font-bold">+{result.scoreEarned} pts</span>
                  )}
                </div>
                {result.errorMessage && (
                  <pre className="bg-dark-800 rounded p-2 text-red-400 font-mono text-xs overflow-x-auto">
                    {result.errorMessage}
                  </pre>
                )}
                {result.output && (
                  <pre className="bg-dark-800 rounded p-2 text-dark-300 font-mono text-xs overflow-x-auto">
                    {result.output}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-dark-500 text-sm">Run or submit your code to see results</p>
            )}
          </div>
        </div>
      </div>

      {/* Animated Submission Result Modal */}
      {showResultModal && result && (
        <SubmissionResultModal
          result={result}
          stats={submissionStats}
          problemTitle={problem?.title}
          problemId={problem?.id}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
}

export default CodeEditor;
