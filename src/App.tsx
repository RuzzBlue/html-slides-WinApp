import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Tv,
  Download,
  Settings,
  HelpCircle,
  Layout,
  Flower,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  PenTool,
  Highlighter,
  Eraser,
  Maximize,
  Minimize,
  Eye,
  Trash2,
  Monitor,
  Chrome,
  Flame,
  ZoomIn,
  ZoomOut,
  Palette,
  RotateCcw,
  Plus,
  Play,
  MousePointer,
  Flashlight,
  Pencil,
  Lightbulb
} from 'lucide-react';
import { Presentation, MonitoredFolder, ActiveTool, Point, DrawingPath } from './types';
import { SAMPLE_SLIDE_HTML, SAMPLE_SLIDE_NOTES } from './sampleSlide';

import HomeView from './components/HomeView';
import SlidesView from './components/SlidesView';
import SkillInstaller from './components/SkillInstaller';
import SettingsView from './components/SettingsView';
import HelpView from './components/HelpView';
import PresenterNotes from './components/PresenterNotes';
import DrawingOverlay from './components/DrawingOverlay';
import AudienceView from './components/AudienceView';

const DECAY_SPEEDS = [150, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];
const DECAY_PERCENTAGES = ['95%', '90%', '80%', '70%', '60%', '40%', '30%', '20%', '10%'];

