import React, { useEffect, useState, useRef } from 'react';
import { Point, DrawingPath } from '../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  Volume2
} from 'lucide-react';

interface SyncMessage {
  type: string;
  index?: number;
  cursor?: Point | null;
  isClicking?: boolean;
  paths?: DrawingPath[];
  spotlight?: boolean;
  spotlightPos?: Point;
  zoom?: number;
  laserDots?: Point[];
  roleFlipped?: boolean;
  action?: string;
  tool?: string;
  laserDecayTime?: number;
  panOffset?: Point;
  points?: Point[];
  color?: string;
  x?: number;
  y?: number;
}

export default function AudienceView() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [presenterCursor, setPresenterCursor] = useState<Point | null>(null);
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState<Point>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Requirement 5 - Local control states
  const [localZoom, setLocalZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roleFlipped, setRoleFlipped] = useState(localStorage.getItem('htmlslides_role_flipped') === 'true');
  const [simSize, setSimSize] = useState<'normal' | 'bigger' | 'maximized'>('normal');

  // New states for real-time laser sync and sizing
  const [activeTool, setActiveTool] = useState<string>('arrow');
  const [laserDecayTime, setLaserDecayTime] = useState<number>(1500);
  const [laserDots, setLaserDots] = useState<{ id: string; x: number; y: number; createdAt: number }[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 1280, height: 720 });
  const containerObserverRef = useRef<ResizeObserver | null>(null);

  // States for real-time panning and tracing sync
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [activePathPoints, setActivePathPoints] = useState<Point[]>([]);
  const [activePathTool, setActivePathTool] = useState<string>('pen');
  const [activePathColor, setActivePathColor] = useState<string>('#ff0000');

  const audienceSyncStateRef = useRef({ activeTool, laserDecayTime });
  useEffect(() => {
    audienceSyncStateRef.current = { activeTool, laserDecayTime };
  }, [activeTool, laserDecayTime]);

  const containerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (containerObserverRef.current) {
      containerObserverRef.current.disconnect();
      containerObserverRef.current = null;
    }
    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerSize({ width: width || 1280, height: height || 720 });
        }
      });
      observer.observe(node);
      containerObserverRef.current = observer;
    }
  }, []);

  // Decaying laser dots timer for audience display
  useEffect(() => {
    if (activeTool !== 'laser' && laserDots.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setLaserDots((prev) => prev.filter((dot) => now - dot.createdAt < laserDecayTime));
    }, 30);

    return () => clearInterval(interval);
  }, [activeTool, laserDots.length, laserDecayTime]);

  useEffect(() => {
    // Read the HTML content of the active presentation from localStorage to render it identically
    const savedActiveHtml = localStorage.getItem('htmlslides_active_html');
    if (savedActiveHtml) {
      setHtmlContent(savedActiveHtml);
    }

    const channel = new BroadcastChannel('html-slides-sync');

    // Register broadcast listener
    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const data = event.data;
      if (data.type === 'SYNC_SLIDE') {
        if (data.index !== undefined) {
          setCurrentSlide(data.index);
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'GOTO_SLIDE', index: data.index },
            '*'
          );
        }
      } else if (data.type === 'SYNC_CURSOR') {
        setPresenterCursor(data.cursor || null);
        const currentActiveTool = audienceSyncStateRef.current.activeTool;
        const currentLaserDecayTime = audienceSyncStateRef.current.laserDecayTime;
        if (data.cursor && currentActiveTool === 'laser' && currentLaserDecayTime > 0 && data.isClicking) {
          const newDot = {
            id: Math.random().toString(),
            x: data.cursor.x,
            y: data.cursor.y,
            createdAt: Date.now(),
          };
          setLaserDots((prev) => [...prev, newDot]);
        }
      } else if (data.type === 'SYNC_LASER_DECAY') {
        if (data.laserDecayTime !== undefined) {
          setLaserDecayTime(data.laserDecayTime);
        }
      } else if (data.type === 'SYNC_TOOL') {
        if (data.tool) {
          setActiveTool(data.tool);
        }
      } else if (data.type === 'SYNC_PATHS') {
        if (data.paths) {
          setPaths(data.paths);
        }
      } else if (data.type === 'SYNC_SPOTLIGHT') {
        if (data.spotlight !== undefined) setSpotlightActive(data.spotlight);
        if (data.spotlightPos) setSpotlightPos(data.spotlightPos);
      } else if (data.type === 'SYNC_ZOOM') {
        if (data.zoom !== undefined) setZoomLevel(data.zoom);
      } else if (data.type === 'SYNC_PAN_OFFSET') {
        if (data.panOffset) {
          setPanOffset(data.panOffset);
        }
      } else if (data.type === 'SYNC_ACTIVE_PATH') {
        if (data.points) {
          setActivePathPoints(data.points);
          if (data.tool) setActivePathTool(data.tool);
          if (data.color) setActivePathColor(data.color);
        }
      } else if (data.type === 'SYNC_IFRAME_CLICK') {
        const x = data.x;
        const y = data.y;
        if (x !== undefined && y !== undefined && iframeRef.current) {
          const audienceDoc = iframeRef.current.contentDocument;
          if (audienceDoc) {
            const element = audienceDoc.elementFromPoint(x, y) as HTMLElement;
            if (element) {
              element.click();
              element.focus();
            }
          }
        }
      } else if (data.type === 'SYNC_HTML') {
        const activeHtml = localStorage.getItem('htmlslides_active_html');
        if (activeHtml) setHtmlContent(activeHtml);
      } else if (data.type === 'SYNC_FLIP') {
        if (data.roleFlipped !== undefined) {
          setRoleFlipped(data.roleFlipped);
          window.location.reload();
        }
      } else if (data.type === 'SIMULATOR_ACTION_BROADCAST') {
        if (data.action) {
          setSimSize(data.action as any);
        }
      }
    };

    // Request initial sync immediately upon mount
    channel.postMessage({ type: 'REQUEST_INITIAL_SYNC' });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Periodically sync HTML if needed
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'htmlslides_active_html' && e.newValue) {
        setHtmlContent(e.newValue);
      }
      if (e.key === 'htmlslides_role_flipped') {
        setRoleFlipped(e.newValue === 'true');
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel.close();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync internal slide state if iframe reloads
  const handleIframeLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'GOTO_SLIDE', index: currentSlide },
      '*'
    );
  };

  const renderPathToSvg = (path: DrawingPath) => {
    if (path.points.length === 0) return null;
    const d = path.points
      .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <path
        key={path.id}
        d={d}
        fill="none"
        stroke={path.color}
        strokeWidth={path.width}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={path.opacity}
      />
    );
  };

  // Requirement 5 Handlers
  const handleZoomIn = () => {
    setLocalZoom((prev) => Math.min(prev + 0.15, 3));
  };

  const handleZoomOut = () => {
    setLocalZoom((prev) => Math.max(prev - 0.15, 0.5));
  };

  const handleZoomReset = () => {
    setLocalZoom(1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const sendSimulatorAction = (action: 'normal' | 'bigger' | 'maximized' | 'close') => {
    const channel = new BroadcastChannel('html-slides-sync');
    channel.postMessage({ type: 'SIMULATOR_ACTION', action });
    channel.close();
    setSimSize(action as any);
  };

  const handleFlipScreens = () => {
    const nextVal = !roleFlipped;
    localStorage.setItem('htmlslides_role_flipped', String(nextVal));
    setRoleFlipped(nextVal);
    const channel = new BroadcastChannel('html-slides-sync');
    channel.postMessage({ type: 'SYNC_FLIP', roleFlipped: nextVal });
    channel.close();
    window.location.reload();
  };

  const baseWidth = 1280;
  const baseHeight = 720;
  const scaleX = containerSize.width / baseWidth;
  const scaleY = containerSize.height / baseHeight;
  const layoutScale = Math.min(scaleX, scaleY);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-[#0b0e14] overflow-hidden flex items-center justify-center relative select-none group"
    >
      
      {/* REQUIREMENT 5 - ON-HOVER FLOATING CONTROLS OVERLAY */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#131720]/95 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-2.5 flex items-center gap-5 shadow-2xl z-50 transition-all duration-300 opacity-40 hover:opacity-100 scale-95 hover:scale-100">
        {/* macOS Style Colored Window Dots */}
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          {/* Close/Minimize (Red) */}
          <button
            onClick={() => {
              sendSimulatorAction('close');
              window.close();
            }}
            className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 transition-colors flex items-center justify-center text-[8px] font-bold text-black/60"
            title="Minimize / Close Window"
          >
            &times;
          </button>
          {/* Make Bigger (Yellow) */}
          <button
            onClick={() => sendSimulatorAction(simSize === 'bigger' ? 'normal' : 'bigger')}
            className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors flex items-center justify-center text-[7px] font-bold text-black/60"
            title="Make Bigger"
          >
            +
          </button>
          {/* Maximize / Fill (Green) */}
          <button
            onClick={() => {
              sendSimulatorAction(simSize === 'maximized' ? 'normal' : 'maximized');
              toggleFullscreen();
            }}
            className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400 transition-colors flex items-center justify-center text-[6px] font-bold text-black/60"
            title="Maximize Window"
          >
            &#9650;
          </button>
        </div>

        {/* Zoom Resize Cluster */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Zoom Out Audience Display"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-emerald-400 min-w-[48px] text-center">
            {Math.round(localZoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Zoom In Audience Display"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Screen Position / Full Screen Controls */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg transition-all ${
              isFullscreen
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'hover:bg-white/5 text-gray-400 hover:text-white'
            }`}
            title="Toggle HTML5 Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Switch Screen / Flip Screens */}
          <button
            onClick={handleFlipScreens}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2233] hover:bg-white/10 border border-white/10 text-xs font-bold text-white rounded-lg transition-all shadow-md active:scale-95"
            title="Flip / Swap Presenter & Audience Screens"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#c2ff3d]" />
            <span>Flip Screens</span>
          </button>
        </div>
      </div>

      {/* Container holding the presentation scaled matching the combined zoom factors */}
      <div
        className="w-[1280px] h-[720px] shrink-0 relative transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${layoutScale * zoomLevel * localZoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center',
        }}
      >
        {htmlContent ? (
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            onLoad={handleIframeLoad}
            className="w-full h-full border border-white/5 rounded-2xl bg-black shadow-2xl relative"
            title="Audience Slide Presenter"
          />
        ) : (
          <div className="text-gray-500 text-sm">
            Waiting for presentation to start in the presenter window...
          </div>
        )}

        {/* Sync Drawing Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-40 bg-transparent"
          style={{ touchAction: 'none' }}
        >
          {/* Spotlight Sync Mask */}
          {spotlightActive && (
            <>
              <defs>
                <mask id="audience-spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <circle cx={spotlightPos.x} cy={spotlightPos.y} r="100" fill="black" />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.85)"
                mask="url(#audience-spotlight-mask)"
              />
              <circle
                cx={spotlightPos.x}
                cy={spotlightPos.y}
                r="100"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Sync drawings paths */}
          {paths.map(renderPathToSvg)}

          {/* Active drawing path sync */}
          {activePathPoints.length > 0 && (() => {
            const d = activePathPoints
              .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');
            const width = activePathTool === 'highlighter' ? 24 : 3;
            const opacity = activePathTool === 'highlighter' ? 0.35 : 1;
            return (
              <path
                d={d}
                fill="none"
                stroke={activePathColor}
                strokeWidth={width}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={opacity}
              />
            );
          })()}

          {/* Laser continuous lines for a smooth glowing trail on Audience display */}
          {(() => {
            if (laserDots.length < 2 || laserDecayTime <= 0) return null;

            // Group dots into continuous segments separated by large time gaps
            const segments: typeof laserDots[] = [];
            let currentSegment: typeof laserDots = [laserDots[0]];

            for (let i = 1; i < laserDots.length; i++) {
              const prevDot = laserDots[i - 1];
              const dot = laserDots[i];
              if (dot.createdAt - prevDot.createdAt > 150) {
                if (currentSegment.length >= 2) {
                  segments.push(currentSegment);
                }
                currentSegment = [dot];
              } else {
                currentSegment.push(dot);
              }
            }
            if (currentSegment.length >= 2) {
              segments.push(currentSegment);
            }

            const pathsToRender: React.ReactNode[] = [];
            const now = Date.now();

            segments.forEach((segment, segIdx) => {
              // Slice the contiguous segment into multiple sub-paths to allow gradual fading from head to tail
              const numSubPaths = Math.min(12, segment.length - 1);
              if (numSubPaths <= 0) return;

              const dotsPerSubPath = Math.ceil((segment.length - 1) / numSubPaths);

              for (let p = 0; p < numSubPaths; p++) {
                const startIdx = p * dotsPerSubPath;
                // Overlap by 1 element to connect the sub-paths seamlessly
                const endIdx = Math.min(segment.length - 1, (p + 1) * dotsPerSubPath);
                if (startIdx >= endIdx) break;

                const subDots = segment.slice(startIdx, endIdx + 1);
                if (subDots.length < 2) continue;

                const avgAge = subDots.reduce((sum, d) => sum + (now - d.createdAt), 0) / subDots.length;
                const opacity = Math.max(0, 1 - avgAge / laserDecayTime);
                if (opacity <= 0) continue;

                const pathData = `M ${subDots[0].x} ${subDots[0].y} ` + 
                  subDots.slice(1).map(d => `L ${d.x} ${d.y}`).join(' ');

                pathsToRender.push(
                  <g key={`laser-subpath-aud-${segIdx}-${p}`}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#ff0000"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={opacity * 0.75}
                      style={{
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 0 6px rgba(255,0,0,0.95))',
                      }}
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#ffd1d1"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={opacity}
                      style={{
                        pointerEvents: 'none',
                      }}
                    />
                  </g>
                );
              }
            });

            return pathsToRender;
          })()}

          {/* Custom styled presenter cursor based on tool */}
          {presenterCursor && (() => {
            if (activeTool === 'laser') {
              return (
                <g>
                  <circle
                    cx={presenterCursor.x}
                    cy={presenterCursor.y}
                    r="16"
                    fill="rgba(255, 0, 0, 0.25)"
                    className="animate-ping"
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={presenterCursor.x}
                    cy={presenterCursor.y}
                    r="6"
                    fill="#ff3333"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{
                      pointerEvents: 'none',
                      filter: 'drop-shadow(0 0 8px rgba(255,0,0,1))',
                    }}
                  />
                </g>
              );
            }

            if (activeTool === 'arrow' || !activeTool) {
              return (
                <g transform={`translate(${presenterCursor.x}, ${presenterCursor.y})`}>
                  <path
                    d="M 0 0 L 12 12 L 5 12 L 7.5 18 L 5.5 19 L 3 13 L 0 16 Z"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="1.5"
                    style={{
                      pointerEvents: 'none',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                    }}
                  />
                </g>
              );
            }

            if (activeTool === 'spotlight') {
              return null; // The spotlight mask already highlights the position
            }

            // Other drawing tools (pen, highlighter, eraser)
            return (
              <g>
                <circle
                  cx={presenterCursor.x}
                  cy={presenterCursor.y}
                  r={activeTool === 'highlighter' ? 12 : 3}
                  fill={activeTool === 'highlighter' ? 'rgba(255,255,0,0.3)' : '#ffffff'}
                  stroke="#000000"
                  strokeWidth="1"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Floating Status Indicator */}
      <div className="absolute bottom-4 right-4 bg-[#131720]/80 backdrop-blur border border-white/5 rounded px-3 py-1 text-[10px] font-mono text-gray-500 z-50">
        Audience Sync • Live
      </div>
    </div>
  );
}

