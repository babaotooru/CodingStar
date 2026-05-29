import React, { useState, useEffect } from 'react';
import { problemNotesAPI } from '../services/api';
import { toast } from 'react-toastify';

function NotesEditor({ problemId, onNoteSaved }) {
  const [note, setNote] = useState({
    approach: '',
    logic: '',
    learnings: '',
    timeComplexity: '',
    spaceComplexity: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingNote, setHasExistingNote] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const hasNoteResponse = await problemNotesAPI.hasNote(problemId);
        const noteExists = Boolean(hasNoteResponse.data?.hasNote ?? hasNoteResponse.data);

        if (noteExists) {
          const response = await problemNotesAPI.get(problemId);
          if (response.data) {
            setNote({
              approach: response.data.approach || '',
              logic: response.data.logic || '',
              learnings: response.data.learnings || '',
              timeComplexity: response.data.timeComplexity || '',
              spaceComplexity: response.data.spaceComplexity || '',
            });
            setHasExistingNote(true);
          }
        }
      } catch (err) {
        toast.error('Failed to load note');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [problemId]);

  const handleChange = (field, value) => {
    setNote({ ...note, [field]: value });
  };

  const handleSave = async () => {
    // Validate that at least approach is filled
    if (!note.approach.trim()) {
      toast.error('Please write your approach before saving');
      return;
    }

    setSaving(true);
    try {
      await problemNotesAPI.save({
        problemId: parseInt(problemId),
        ...note,
      });
      toast.success(hasExistingNote ? 'Note updated successfully!' : 'Note saved successfully! Next problem unlocked.');
      setHasExistingNote(true);
      if (onNoteSaved) onNoteSaved();
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    setSaving(true);
    try {
      await problemNotesAPI.delete(problemId);
      setNote({
        approach: '',
        logic: '',
        learnings: '',
        timeComplexity: '',
        spaceComplexity: '',
      });
      setHasExistingNote(false);
      toast.success('Note deleted successfully');
      if (onNoteSaved) onNoteSaved();
    } catch (err) {
      toast.error('Failed to delete note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-blue-300 text-xs">
            <p className="font-medium mb-1">Document Your Solution</p>
            <p className="text-blue-400/80">Write down your approach and learnings. This helps reinforce concepts and unlocks the next problem!</p>
          </div>
        </div>
      </div>

      {/* Approach */}
      <div>
        <label className="block text-white font-medium mb-2">
          Approach <span className="text-red-400">*</span>
          <span className="text-xs text-dark-400 font-normal ml-2">(How did you think about solving this?)</span>
        </label>
        <textarea
          value={note.approach}
          onChange={(e) => handleChange('approach', e.target.value)}
          placeholder="Describe your approach step-by-step. What patterns did you recognize? What algorithm did you choose?"
          className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={6}
        />
      </div>

      {/* Logic */}
      <div>
        <label className="block text-white font-medium mb-2">
          Logic & Implementation
          <span className="text-xs text-dark-400 font-normal ml-2">(How does your code work?)</span>
        </label>
        <textarea
          value={note.logic}
          onChange={(e) => handleChange('logic', e.target.value)}
          placeholder="Explain the key logic in your solution. What are the important variables, loops, or conditions?"
          className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={6}
        />
      </div>

      {/* Learnings */}
      <div>
        <label className="block text-white font-medium mb-2">
          Key Learnings
          <span className="text-xs text-dark-400 font-normal ml-2">(What did you learn?)</span>
        </label>
        <textarea
          value={note.learnings}
          onChange={(e) => handleChange('learnings', e.target.value)}
          placeholder="What did you learn from this problem? Any mistakes or edge cases you discovered?"
          className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>

      {/* Complexity Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white font-medium mb-2">Time Complexity</label>
          <input
            type="text"
            value={note.timeComplexity}
            onChange={(e) => handleChange('timeComplexity', e.target.value)}
            placeholder="e.g., O(n), O(n log n)"
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-2">Space Complexity</label>
          <input
            type="text"
            value={note.spaceComplexity}
            onChange={(e) => handleChange('spaceComplexity', e.target.value)}
            placeholder="e.g., O(1), O(n)"
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !note.approach.trim()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            saving || !note.approach.trim()
              ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {hasExistingNote ? 'Update Note' : 'Save Note'}
            </>
          )}
        </button>

        {hasExistingNote && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Note
          </button>
        )}
      </div>

      {hasExistingNote && (
        <div className="text-xs text-dark-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Note saved • Next problem unlocked
        </div>
      )}
    </div>
  );
}

export default NotesEditor;
