import React, { useState } from 'react';
import { HelpCircle, Sparkles, AlertTriangle, Keyboard, ExternalLink } from 'lucide-react';

export default function HelpView() {
  const [activeSection, setActiveSection] = useState('shortcuts');

  const sections = [
    { id: 'get-started', name: 'Get Started', icon: Sparkles },
    { id: 'unsupported-html', name: 'Unsupported HTML', icon: AlertTriangle },
    { id: 'shortcuts', name: 'Shortcuts', icon: Keyboard },
    { id: 'links', name: 'Links', icon: ExternalLink },
  ];

  return (
    <div className="flex-1 overflow-hidden flex text-gray-200 bg-[#0b0e14] select-none">
      {/* Help Sub Navigation */}
      <div className="w-56 border-r border-white/5 p-4 flex flex-col gap-1.5 flex-shrink-0 bg-[#0b0e14]">
        <h2 className="text-xl font-extrabold text-white px-3 mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <span>Help</span>
        </h2>
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                isActive
                  ? 'bg-[#131720] text-[#c2ff3d]'
                  : 'text-gray-400 hover:text-white hover:bg-[#131720]/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#c2ff3d]' : 'text-gray-500'}`} />
              <span>{sec.name}</span>
            </button>
          );
        })}
      </div>

      {/* Help Sub Contents */}
      <div className="flex-1 overflow-y-auto px-10 py-10">
        {activeSection === 'shortcuts' && (
          <div className="max-w-3xl bg-[#131720] border border-white/5 rounded-xl p-8 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6">Keyboard Shortcuts</h3>

            {/* Navigation Shortcuts */}
            <div className="mb-8">
              <h4 className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-4">
                NAVIGATION
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Next slide</span>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-300">&rarr;</kbd>
                    <span className="text-gray-600">/</span>
                    <kbd className="bg-white/5 border border-white/10 rounded px-2.5 py-0.5 text-gray-300">Space</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Previous slide</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 font-mono text-xs">&larr;</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">First slide</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-300 font-mono text-xs">Home</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Last slide</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 font-mono text-xs">End</kbd>
                </div>
              </div>
            </div>

            {/* Tools Shortcuts */}
            <div className="mb-8">
              <h4 className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-4">
                TOOLS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Laser pointer</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-300 font-mono text-xs">L</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Pen</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-300 font-mono text-xs">P</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Highlighter</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-300 font-mono text-xs font-semibold">H</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Eraser</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-300 font-mono text-xs">E</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Spotlight</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-300 font-mono text-xs">S</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Zoom tool</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-300 font-mono text-xs">Z</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5 text-gray-300">
                  <span className="text-sm text-gray-300">Clear canvas</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-300 font-mono text-xs">C</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300 font-medium text-amber-400">Deactivate tool</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 font-mono text-xs">Esc</kbd>
                </div>
              </div>
            </div>

            {/* General Shortcuts */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-4">
                GENERAL
              </h4>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-300">Search slides</span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-300">⌘</kbd>
                  <span className="text-gray-600">/</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-300">ctrl</kbd>
                  <span className="text-gray-600">+</span>
                  <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-300">F</kbd>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'get-started' && (
          <div className="max-w-2xl space-y-6">
            <h3 className="text-2xl font-bold text-white mb-4">Getting Started with HTMLSlides</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              HTMLSlides is a lightweight slide viewer for single-file presentation decks that run everywhere. To get started:
            </p>
            <div className="space-y-4 font-semibold text-gray-300">
              <div className="flex gap-4 items-start bg-[#131720]/40 border border-white/5 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Generate with AI</h4>
                  <p className="text-xs text-gray-400 font-normal leading-relaxed mt-1">
                    Ask any supporting AI agent (like Claude Code) to build a presentation file in HTML. Choose one of our 13 beautiful visual presets inside the skill manual!
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-[#131720]/40 border border-white/5 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Load the HTML File</h4>
                  <p className="text-xs text-gray-400 font-normal leading-relaxed mt-1">
                    Drag and drop your file into the <strong className="text-emerald-400 font-medium">Slides</strong> tab, or enter the local directory path where your files are kept in settings to scan them dynamically.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-[#131720]/40 border border-white/5 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Start Presenting</h4>
                  <p className="text-xs text-gray-400 font-normal leading-relaxed mt-1">
                    Double-click your slides, check your speaker notes in the right-hand panel, edit notes dynamically, zoom in/out, or draw direct highlights for your screen shares!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'unsupported-html' && (
          <div className="max-w-2xl space-y-6">
            <h3 className="text-2xl font-bold text-white mb-2">Unsupported HTML Elements</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              HTMLSlides operates in a sandbox with custom drawing overlays. Some HTML elements may conflict with standard presenters or block pointer events:
            </p>
            <div className="bg-amber-500/5 border border-amber-500/10 text-amber-400 p-4 rounded-xl text-xs space-y-2 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Elements to avoid:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
                <li>Heavy Canvas animations overlaying mouse handlers (which might prevent pens or highlights from rendering).</li>
                <li>Fixed full-screen alerts or popups (`window.alert` blocks presenter frames).</li>
                <li>External unsecure iframes or scripts that block cross-origin postMessage.</li>
                <li>Flash-based elements or outdated codecs.</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'links' && (
          <div className="max-w-xl space-y-6">
            <h3 className="text-2xl font-bold text-white mb-4">Useful Resources</h3>
            <div className="space-y-3 font-semibold text-sm">
              <a
                href="https://github.com/bluedusk/html-slides"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center bg-[#131720]/40 hover:bg-[#131720] border border-white/5 px-5 py-4 rounded-xl text-gray-300 hover:text-white transition-all group"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
              </a>

              <a
                href="https://github.com/bluedusk/html-slides"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center bg-[#131720]/40 hover:bg-[#131720] border border-white/5 px-5 py-4 rounded-xl text-gray-300 hover:text-white transition-all group"
              >
                <span>Documentation &amp; Visual Presets Manual</span>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
              </a>

              <a
                href="https://agentskills.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center bg-[#131720]/40 hover:bg-[#131720] border border-white/5 px-5 py-4 rounded-xl text-gray-300 hover:text-white transition-all group"
              >
                <span>AI Agent Skills Standard</span>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
