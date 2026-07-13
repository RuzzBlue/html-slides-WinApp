import React, { useState } from 'react';
import { RefreshCw, Github, Copy, Check, Sparkles } from 'lucide-react';

export default function SkillInstaller() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 text-gray-200 select-none bg-[#0b0e14]">
      {/* Header with quick links */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Skill Installer</h1>
          <p className="text-gray-400 text-sm mt-1">
            Install the html-slides skill for your AI agents to build stunning slides autonomously.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {}}
            className="flex items-center gap-2 bg-[#131720] border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <a
            href="https://github.com/bluedusk/html-slides"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#131720] border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* Claude Code Card */}
        <div className="bg-[#131720] border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm font-mono">
                CC
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Claude Code</h3>
                <p className="text-xs text-gray-400">Install via native prompt or plugin system</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Not installed
            </span>
          </div>

          <div className="space-y-4">
            {/* Option 1 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Option 1 — Ask Claude Code (easiest)
              </p>
              <p className="text-xs text-gray-500 mb-2">Just tell Claude Code in natural language:</p>
              <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3.5 font-mono text-sm text-[#c2ff3d] flex justify-between items-center group">
                <span>Install the html-slides plugin from bluedusk/html-slides</span>
                <button
                  onClick={() => handleCopy('Install the html-slides plugin from bluedusk/html-slides', 'claude-opt1')}
                  className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  {copiedText === 'claude-opt1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Option 2 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Option 2 — Run commands in terminal
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">Step 1: Add the marketplace</p>
                  <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3.5 font-mono text-xs text-[#c2ff3d] flex justify-between items-center group">
                    <span>claude plugin marketplace add bluedusk/html-slides</span>
                    <button
                      onClick={() => handleCopy('claude plugin marketplace add bluedusk/html-slides', 'claude-opt2-s1')}
                      className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {copiedText === 'claude-opt2-s1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500 mb-1">Step 2: Install the plugin</p>
                  <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3.5 font-mono text-xs text-[#c2ff3d] flex justify-between items-center group">
                    <span>claude plugin install html-slides</span>
                    <button
                      onClick={() => handleCopy('claude plugin install html-slides', 'claude-opt2-s2')}
                      className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {copiedText === 'claude-opt2-s2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 italic">After installing, restart Claude Code to activate the plugin.</p>
          </div>
        </div>

        {/* Gemini CLI / Copilot / Codex Card */}
        <div className="bg-[#131720] border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#c2ff3d]/10 flex items-center justify-center text-[#c2ff3d] font-bold text-sm font-mono">
                G
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Gemini CLI / Copilot / Codex</h3>
                <p className="text-xs text-gray-400">Install via shell installer script or manually symlink</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Not installed
            </span>
          </div>

          <div className="space-y-4">
            {/* Option 1 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Option 1 — One-line install (easiest)
              </p>
              <p className="text-xs text-gray-500 mb-2">Run in your terminal — detects your agents and sets up everything:</p>
              <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3.5 font-mono text-xs text-[#c2ff3d] flex justify-between items-center group">
                <span className="break-all">curl -sSL https://raw.githubusercontent.com/bluedusk/html-slides/main/remote-install.sh | bash</span>
                <button
                  onClick={() => handleCopy('curl -sSL https://raw.githubusercontent.com/bluedusk/html-slides/main/remote-install.sh | bash', 'gemini-opt1')}
                  className="text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100"
                >
                  {copiedText === 'gemini-opt1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Option 2 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Option 2 — Clone and install
              </p>
              <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3.5 font-mono text-xs text-[#c2ff3d] flex justify-between items-start group">
                <pre className="whitespace-pre-wrap leading-relaxed">
{`git clone https://github.com/bluedusk/html-slides.git
cd html-slides
./install.sh`}
                </pre>
                <button
                  onClick={() => handleCopy(`git clone https://github.com/bluedusk/html-slides.git\ncd html-slides\n./install.sh`, 'gemini-opt2')}
                  className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 mt-0.5 ml-4"
                >
                  {copiedText === 'gemini-opt2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">Interactive installer — choose user-level or project-level scope.</p>
            </div>

            {/* Option 3 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Option 3 — Manual symlink
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">Gemini CLI</p>
                  <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3.5 font-mono text-xs text-[#c2ff3d] flex justify-between items-center group">
                    <span>ln -s /path/to/html-slides ~/.gemini/skills/html-slides</span>
                    <button
                      onClick={() => handleCopy('ln -s /path/to/html-slides ~/.gemini/skills/html-slides', 'gemini-opt3-gem')}
                      className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {copiedText === 'gemini-opt3-gem' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500 mb-1">GitHub Copilot</p>
                  <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3.5 font-mono text-xs text-[#c2ff3d] flex justify-between items-center group">
                    <span>ln -s /path/to/html-slides .github/skills/html-slides</span>
                    <button
                      onClick={() => handleCopy('ln -s /path/to/html-slides .github/skills/html-slides', 'gemini-opt3-cop')}
                      className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {copiedText === 'gemini-opt3-cop' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500 mb-1">OpenAI Codex</p>
                  <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3.5 font-mono text-xs text-[#c2ff3d] flex justify-between items-center group">
                    <span>ln -s /path/to/html-slides ~/.codex/skills/html-slides</span>
                    <button
                      onClick={() => handleCopy('ln -s /path/to/html-slides ~/.codex/skills/html-slides', 'gemini-opt3-codex')}
                      className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {copiedText === 'gemini-opt3-codex' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 italic mt-1">Restart your agent after installing to activate the skill.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
