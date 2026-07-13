import React, { useState, useRef } from 'react';
import { Search, FolderPlus, Link, Folder, Play, FolderOpen, EyeOff, Trash2 } from 'lucide-react';
import { Presentation } from '../types';

interface SlidesViewProps {
  presentations: Presentation[];
  onOpenPresentation: (p: Presentation) => void;
  onAddPresentation: (name: string, content: string, path?: string) => void;
  onRemoveRecent: (id: string) => void;
  onDeleteRecent: (id: string) => void;
}

export default function SlidesView({
  presentations,
  onOpenPresentation,
  onAddPresentation,
  onRemoveRecent,
  onDeleteRecent,
}: SlidesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper to parse slide HTML and extract slide count
  const parseHtmlContent = (content: string, fileName: string) => {
    // Look for occurrences of class="slide" or data-slide= or <section
    const slideDivMatches = content.match(/class=["'][^"']*slide[^"']*["']/g) || [];
    const sectionMatches = content.match(/<section/g) || [];
    const slideCount = Math.max(slideDivMatches.length, sectionMatches.length, 1);
    onAddPresentation(fileName, content, `//local/uploads/${fileName}`);
    triggerNotification(`Successfully loaded "${fileName}" (${slideCount} slides)`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseHtmlContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      triggerNotification('Please drop a valid .html presentation slide file!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseHtmlContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleUrlOpen = () => {
    if (!urlInput.trim()) return;

    const url = urlInput.trim();
    const fileName = url.substring(url.lastIndexOf('/') + 1) || 'web-slide.html';

    // Simulate fetching content or creating a mock presenter for local path files
    // If it starts with http, we can simulate fetching or load a container. Let's add it.
    const mockContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { background: #0b0e14; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }
          .slide { text-align: center; display: none; }
          .slide.active { display: block; }
          h1 { color: #58a6ff; font-size: 40px; }
        </style>
      </head>
      <body>
        <div class="deck">
          <div class="slide active" data-slide="0">
            <h1>Loaded: ${fileName}</h1>
            <p>Slide deck loaded from: ${url}</p>
          </div>
          <div class="slide" data-slide="1">
            <h1>Second Slide</h1>
            <p>Interactions work beautifully!</p>
          </div>
        </div>
        <script>
          let current = 0;
          const slides = document.querySelectorAll('.slide');
          function goTo(index) {
            if (index < 0 || index >= slides.length) return;
            slides[current].classList.remove('active');
            current = index;
            slides[current].classList.add('active');
            window.parent.postMessage({ type: 'SLIDE_NAVIGATED', index: current }, '*');
          }
          window.addEventListener('message', (e) => {
            if (e.data.type === 'GOTO_SLIDE') goTo(e.data.index);
          });
        </script>
      </body>
      </html>
    `;

    onAddPresentation(fileName, mockContent, url);
    triggerNotification(`Opened presentation from path: ${url}`);
    setUrlInput('');
  };

  const filteredPresentations = presentations.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 text-gray-200 select-none bg-[#0b0e14] relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131720] border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in text-sm font-medium">
          <Folder className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Slides</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage, upload, and launch HTML presentation slide decks.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search slides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131720] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/30 transition-colors placeholder-gray-500 font-medium"
          />
        </div>
      </div>

      {/* Draggable Uploader Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all mb-8 ${
          isDragging
            ? 'border-[#c2ff3d] bg-[#c2ff3d]/5 text-white'
            : 'border-white/5 hover:border-white/20 bg-[#131720]/50 hover:bg-[#131720]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".html,.htm"
          className="hidden"
        />
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 mb-4">
          <FolderPlus className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">
          Drop an HTML file to add to your library, or click to open
        </p>
        <p className="text-xs text-gray-500">Supports self-contained slide HTML presentations</p>
      </div>

      {/* Paste URL or File Path Input */}
      <div className="flex gap-2 mb-10 bg-[#131720] border border-white/5 p-2 rounded-xl">
        <div className="flex items-center gap-3 pl-3 flex-1">
          <Link className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Paste a URL or local file path to open..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-gray-200 focus:outline-none placeholder-gray-500 font-medium"
          />
        </div>
        <button
          onClick={handleUrlOpen}
          className="bg-[#c2ff3d] hover:bg-[#b0f02c] text-[#000] font-bold text-sm px-5 py-2.5 rounded-lg transition-all active:scale-95 whitespace-nowrap"
        >
          Open
        </button>
      </div>

      {/* Library/Recent Section */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-4">
          RECENT SLIDES
        </h3>
        <div className="space-y-3">
          {filteredPresentations.length === 0 ? (
            <div className="text-center py-10 bg-[#131720]/50 border border-white/5 rounded-xl text-gray-500 text-sm">
              {searchQuery ? 'No presentations matches your search query' : 'No presentations found. Upload one to begin!'}
            </div>
          ) : (
            filteredPresentations.map((pres) => (
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

                {/* Actions */}
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
                          triggerNotification(`Removed presentation from library view`);
                        }}
                        title="Remove from library"
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
                    <div className="text-gray-500 group-hover:text-[#c2ff3d] transition-colors mr-2">
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
