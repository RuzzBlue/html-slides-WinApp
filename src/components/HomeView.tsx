import React, { useState } from 'react';
import { Play, Download, Folder, Sparkles, FolderOpen, EyeOff, Trash2, HelpCircle } from 'lucide-react';
import { Presentation } from '../types';

interface HomeViewProps {
  recentPresentations: Presentation[];
  onOpenPresentation: (p: Presentation) => void;
  onTrySample: () => void;
  onNavigate: (tab: string) => void;
  onRemoveRecent: (id: string) => void;
  onDeleteRecent: (id: string) => void;
}

export default function HomeView({
  recentPresentations,
  onOpenPresentation,
  onTrySample,
  onNavigate,
  onRemoveRecent,
  onDeleteRecent,
}: HomeViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 text-gray-200 select-none bg-[#0b0e14] relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131720] border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in text-sm font-medium">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Welcome to HTMLSlides
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Browse, open, and present beautifully styled standalone HTML presentations.
          </p>
        </div>
        <div className="bg-[#131720] border border-white/5 rounded-md px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono text-gray-400">v0.9.1</span>
        </div>
      </div>

      {/* Top 3 Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          onClick={() => onNavigate('slides')}
          className="bg-[#131720] border border-white/5 hover:border-white/10 rounded-xl p-6 cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-emerald-400/20" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Open Slides</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Browse, open, and present your HTML slide decks in your library.
          </p>
        </div>

        <div
          onClick={() => onNavigate('skill')}
          className="bg-[#131720] border border-white/5 hover:border-white/10 rounded-xl p-6 cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Install Skill</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Set up the html-slides skill helper for your AI programming agent.
          </p>
        </div>

        <div
          onClick={() => onNavigate('slides')}
          className="bg-[#131720] border border-white/5 hover:border-white/10 rounded-xl p-6 cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Folder className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Open File</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Open an HTML presentation directly from your local filesystem or cloud URL.
          </p>
        </div>
      </div>

      {/* Main Banner Callout */}
      <div className="bg-[#131720] border border-white/5 rounded-xl p-6 mb-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>
        <div className="max-w-2xl relative z-10">
          <h2 className="text-xl font-bold text-white mb-2">Get started with HTMLSlides</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Generate stunning presentations with your AI agent, then present them with dual-display sync — presenter view on your screen, clean slides in the browser for screen sharing.
          </p>
        </div>
        <button
          onClick={onTrySample}
          className="bg-[#c2ff3d] hover:bg-[#b0f02c] text-[#000] font-bold text-sm px-5 py-3 rounded-lg shadow-md transition-all whitespace-nowrap relative z-10 hover:scale-105 active:scale-95"
        >
          Try a Sample
        </button>
      </div>

      {/* Recent Slides Section */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-4">
          RECENT SLIDES
        </h3>
        <div className="space-y-3">
          {recentPresentations.length === 0 ? (
            <div className="text-center py-10 bg-[#131720] border border-dashed border-white/5 rounded-xl text-gray-500 text-sm">
              No recent slides found. Open a slide or click "Try a Sample" to get started!
            </div>
          ) : (
            recentPresentations.map((pres) => (
              <div
                key={pres.id}
                onMouseEnter={() => setHoveredId(pres.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="bg-[#131720] hover:bg-[#1a1f2e] border border-white/5 hover:border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all relative overflow-hidden group"
              >
                <div onClick={() => onOpenPresentation(pres)} className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors flex-shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {pres.name}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono truncate mt-0.5 flex items-center gap-2">
                      <span className="text-[#c2ff3d] font-bold">H</span>
                      <span>{pres.path}</span>
                      <span className="text-gray-600">•</span>
                      <span>{pres.slidesCount} slides</span>
                      <span className="text-gray-600">•</span>
                      <span>{pres.dateAdded}</span>
                    </p>
                  </div>
                </div>

                {/* Hover Buttons */}
                <div className="flex items-center gap-1.5 z-20">
                  {hoveredId === pres.id ? (
                    <div className="flex items-center gap-1 bg-[#131720]/80 backdrop-blur px-2 py-1 rounded-lg border border-white/10 shadow-lg animate-fade-in">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerNotification(`Opened folder location: ${pres.path}`);
                        }}
                        title="Open folder location"
                        className="p-1.5 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-colors"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRecent(pres.id);
                          triggerNotification(`Removed presentation from recent view`);
                        }}
                        title="Remove from recent view"
                        className="p-1.5 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-colors"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecent(pres.id);
                          triggerNotification(`Deleted slide file: ${pres.name}`);
                        }}
                        title="Delete presentation"
                        className="p-1.5 hover:bg-red-500/10 rounded-md text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-500 group-hover:text-emerald-400 transition-colors mr-2">
                      <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
