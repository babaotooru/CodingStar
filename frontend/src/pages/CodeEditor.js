import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { problemsAPI, submissionsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

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
};

function CodeEditor() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('JAVA');
  const [code, setCode] = useState(languageDefaults.JAVA.template);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProblem, setShowProblem] = useState(true);

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
  }, [id]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(languageDefaults[lang].template);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const response = await submissionsAPI.submit({
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
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading editor..." />;
  if (!problem) return <div className="text-center text-dark-400 py-12">Problem not found</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Problem Panel */}
      <div className={`${showProblem ? 'lg:w-2/5' : 'lg:w-0 hidden lg:block'} overflow-y-auto transition-all`}>
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 h-full overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-white">{problem.title}</h2>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>

          <div className="space-y-4 text-sm">
            <div className="text-dark-300 whitespace-pre-wrap">{problem.description}</div>

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

            {problem.sampleInput && (
              <div>
                <h3 className="font-semibold text-white mb-1">Sample Input</h3>
                <pre className="bg-dark-800 rounded p-3 text-dark-200 font-mono text-xs">{problem.sampleInput}</pre>
              </div>
            )}

            {problem.sampleOutput && (
              <div>
                <h3 className="font-semibold text-white mb-1">Sample Output</h3>
                <pre className="bg-dark-800 rounded p-3 text-dark-200 font-mono text-xs">{problem.sampleOutput}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="lg:flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-dark-900 rounded-t-xl border border-dark-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProblem(!showProblem)}
              className="text-dark-400 hover:text-white transition-colors lg:block hidden"
              title={showProblem ? 'Hide problem' : 'Show problem'}
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

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit
              </>
            )}
          </button>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 border-x border-dark-700">
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

        {/* Results Panel */}
        <div className="bg-dark-900 rounded-b-xl border border-dark-700 p-4 min-h-[120px]">
          <h3 className="text-sm font-semibold text-dark-300 mb-2">Result</h3>
          {result ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <StatusBadge status={result.status} />
                <span className="text-dark-400 text-sm">
                  {result.testCasesPassed}/{result.totalTestCases} test cases passed
                </span>
                {result.executionTimeMs != null && (
                  <span className="text-dark-400 text-sm">{result.executionTimeMs}ms</span>
                )}
              </div>
              {result.errorMessage && (
                <pre className="bg-dark-800 rounded p-3 text-red-400 font-mono text-xs overflow-x-auto mt-2">
                  {result.errorMessage}
                </pre>
              )}
              {result.output && (
                <pre className="bg-dark-800 rounded p-3 text-dark-300 font-mono text-xs overflow-x-auto mt-2">
                  {result.output}
                </pre>
              )}
            </div>
          ) : (
            <p className="text-dark-500 text-sm">Submit your code to see results</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;