export default function App() {
  // Check if we are in the clean Audience View window routing
  const isAudienceRoute = window.location.search.includes('view=audience');
  const [roleFlipped, setRoleFlipped] = useState(localStorage.getItem('htmlslides_role_flipped') === 'true');

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'htmlslides_role_flipped') {
        setRoleFlipped(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Requirement 5 - Flip audience and presenter screens
  const shouldRenderAudience = isAudienceRoute ? !roleFlipped : roleFlipped;

  if (shouldRenderAudience) {
    return <AudienceView />;
  }

  // Active workspace tab state: 'home' | 'slides' | 'skill' | 'settings' | 'help' | 'presenter'
  const [activeTab, setActiveTab] = useState<string>('home');

  // Presentations library in localStorage
  const [presentations, setPresentations] = useState<Presentation[]>([]);

  // Monitored folders path configuration
  const [monitoredFolders, setMonitoredFolders] = useState<MonitoredFolder[]>([]);

  // Selected active presentation
  const [activePres, setActivePres] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Speaker notes state - maps global presentationId_slideIndex to user modified string
  const [notesRegistry, setNotesRegistry] = useState<{ [key: string]: string }>({});

  // Drawing overlay canvas states
  const [activeTool, setActiveTool] = useState<ActiveTool>('arrow'); // Default is 'arrow' (Requirement 1)
  const [drawingColor, setDrawingColor] = useState<string>('#c2ff3d'); // Neon green default
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // Zoom factor (1 = normal)

  // Custom states added for requirements
  const [laserDecayTime, setLaserDecayTime] = useState<number>(1500); // Requirement 2: Laser trail decay in ms
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 }); // Requirement 4: Zoom panning offset
  const [simSize, setSimSize] = useState<'normal' | 'bigger' | 'maximized'>('normal'); // Requirement 5: Simulator size

  // Presenter Preview Zoom Mode & Container tracking state (Request 1)
  const [previewScaleMode, setPreviewScaleMode] = useState<'fit' | 'width' | '50' | '75' | '100' | '125' | '150' | '200'>(
    (localStorage.getItem('htmlslides_preview_scale_mode') as any) || 'fit'
  );
  const [containerSize, setContainerSize] = useState({ width: 1280, height: 720 });
  const previewContainerObserverRef = useRef<ResizeObserver | null>(null);

  const previewContainerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (previewContainerObserverRef.current) {
      previewContainerObserverRef.current.disconnect();
      previewContainerObserverRef.current = null;
    }
    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerSize({ width: width || 1280, height: height || 720 });
        }
      });
      observer.observe(node);
      previewContainerObserverRef.current = observer;
    }
  }, []);

  const handlePreviewScaleModeChange = (mode: any) => {
    setPreviewScaleMode(mode);
    localStorage.setItem('htmlslides_preview_scale_mode', mode);
  };

  // Presenter workspace layout controls
  const [sidebarLeftOpen, setSidebarLeftOpen] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [startPresenting, setStartPresenting] = useState(false);
  const [floatingNotesPos, setFloatingNotesPos] = useState<Point>({ x: 40, y: 350 });
  const [isDraggingNotes, setIsDraggingNotes] = useState(false);
  const dragOffset = useRef<Point>({ x: 0, y: 0 });

  // Floating Audience Simulator (for iframe preview and local display)
  const [audienceSimOpen, setAudienceSimOpen] = useState(false);

  // Timer state
  const [presentationTime, setPresentationTime] = useState<number>(0);
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(null);

  // General app notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const presenterIframeRef = useRef<HTMLIFrameElement>(null);
  const syncChannel = useRef<BroadcastChannel | null>(null);

  const syncStateRef = useRef({
    currentSlideIndex: 0,
    drawingPaths: [] as DrawingPath[],
    activeTool: 'arrow' as string | null,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 } as Point,
    laserDecayTime: 1200,
    simSize: 'normal' as 'normal' | 'bigger' | 'maximized'
  });

  useEffect(() => {
    syncStateRef.current = {
      currentSlideIndex,
      drawingPaths,
      activeTool,
      zoomLevel,
      panOffset,
      laserDecayTime,
      simSize
    };
  }, [currentSlideIndex, drawingPaths, activeTool, zoomLevel, panOffset, laserDecayTime, simSize]);

  // Toast Notification Trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Seed default presentations on startup
  useEffect(() => {
    // 1. Monitored folders
    const savedFolders = localStorage.getItem('htmlslides_folders');
    if (savedFolders) {
      setMonitoredFolders(JSON.parse(savedFolders));
    } else {
      const defaultFolders: MonitoredFolder[] = [
        { id: 'f1', path: '//?/C:/Users/Branko.Pereira/AppData/Local/HTMLSlides/samples' }
      ];
      setMonitoredFolders(defaultFolders);
      localStorage.setItem('htmlslides_folders', JSON.stringify(defaultFolders));
    }

    // 2. Presentations
    const savedPres = localStorage.getItem('htmlslides_presentations');
    if (savedPres) {
      setPresentations(JSON.parse(savedPres));
    } else {
      const defaultPres: Presentation[] = [
        {
          id: 'introducing-html-slides',
          name: 'introducing-html-slides.html',
          path: '//?/C:/Users/Branko.Pereira/AppData/Local/HTMLSlides/samples/',
          slidesCount: 21,
          dateAdded: 'Jul 10',
          htmlContent: SAMPLE_SLIDE_HTML,
          speakerNotes: SAMPLE_SLIDE_NOTES
        },
        {
          id: 'cryptocurrency-intro',
          name: 'cryptocurrency-intro.html',
          path: 'D:/ABACUS/HTMLSlides/',
          slidesCount: 21,
          dateAdded: 'Jul 10',
          htmlContent: SAMPLE_SLIDE_HTML, // Seed same presentation structure for cryptocurrency demo
          speakerNotes: SAMPLE_SLIDE_NOTES
        }
      ];
      setPresentations(defaultPres);
      localStorage.setItem('htmlslides_presentations', JSON.stringify(defaultPres));
    }

    // 3. Speaker Notes custom edits registry
    const savedNotes = localStorage.getItem('htmlslides_notes_registry');
    if (savedNotes) {
      setNotesRegistry(JSON.parse(savedNotes));
    }

    // Create BroadcastChannel for dual-screen syncing
    const channel = new BroadcastChannel('html-slides-sync');
    channel.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'SIMULATOR_ACTION') {
        const action = data.action;
        if (action === 'close') {
          setAudienceSimOpen(false);
        } else {
          setSimSize(action);
        }
      } else if (data.type === 'SYNC_FLIP') {
        if (data.roleFlipped !== undefined) {
          setRoleFlipped(data.roleFlipped);
          window.location.reload();
        }
      } else if (data.type === 'REQUEST_INITIAL_SYNC') {
        // Send complete active state to ensure seamless connection
        const state = syncStateRef.current;
        channel.postMessage({ type: 'SYNC_SLIDE', index: state.currentSlideIndex });
        channel.postMessage({ type: 'SYNC_PATHS', paths: state.drawingPaths });
        channel.postMessage({ type: 'SYNC_TOOL', tool: state.activeTool });
        channel.postMessage({ type: 'SYNC_ZOOM', zoom: state.zoomLevel });
        channel.postMessage({ type: 'SYNC_PAN_OFFSET', panOffset: state.panOffset });
        channel.postMessage({ type: 'SYNC_LASER_DECAY', laserDecayTime: state.laserDecayTime });
        channel.postMessage({ type: 'SIMULATOR_ACTION_BROADCAST', action: state.simSize });
      }
    };
    syncChannel.current = channel;

    return () => {
      channel.close();
    };
  }, []);

  // Listen for navigation postMessage events from the presenter iframe
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SLIDE_NAVIGATED') {
        const index = event.data.index;
        setCurrentSlideIndex(index);
        // Broadcast change in real-time to the Audience window!
        syncChannel.current?.postMessage({ type: 'SYNC_SLIDE', index });
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Sync state whenever presenter cursor moves
  const handleCursorMove = (point: Point, isClicking = false) => {
    syncChannel.current?.postMessage({
      type: 'SYNC_CURSOR',
      cursor: point,
      isClicking: isClicking
    });
    if (activeTool === 'spotlight') {
      syncChannel.current?.postMessage({
        type: 'SYNC_SPOTLIGHT',
        spotlight: true,
        spotlightPos: point
      });
    }
  };

  // Sync spotlight active state change
  useEffect(() => {
    syncChannel.current?.postMessage({
      type: 'SYNC_SPOTLIGHT',
      spotlight: activeTool === 'spotlight'
    });
    syncChannel.current?.postMessage({
      type: 'SYNC_TOOL',
      tool: activeTool
    });
  }, [activeTool]);

  // Sync drawing paths in real-time
  const handlePathsChange = (newPaths: DrawingPath[]) => {
    setDrawingPaths(newPaths);
    syncChannel.current?.postMessage({
      type: 'SYNC_PATHS',
      paths: newPaths
    });
  };

  // Sync Zoom Levels
  useEffect(() => {
    syncChannel.current?.postMessage({
      type: 'SYNC_ZOOM',
      zoom: zoomLevel
    });
  }, [zoomLevel]);

  // Sync Panning Offset
  useEffect(() => {
    syncChannel.current?.postMessage({
      type: 'SYNC_PAN_OFFSET',
      panOffset: panOffset
    });
  }, [panOffset]);

  // Sync Laser decay settings
  useEffect(() => {
    syncChannel.current?.postMessage({
      type: 'SYNC_LASER_DECAY',
      laserDecayTime: laserDecayTime
    });
  }, [laserDecayTime]);

  // Reset panOffset when zoom level is 1
  useEffect(() => {
    if (zoomLevel === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Sync Simulator Size
  useEffect(() => {
    syncChannel.current?.postMessage({
      type: 'SIMULATOR_ACTION_BROADCAST',
      action: simSize
    });
  }, [simSize]);

  // Broadcast Active HTML to ensure audience window is populated correctly
  useEffect(() => {
    if (activePres) {
      localStorage.setItem('htmlslides_active_html', activePres.htmlContent);
      syncChannel.current?.postMessage({ type: 'SYNC_HTML' });
      // Sync slide index immediately
      syncChannel.current?.postMessage({ type: 'SYNC_SLIDE', index: currentSlideIndex });
    }
  }, [activePres, currentSlideIndex]);

  // Timer trigger when "Start Presenting" runs
  useEffect(() => {
    if (startPresenting) {
      setPresentationTime(0);
      const interval = setInterval(() => {
        setPresentationTime((prev) => prev + 1);
      }, 1000);
      setTimerIntervalId(interval);
    } else {
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
        setTimerIntervalId(null);
      }
    }
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [startPresenting]);

  // Manage Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is writing notes or inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Check if we are in presenter view
      if (activeTab !== 'presenter' || !activePres) return;

      const totalSlides = activePres.slidesCount;

      // Esc key
      if (e.key === 'Escape') {
        e.preventDefault();
        if (startPresenting) {
          setStartPresenting(false);
          triggerToast('Exited full presentation mode');
        } else {
          setActiveTool(null);
        }
        return;
      }

      // Navigation keys
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        navigateSlide(Math.min(currentSlideIndex + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        navigateSlide(Math.max(currentSlideIndex - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        navigateSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        navigateSlide(totalSlides - 1);
      }

      // Tool toggles (case insensitive)
      const key = e.key.toLowerCase();
      if (key === 'l') {
        setActiveTool((prev) => (prev === 'laser' ? null : 'laser'));
      } else if (key === 'p') {
        setActiveTool((prev) => (prev === 'pen' ? null : 'pen'));
      } else if (key === 'h') {
        setActiveTool((prev) => (prev === 'highlighter' ? null : 'highlighter'));
      } else if (key === 'e') {
        setActiveTool((prev) => (prev === 'eraser' ? null : 'eraser'));
      } else if (key === 's') {
        setActiveTool((prev) => (prev === 'spotlight' ? null : 'spotlight'));
      } else if (key === 'z') {
        // Toggle Zoom cycles
        setZoomLevel((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1));
      } else if (key === 'c') {
        handlePathsChange([]);
        triggerToast('Cleared all drawings');
      }

      // Global Search toggle (ctrl+f)
      if ((e.ctrlKey || e.metaKey) && key === 'f') {
        e.preventDefault();
        setActiveTab('slides');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, currentSlideIndex, activePres, startPresenting]);

  // Handle slide transitions, sending a postMessage to the iframe
  const navigateSlide = (index: number) => {
    if (!activePres || index < 0 || index >= activePres.slidesCount) return;
    setCurrentSlideIndex(index);
    presenterIframeRef.current?.contentWindow?.postMessage(
      { type: 'GOTO_SLIDE', index },
      '*'
    );
    syncChannel.current?.postMessage({ type: 'SYNC_SLIDE', index });
  };

  // Draggable notes panel handlers
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDraggingNotes(true);
    dragOffset.current = {
      x: e.clientX - floatingNotesPos.x,
      y: e.clientY - floatingNotesPos.y
    };
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDraggingNotes) return;
    setFloatingNotesPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const handleDragEnd = () => {
    setIsDraggingNotes(false);
  };

  // Format presentation timer
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add folder path
  const addFolder = (path: string) => {
    const newF: MonitoredFolder = {
      id: Math.random().toString(),
      path
    };
    const updated = [...monitoredFolders, newF];
    setMonitoredFolders(updated);
    localStorage.setItem('htmlslides_folders', JSON.stringify(updated));
  };

  // Remove monitored folder path
  const removeFolder = (id: string) => {
    const updated = monitoredFolders.filter((f) => f.id !== id);
    setMonitoredFolders(updated);
    localStorage.setItem('htmlslides_folders', JSON.stringify(updated));
  };

  // Add presentation to library
  const addPresentation = (name: string, content: string, path = '') => {
    // Basic counting
    const slideMatches = content.match(/class=["'][^"']*slide[^"']*["']/g) || [];
    const slidesCount = Math.max(slideMatches.length, 1);

    const newPres: Presentation = {
      id: Math.random().toString(),
      name,
      path: path || '//?/local/uploads/',
      slidesCount,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      htmlContent: content,
      speakerNotes: SAMPLE_SLIDE_NOTES // Provide default templates notes for testing
    };

    const updated = [newPres, ...presentations];
    setPresentations(updated);
    localStorage.setItem('htmlslides_presentations', JSON.stringify(updated));
  };

  // Remove presentation from recent/library list
  const removePresentation = (id: string) => {
    const updated = presentations.filter((p) => p.id !== id);
    setPresentations(updated);
    localStorage.setItem('htmlslides_presentations', JSON.stringify(updated));
  };

  // Delete presentation file
  const deletePresentation = (id: string) => {
    const updated = presentations.filter((p) => p.id !== id);
    setPresentations(updated);
    localStorage.setItem('htmlslides_presentations', JSON.stringify(updated));
    if (activePres?.id === id) {
      setActivePres(null);
      setActiveTab('home');
    }
  };

  // Open presentation
  const openPresentation = (pres: Presentation) => {
    setActivePres(pres);
    setCurrentSlideIndex(0);
    setDrawingPaths([]);
    setActiveTool(null);
    setZoomLevel(1);
    setZenMode(false);
    setStartPresenting(false);
    setActiveTab('presenter');
  };

  // Trigger loading the sample presentation
  const openSamplePresentation = () => {
    const sample = presentations.find((p) => p.id === 'introducing-html-slides');
    if (sample) {
      openPresentation(sample);
    } else {
      // Re-create sample if deleted
      const defaultSample: Presentation = {
        id: 'introducing-html-slides',
        name: 'introducing-html-slides.html',
        path: '//?/C:/Users/Branko.Pereira/AppData/Local/HTMLSlides/samples/',
        slidesCount: 21,
        dateAdded: 'Jul 10',
        htmlContent: SAMPLE_SLIDE_HTML,
        speakerNotes: SAMPLE_SLIDE_NOTES
      };
      const updated = [defaultSample, ...presentations];
      setPresentations(updated);
      localStorage.setItem('htmlslides_presentations', JSON.stringify(updated));
      openPresentation(defaultSample);
    }
  };

  // Handle speaker notes updates
  const activeNotesKey = activePres ? `${activePres.id}_${currentSlideIndex}` : '';
  const currentSlideOriginalNotes = activePres?.speakerNotes[currentSlideIndex.toString()];

  const getActiveNotesText = (): string => {
    if (!activeNotesKey) return '';
    // If user edited notes, return edits
    if (notesRegistry[activeNotesKey] !== undefined) {
      return notesRegistry[activeNotesKey];
    }
    // Fallback to original notes bullets
    if (currentSlideOriginalNotes) {
      return currentSlideOriginalNotes.notes.map((n) => `• ${n}`).join('\n');
    }
    return '';
  };

  const handleNotesChange = (text: string) => {
    const updated = { ...notesRegistry, [activeNotesKey]: text };
    setNotesRegistry(updated);
    localStorage.setItem('htmlslides_notes_registry', JSON.stringify(updated));
  };

  const handleResetNotes = () => {
    const updated = { ...notesRegistry };
    delete updated[activeNotesKey];
    setNotesRegistry(updated);
    localStorage.setItem('htmlslides_notes_registry', JSON.stringify(updated));
    triggerToast('Notes reset to presentation defaults');
  };

  // Handle opening Audience Display in a new browser window/tab
  const openExternalAudienceWindow = () => {
    if (activePres) {
      localStorage.setItem('htmlslides_active_html', activePres.htmlContent);
    }
    // Try opening actual window with routing query parameter
    const url = window.location.origin + window.location.pathname + '?view=audience';
    const win = window.open(url, '_blank');
    if (win) {
      triggerToast('Audience Window opened! Drag it to your second display.');
    } else {
      // Popups blocked: activate our high-craft embedded audience simulator popup!
      setAudienceSimOpen(true);
      triggerToast('Popup blocked! Opened floating simulated audience display.');
    }
  };

  return (
    <div className="w-full h-screen flex bg-[#0b0e14] text-gray-200 select-none overflow-hidden relative font-sans">
      {/* Toast Messages */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#131720]/90 border border-white/5 shadow-2xl px-5 py-3 rounded-xl flex items-center gap-2 text-emerald-400 font-bold text-sm animate-fade-in backdrop-blur">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Embedded Floating Audience window simulator fallback */}
      {audienceSimOpen && (
        <div className={`fixed z-50 bg-[#0b0e14] border border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          simSize === 'bigger' ? 'inset-8 rounded-2xl' :
          simSize === 'maximized' ? 'inset-0 rounded-none border-none' :
          'inset-16 rounded-2xl'
        }`}>
          <div className="bg-[#131720] border-b border-white/5 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="text-[#c2ff3d] w-5 h-5" />
              <span className="text-sm font-bold text-white">Audience Display Window (Simulated Display Monitor)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono bg-[#c2ff3d]/10 text-[#c2ff3d] border border-[#c2ff3d]/20 px-2 py-0.5 rounded">
                Live Dual Screen Syncing
              </span>
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
                <button
                  onClick={() => setSimSize('normal')}
                  className={`text-[10px] px-2.5 py-1 rounded transition-all font-bold ${simSize === 'normal' ? 'bg-[#c2ff3d] text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setSimSize('bigger')}
                  className={`text-[10px] px-2.5 py-1 rounded transition-all font-bold ${simSize === 'bigger' ? 'bg-[#c2ff3d] text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Bigger
                </button>
                <button
                  onClick={() => setSimSize('maximized')}
                  className={`text-[10px] px-2.5 py-1 rounded transition-all font-bold ${simSize === 'maximized' ? 'bg-[#c2ff3d] text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Maximized
                </button>
              </div>
              <button
                onClick={() => setAudienceSimOpen(false)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-3 py-1 rounded-md transition-all font-bold"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black relative">
            <AudienceView />
          </div>
        </div>
      )}

      {/* Main shell is only rendered if not in Presenter View OR Zen Presenter is Active */}
      {activeTab !== 'presenter' && (
        <>
          {/* Main App Navigation Sidebar (Left) */}
          <div className="w-64 border-r border-white/5 bg-[#131720]/30 flex flex-col justify-between flex-shrink-0">
            {/* Logo area */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold text-white tracking-tight">HTMLSlides</span>
                  <span className="text-[10px] font-mono text-gray-500 font-semibold uppercase tracking-wider">Presenter</span>
                </div>
              </div>
            </div>

            {/* Menu options */}
            <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                  activeTab === 'home'
                    ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                onClick={() => setActiveTab('slides')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                  activeTab === 'slides'
                    ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>Slides</span>
              </button>

              <button
                onClick={() => setActiveTab('skill')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                  activeTab === 'skill'
                    ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Skill Installer</span>
              </button>
            </div>

            {/* Bottom options */}
            <div className="p-4 border-t border-white/5 space-y-1 bg-[#131720]/20">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                  activeTab === 'settings'
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => setActiveTab('help')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                  activeTab === 'help'
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help &amp; Shortcuts</span>
              </button>
            </div>
          </div>

          {/* Active view window container */}
          <div className="flex-1 flex flex-col bg-[#0b0e14] relative">
            {activeTab === 'home' && (
              <HomeView
                recentPresentations={presentations}
                onOpenPresentation={openPresentation}
                onTrySample={openSamplePresentation}
                onNavigate={setActiveTab}
                onRemoveRecent={removePresentation}
                onDeleteRecent={deletePresentation}
              />
            )}

            {activeTab === 'slides' && (
              <SlidesView
                presentations={presentations}
                onOpenPresentation={openPresentation}
                onAddPresentation={addPresentation}
                onRemoveRecent={removePresentation}
                onDeleteRecent={deletePresentation}
              />
            )}

            {activeTab === 'skill' && <SkillInstaller />}

            {activeTab === 'settings' && (
              <SettingsView
                monitoredFolders={monitoredFolders}
                onAddFolder={addFolder}
                onRemoveFolder={removeFolder}
              />
            )}

            {activeTab === 'help' && <HelpView />}
          </div>
        </>
      )}

      {/* ACTIVE PRESENTATION SPEAKER VIEW LAYOUT */}
      {activeTab === 'presenter' && activePres && (
        <div
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          className="w-full h-full bg-[#0b0e14] flex flex-col overflow-hidden select-none"
        >
          {/* Top Presenter Header */}
          <div className="h-14 border-b border-white/5 bg-[#131720]/80 backdrop-blur px-6 flex items-center justify-between flex-shrink-0 z-50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setStartPresenting(false);
                  setActiveTab('home');
                }}
                className="bg-[#1c2233] hover:bg-white/5 border border-white/5 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-all font-bold"
              >
                &larr; Back
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-white leading-none">
                  {activePres.name}
                </span>
                <span className="text-[10px] text-gray-500 font-mono font-semibold mt-0.5">
                  Slide {currentSlideIndex + 1} of {activePres.slidesCount}
                </span>
              </div>
            </div>

            {/* Middle: Presenting timer indicator */}
            <div className="flex items-center gap-3">
              <div className={`font-mono text-lg font-black tracking-widest ${startPresenting ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`}>
                {formatTimer(presentationTime)}
              </div>
            </div>

            {/* Right Header Side options */}
            <div className="flex items-center gap-3">
              <button
                onClick={openExternalAudienceWindow}
                className="flex items-center gap-2 bg-[#1c2233] hover:bg-white/5 border border-white/5 text-gray-300 hover:text-white text-xs px-3.5 py-1.5 rounded-lg transition-all font-bold"
              >
                <Monitor className="w-3.5 h-3.5 text-gray-400" />
                <span>Audience Window</span>
              </button>

              <button
                onClick={() => {
                  const path = prompt("Presentation Server local URL placeholder:", "http://localhost:9527/");
                  if (path) triggerToast(`Switched active slide rendering server to: ${path}`);
                }}
                className="flex items-center gap-2 bg-[#1c2233] hover:bg-white/5 border border-white/5 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-all font-bold"
              >
                <Chrome className="w-3.5 h-3.5 text-gray-400" />
                <span>Browser</span>
              </button>

              <button
                onClick={() => triggerToast('Laser spotlights active!')}
                className="p-1.5 bg-[#1c2233] hover:bg-white/5 rounded-lg border border-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse"></span>
              </button>

              <button
                onClick={() => {
                  if (startPresenting) {
                    setStartPresenting(false);
                  } else {
                    setStartPresenting(true);
                    setSidebarLeftOpen(false); // As requested: auto-hides sidebar when start presenting is clicked
                    triggerToast('Presentation Started! Left preview bar minimized.');
                  }
                }}
                className={`text-[#000] font-extrabold text-xs px-4 py-1.5 rounded-lg transition-all shadow-md ${
                  startPresenting
                    ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                    : 'bg-[#c2ff3d] hover:bg-[#b0f02c]'
                }`}
              >
                {startPresenting ? 'Stop Presentation' : 'Start Presentation'}
              </button>
            </div>
          </div>

          {/* Main Presenter Body Panel Workspace */}
          <div className="flex-1 flex overflow-hidden min-h-0 relative">
             {/* 1. Left Thumbnail Previews Sidebar (Collapsible) */}
            {sidebarLeftOpen && !zenMode && (
              <div className="w-48 border-r border-white/5 bg-[#131720]/30 overflow-y-auto p-4 space-y-3 flex-shrink-0 z-30 animate-slide-right">
                <span className="text-[10px] font-extrabold text-gray-500 tracking-wider uppercase block mb-1">
                  SLIDES PREVIEW
                </span>
                {Array.from({ length: activePres.slidesCount }).map((_, i) => {
                  const isActive = currentSlideIndex === i;
                  return (
                    <div
                      key={i}
                      onClick={() => navigateSlide(i)}
                      className={`relative rounded-lg overflow-hidden border cursor-pointer group transition-all p-2 ${
                        isActive
                          ? 'border-[#c2ff3d] bg-[#c2ff3d]/5 scale-[1.02] shadow-md'
                          : 'border-white/5 bg-[#131720]/50 hover:bg-[#131720] hover:border-white/20'
                      }`}
                    >
                      <span className={`absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-20 ${
                        isActive ? 'bg-[#c2ff3d] text-black font-extrabold' : 'bg-white/10 text-gray-400'
                      }`}>
                        {i + 1}
                      </span>
                      {/* Real miniature slide rendering */}
                      <div className="w-full aspect-[16/9] relative overflow-hidden bg-black rounded border border-white/5 mt-6">
                        {/* Cover overlay to handle all pointer interactions */}
                        <div className="absolute inset-0 bg-transparent z-10" />
                        <div
                          className="w-[1280px] h-[720px] origin-top-left pointer-events-none select-none"
                          style={{ transform: 'scale(0.1125)' }} // Scales 1280 down to exactly 144px width
                        >
                          <iframe
                            srcDoc={activePres.htmlContent}
                            onLoad={(e) => {
                              const iframe = e.currentTarget;
                              // Send message to set this thumbnail iframe to its corresponding slide
                              iframe.contentWindow?.postMessage(
                                { type: 'GOTO_SLIDE', index: i },
                                '*'
                              );
                            }}
                            className="w-full h-full border-none bg-black"
                            title={`Slide Thumbnail ${i + 1}`}
                          />
                        </div>
                      </div>
                      <div className="mt-2 text-center truncate text-[10px] text-gray-400 font-bold px-1 select-none">
                        {activePres.speakerNotes[i.toString()]?.title || `Slide ${i + 1}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Slide Screen View Panel Frame (Center) */}
            <div
              ref={previewContainerRef}
              className="flex-1 flex flex-col bg-[#0b0e14] relative items-center justify-center p-6 select-none overflow-hidden"
            >
              {/* Scale Zoom Outer Box */}
              {(() => {
                const baseWidth = 1280;
                const baseHeight = 720;
                let layoutScale = 1;
                if (previewScaleMode === 'fit') {
                  const padX = 64;
                  const padY = 64;
                  const scaleX = Math.max(0.1, (containerSize.width - padX) / baseWidth);
                  const scaleY = Math.max(0.1, (containerSize.height - padY) / baseHeight);
                  layoutScale = Math.min(scaleX, scaleY, 1.5);
                } else if (previewScaleMode === 'width') {
                  const padX = 64;
                  layoutScale = Math.max(0.1, (containerSize.width - padX) / baseWidth);
                } else {
                  layoutScale = parseFloat(previewScaleMode) / 100;
                }

                return (
                  <div
                    className="w-[1280px] h-[720px] absolute transition-transform duration-150 ease-out flex items-center justify-center"
                    style={{
                      transform: `scale(${layoutScale * zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                      transformOrigin: 'center center'
                    }}
                  >
                    {/* Embedded HTML presentation viewer (iframe srcDoc matches design fully) */}
                    <iframe
                      ref={presenterIframeRef}
                      srcDoc={activePres.htmlContent}
                      onLoad={(e) => {
                        const iframe = e.currentTarget;
                        // Send message to sync active slide immediately on loading
                        iframe.contentWindow?.postMessage(
                          { type: 'GOTO_SLIDE', index: currentSlideIndex },
                          '*'
                        );

                        // Attach event listeners inside the iframe document
                        const iframeDoc = iframe.contentDocument;
                        if (iframeDoc) {
                          iframeDoc.addEventListener('mousemove', (me: MouseEvent) => {
                            const x = me.clientX;
                            const y = me.clientY;
                            handleCursorMove({ x, y });
                          });

                          iframeDoc.addEventListener('mouseleave', () => {
                            syncChannel.current?.postMessage({
                              type: 'SYNC_CURSOR',
                              cursor: null
                            });
                          });

                          iframeDoc.addEventListener('click', (ce: MouseEvent) => {
                            const x = ce.clientX;
                            const y = ce.clientY;
                            syncChannel.current?.postMessage({
                              type: 'SYNC_IFRAME_CLICK',
                              x,
                              y
                            });
                          });
                        }
                      }}
                      className="w-full h-full border border-white/5 rounded-2xl bg-black shadow-2xl relative"
                      title="HTML Presenter Frame"
                    />

                    {/* SVG drawings overlay controller */}
                    <DrawingOverlay
                      activeTool={activeTool}
                      drawingColor={drawingColor}
                      zoomLevel={zoomLevel * layoutScale}
                      paths={drawingPaths}
                      onPathsChange={handlePathsChange}
                      onCursorMove={handleCursorMove}
                      onActivePathChange={(points) => {
                        syncChannel.current?.postMessage({
                          type: 'SYNC_ACTIVE_PATH',
                          points,
                          tool: activeTool,
                          color: drawingColor
                        });
                      }}
                      laserDecayTime={laserDecayTime}
                      panOffset={panOffset}
                      onPanOffsetChange={setPanOffset}
                      onZoomCycle={() => {
                        setZoomLevel((prev) => {
                          if (prev === 1) return 1.5;
                          if (prev === 1.5) return 2.25;
                          if (prev === 2.25) return 3;
                          return 1; // back to default zoom 100%
                        });
                      }}
                    />
                  </div>
                );
              })()}

              {/* Floating draggable speaker notes (Zen Mode active) */}
              {zenMode && (
                <div
                  onMouseDown={handleDragStart}
                  style={{ left: `${floatingNotesPos.x}px`, top: `${floatingNotesPos.y}px` }}
                  className="absolute w-80 bg-[#131720]/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-up backdrop-blur"
                >
                  <div className="bg-[#131720] border-b border-white/5 p-3 flex items-center justify-between cursor-move select-none select-none">
                    <span className="text-xs font-extrabold text-[#c2ff3d] flex items-center gap-1.5">
                      <Flower className="w-3.5 h-3.5 text-[#c2ff3d]" /> NOTES
                    </span>
                    <button
                      onClick={() => setZenMode(false)}
                      className="text-gray-500 hover:text-white text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5"
                    >
                      Dock Panel
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-white">
                      {currentSlideOriginalNotes?.title || `Slide ${currentSlideIndex + 1}`}
                    </h4>
                    <p className="text-[11px] text-gray-300 font-medium max-h-56 overflow-y-auto leading-relaxed whitespace-pre-line">
                      {getActiveNotesText() || 'No speaker notes written yet.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Speaker notes Sidebar (Right) */}
            {!zenMode && (
              <PresenterNotes
                currentSlideIndex={currentSlideIndex}
                originalNotes={currentSlideOriginalNotes}
                editedNotesText={getActiveNotesText()}
                onNotesChange={handleNotesChange}
                onReset={handleResetNotes}
              />
            )}
          </div>

          {/* Bottom Toolbar Drawer */}
          <div className="h-16 border-t border-white/5 bg-[#131720]/80 backdrop-blur-md flex items-center justify-between px-8 flex-shrink-0 z-50">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSidebarLeftOpen(!sidebarLeftOpen);
                  triggerToast(sidebarLeftOpen ? 'Thumbnails panel hidden' : 'Thumbnails panel shown');
                }}
                title="Toggle Left Previews"
                className={`p-2 rounded-lg border transition-all ${
                  sidebarLeftOpen
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-[#1c2233] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Layout className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setZenMode(!zenMode);
                  triggerToast(zenMode ? 'Zen mode deactivated' : 'Zen mode activated! All panels hidden.');
                }}
                title="Zen Mode"
                className={`p-2 rounded-lg border transition-all ${
                  zenMode
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-[#1c2233] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Flower className="w-4 h-4" />
              </button>
            </div>

            {/* Middle Nav Controls */}
            <div className="flex items-center gap-2 bg-[#0b0e14]/50 border border-white/5 px-4 py-1.5 rounded-xl">
              <button
                onClick={() => navigateSlide(0)}
                title="First slide"
                disabled={currentSlideIndex === 0}
                className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateSlide(Math.max(currentSlideIndex - 1, 0))}
                title="Previous slide"
                disabled={currentSlideIndex === 0}
                className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-white px-3 font-mono min-w-[50px] text-center select-none select-none">
                {currentSlideIndex + 1} / {activePres.slidesCount}
              </span>

              <button
                onClick={() => navigateSlide(Math.min(currentSlideIndex + 1, activePres.slidesCount - 1))}
                title="Next slide"
                disabled={currentSlideIndex === activePres.slidesCount - 1}
                className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateSlide(activePres.slidesCount - 1)}
                title="Last slide"
                disabled={currentSlideIndex === activePres.slidesCount - 1}
                className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              {/* Presenter Preview Sizing Dropdown (Request 1 of current request) */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 ml-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider hidden md:inline">
                  View:
                </span>
                <select
                  value={previewScaleMode}
                  onChange={(e) => handlePreviewScaleModeChange(e.target.value as any)}
                  title="Presenter Preview Zoom Level"
                  className="bg-[#1c2233] text-xs text-gray-200 border border-white/10 rounded-lg px-2 py-1 pr-6 outline-none cursor-pointer focus:border-[#c2ff3d] hover:border-white/20 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b949e%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_6px_center] bg-no-repeat"
                >
                  <option value="fit" className="bg-[#131720] text-gray-200">Fit to Screen</option>
                  <option value="width" className="bg-[#131720] text-gray-200">Full Width</option>
                  <option value="50" className="bg-[#131720] text-gray-200">50%</option>
                  <option value="75" className="bg-[#131720] text-gray-200">75%</option>
                  <option value="100" className="bg-[#131720] text-gray-200">100%</option>
                  <option value="125" className="bg-[#131720] text-gray-200">125%</option>
                  <option value="150" className="bg-[#131720] text-gray-200">150%</option>
                  <option value="200" className="bg-[#131720] text-gray-200">200%</option>
                </select>
              </div>
            </div>

            {/* Right Annotation Controls */}
            <div className="flex items-center gap-2">
              {/* Arrow Cursor (Default Interaction Mode - Requirement 1) */}
              <button
                onClick={() => {
                  setActiveTool('arrow');
                  triggerToast('Interacting mode active (Arrow Cursor)');
                }}
                title="Default Interaction Pointer (Arrow Cursor)"
                className={`p-2 rounded-lg border transition-all ${
                  activeTool === 'arrow' || !activeTool
                    ? 'bg-[#c2ff3d]/20 border-[#c2ff3d]/30 text-[#c2ff3d] scale-105 font-bold'
                    : 'bg-[#1c2233] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <MousePointer className="w-4 h-4" />
              </button>

              {/* Laser Pointer (Decaying Trail - Requirement 2) */}
              <div className="relative group/laser">
                <button
                  onClick={() => {
                    setActiveTool((prev) => (prev === 'laser' ? 'arrow' : 'laser'));
                    triggerToast('Laser pointer selected!');
                  }}
                  title="Laser Pointer (Hover to adjust speed)"
                  className={`p-2 rounded-lg border transition-all flex items-center gap-1 ${
                    activeTool === 'laser'
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 scale-105'
                      : 'bg-[#1c2233] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Flashlight className="w-4 h-4" />
                </button>

                {/* Laser decay hover slider settings */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#131720]/95 backdrop-blur border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2 z-50 pointer-events-auto opacity-0 invisible group-hover/laser:opacity-100 group-hover/laser:visible transition-all duration-200 min-w-[180px]">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-gray-400 uppercase tracking-wide">
                    <span>Speed</span>
                    <span className="text-red-400 font-mono">
                      {DECAY_PERCENTAGES[DECAY_SPEEDS.indexOf(laserDecayTime)] || '60%'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={DECAY_SPEEDS.length - 1}
                    step="1"
                    value={DECAY_SPEEDS.indexOf(laserDecayTime) !== -1 ? DECAY_SPEEDS.indexOf(laserDecayTime) : 4}
                    onChange={(e) => {
                      const index = Number(e.target.value);
                      setLaserDecayTime(DECAY_SPEEDS[index]);
                    }}
                    className="w-full accent-red-500 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[7px] text-gray-500 font-bold font-mono">
                    <span>FAST</span>
                    <span>SLOW</span>
                  </div>
                </div>
              </div>

              {/* Pen */}
              <button
                onClick={() => {
                  setActiveTool((prev) => (prev === 'pen' ? 'arrow' : 'pen'));
                  triggerToast('Pen tool selected!');
                }}
                title="Pen drawing tool"
                className={`p-2 rounded-lg border transition-all ${
                  activeTool === 'pen'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 scale-105'
                    : 'bg-[#1c2233] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Highlighter */}
              <button
                onClick={() => {
                  setActiveTool((prev) => (prev === 'highlighter' ? 'arrow' : 'highlighter'));
                  triggerToast('Highlighter selected!');
                }}
                title="Highlighter tool (Semi-transparent brush)"
                className={`p-2 rounded-lg border transition-all ${
                  activeTool === 'highlighter'
                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 scale-105'
                    : 'bg-[#1c2233] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Highlighter className="w-4 h-4" />
              </button>

              {/* Stroke Color Selector (Expanded & Wider - Requirement 3) */}
              <div className="relative">
                <button
                  onClick={() => setColorMenuOpen(!colorMenuOpen)}
                  title="Drawing stroke color picker"
                  className="p-2 bg-[#1c2233] border border-white/5 rounded-lg text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Palette className="w-4 h-4" />
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/40 block"
                    style={{ backgroundColor: drawingColor }}
                  ></span>
                </button>
                {colorMenuOpen && (
                  <div className="absolute bottom-12 right-0 bg-[#131720]/95 backdrop-blur border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-2.5 z-50 animate-fade-in w-72">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                        Stroke Color
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">
                        {drawingColor === '#c2ff3d' ? 'Neon Green' :
                         drawingColor === '#ff4b4b' ? 'Red' :
                         drawingColor === '#38bdf8' ? 'Blue' :
                         drawingColor === '#10b981' ? 'Green' :
                         drawingColor === '#facc15' ? 'Yellow' :
                         drawingColor === '#f97316' ? 'Orange' :
                         drawingColor === '#000000' ? 'Black' :
                         drawingColor === '#ffffff' ? 'White' : 'Custom'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2.5 justify-items-center">
                      {[
                        { hex: '#c2ff3d', name: 'Neon Green' },
                        { hex: '#ff4b4b', name: 'Red' },
                        { hex: '#38bdf8', name: 'Blue' },
                        { hex: '#10b981', name: 'Green' },
                        { hex: '#facc15', name: 'Yellow' },
                        { hex: '#f97316', name: 'Orange' },
                        { hex: '#000000', name: 'Black' },
                        { hex: '#ffffff', name: 'White' },
                      ].map((item) => (
                        <button
                          key={item.hex}
                          onClick={() => {
                            setDrawingColor(item.hex);
                            setColorMenuOpen(false);
                            triggerToast(`Switched stroke to ${item.name}!`);
                          }}
                          className={`w-6 h-6 rounded-full border border-white/10 hover:scale-110 active:scale-95 transition-all ${
                            drawingColor === item.hex ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#131720] scale-115 shadow-lg' : ''
                          }`}
                          style={{ backgroundColor: item.hex }}
                          title={item.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Eraser */}
              <button
                onClick={() => {
                  setActiveTool((prev) => (prev === 'eraser' ? 'arrow' : 'eraser'));
                  triggerToast('Eraser selected!');
                }}
                title="Proximity Eraser tool"
                className={`p-2 rounded-lg border transition-all ${
                  activeTool === 'eraser'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 scale-105'
                    : 'bg-[#1c2233] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Eraser className="w-4 h-4" />
              </button>

              {/* Spotlight */}
              <button
                onClick={() => {
                  setActiveTool((prev) => (prev === 'spotlight' ? 'arrow' : 'spotlight'));
                  triggerToast('Spotlight selected!');
                }}
                title="Spotlight dark mask"
                className={`p-2 rounded-lg border transition-all ${
                  activeTool === 'spotlight'
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 scale-105'
                    : 'bg-[#1c2233] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {activeTool === 'spotlight' ? (
                  <Lightbulb className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' }} />
                ) : (
                  <Lightbulb className="w-4 h-4" />
                )}
              </button>

              {/* Zoom & Pan Active Tool Button (Requirement 4) */}
              <div className="flex items-center gap-1.5 bg-[#1c2233] px-2 py-1 rounded-lg border border-white/5">
                <button
                  onClick={() => {
                    setActiveTool((prev) => (prev === 'zoom' ? 'arrow' : 'zoom'));
                    triggerToast('Zoom & Pan mode active! Click screen to cycle scale, Drag to pan.');
                  }}
                  title="Zoom & Pan Tool (Click slides to cycle size, drag to pan)"
                  className={`p-1 rounded transition-all ${
                    activeTool === 'zoom'
                      ? 'bg-emerald-500/15 text-emerald-400 scale-105 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono font-black text-emerald-400 min-w-[32px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                {zoomLevel > 1 && (
                  <button
                    onClick={() => {
                      setZoomLevel(1);
                      setPanOffset({ x: 0, y: 0 });
                      triggerToast('Zoom reset to 100%');
                    }}
                    title="Reset Zoom & Pan"
                    className="p-0.5 hover:bg-white/5 text-gray-400 hover:text-white rounded"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Reset drawing canvas */}
              <button
                onClick={() => {
                  handlePathsChange([]);
                  triggerToast('Canvas cleared!');
                }}
                title="Clear Drawings"
                className="p-2 bg-[#1c2233] border border-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
