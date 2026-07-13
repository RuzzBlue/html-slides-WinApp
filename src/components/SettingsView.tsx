import React, { useState } from 'react';
import { Folder, Plus, X, Server, Code, Sparkles } from 'lucide-react';
import { MonitoredFolder } from '../types';

interface SettingsViewProps {
  monitoredFolders: MonitoredFolder[];
  onAddFolder: (path: string) => void;
  onRemoveFolder: (id: string) => void;
}

export default function SettingsView({
  monitoredFolders,
  onAddFolder,
  onRemoveFolder,
}: SettingsViewProps) {
  const [newFolderPath, setNewFolderPath] = useState('');
  const [port, setPort] = useState('9527');
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderPath.trim()) return;
    onAddFolder(newFolderPath.trim());
    triggerNotification(`Added folder path: ${newFolderPath.trim()}`);
    setNewFolderPath('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 text-gray-200 select-none bg-[#0b0e14] relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131720] border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in text-sm font-medium">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your workspace folders, presentation ports, and updates.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Monitor Folders Card */}
        <div className="bg-[#131720] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Folder className="w-4 h-4 text-emerald-400" />
              <span>Monitor Folders</span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10">
              <Plus className="w-3 h-3" /> Add Folder
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            HTML presentations in these directories will appear automatically in your local Presenter list.
          </p>

          {/* Form to Add folder */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-4 bg-[#0b0e14] border border-white/5 rounded-lg p-1.5 pl-3 items-center">
            <input
              type="text"
              placeholder="Enter folder path, e.g. ~/presentations"
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-gray-200 focus:outline-none placeholder-gray-600 font-medium font-mono"
            />
            <button
              type="submit"
              className="text-[#c2ff3d] hover:text-[#b0f02c] font-bold text-xs px-4 py-2 hover:bg-white/5 rounded-md transition-all active:scale-95"
            >
              Add
            </button>
          </form>

          {/* List of folders */}
          <div className="space-y-2">
            {monitoredFolders.map((folder) => (
              <div
                key={folder.id}
                className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-3 flex items-center justify-between font-mono text-xs text-gray-400 hover:text-white hover:border-white/10 transition-all group"
              >
                <span className="truncate pr-4">{folder.path}</span>
                <button
                  type="button"
                  onClick={() => {
                    onRemoveFolder(folder.id);
                    triggerNotification('Removed monitored folder path');
                  }}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Presentation Server Card */}
        <div className="bg-[#131720] border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Presentation Server</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Choose which network port the presentation slides sync server runs on.
          </p>
          <div className="flex items-center justify-between bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-3">
            <span className="text-xs font-semibold text-gray-400">Port</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value.replace(/\D/g, ''))}
                className="w-16 bg-transparent border-none text-right text-xs font-mono font-bold text-[#c2ff3d] focus:outline-none"
              />
              <span className="text-xs text-gray-600 font-medium">(default)</span>
            </div>
          </div>
        </div>

        {/* About Card */}
        <div className="bg-[#131720] border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>About</span>
          </h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
              <span className="font-semibold text-gray-400">Version</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-gray-500">0.9.1</span>
                <button
                  type="button"
                  onClick={() => triggerNotification('App is already up-to-date! Current version: 0.9.1')}
                  className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-all"
                >
                  Check for Updates
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-400">Skill Repo</span>
              <a
                href="https://github.com/bluedusk/html-slides"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 font-bold hover:underline font-mono"
              >
                github.com/bluedusk/html-slides
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
