import React, { useState, useEffect } from 'react';
import { RotateCcw, Bold, List } from 'lucide-react';
import { SlideNote } from '../types';

interface PresenterNotesProps {
  currentSlideIndex: number;
  originalNotes: SlideNote | undefined;
  editedNotesText: string;
  onNotesChange: (text: string) => void;
  onReset: () => void;
}

export default function PresenterNotes({
  currentSlideIndex,
  originalNotes,
  editedNotesText,
  onNotesChange,
  onReset,
}: PresenterNotesProps) {
  const handleBold = () => {
    // Basic Markdown/Text bolding helper
    const textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = `**${selectedText || 'bold text'}**`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    onNotesChange(newText);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selectedText ? selectedText.length : 9));
    }, 50);
  };

  const handleBullet = () => {
    const textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = `\n• ${selectedText || 'bullet item'}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    onNotesChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  return (
    <div className="w-80 border-l border-white/5 bg-[#131720]/80 backdrop-blur-md flex flex-col h-full flex-shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <span className="text-[11px] font-extrabold tracking-wider text-gray-400 uppercase">
          SPEAKER NOTES
        </span>
        <button
          onClick={onReset}
          className="flex items-center gap-1 bg-[#1c2233] hover:bg-white/5 border border-white/5 px-2 py-1 rounded text-[11px] text-gray-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Editor Controls */}
      <div className="px-4 py-2 bg-[#0b0e14]/50 border-b border-white/5 flex items-center gap-1.5">
        <button
          onClick={handleBold}
          title="Bold text"
          className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleBullet}
          title="Add bullet points"
          className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body / Textarea */}
      <div className="flex-1 p-4 flex flex-col min-h-0 bg-[#131720]/50">
        <div className="mb-3">
          <h4 className="text-sm font-extrabold text-white">
            {originalNotes?.title || `Slide ${currentSlideIndex + 1}`}
          </h4>
          {originalNotes?.script && (
            <p className="text-[11px] text-emerald-400 italic font-medium mt-1 leading-relaxed">
              Script: "{originalNotes.script}"
            </p>
          )}
        </div>

        <textarea
          id="notes-textarea"
          value={editedNotesText}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="No notes for this slide yet. Start writing ideas, scripts, or talking points..."
          className="w-full flex-1 bg-transparent border-none text-xs text-gray-300 leading-relaxed placeholder-gray-600 focus:outline-none resize-none overflow-y-auto font-sans focus:ring-0 p-0"
        />
      </div>

      {/* Help Tip */}
      <div className="p-4 bg-[#0b0e14]/30 border-t border-white/5 text-[10px] text-gray-500 leading-relaxed">
        Tip: Edits are autosaved locally. Resetting restores the original script notes from the HTML presentation source.
      </div>
    </div>
  );
}
