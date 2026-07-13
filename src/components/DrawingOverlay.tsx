import React, { useState, useEffect, useRef } from 'react';
import { ActiveTool, Point, DrawingPath } from '../types';

interface DrawingOverlayProps {
  activeTool: ActiveTool;
  drawingColor: string;
  zoomLevel: number;
  paths: DrawingPath[];
  onPathsChange: (paths: DrawingPath[]) => void;
  onCursorMove?: (point: Point) => void;
  laserDecayTime?: number; // Requirement 2: Adjustable laser trail
  panOffset?: Point; // Requirement 4: Drag panning offset
  onPanOffsetChange?: (offset: Point) => void; // Requirement 4
  onZoomCycle?: () => void; // Requirement 4: Click to zoom cycle
}

interface LaserDot {
  id: string;
  x: number;
  y: number;
  createdAt: number;
}

export default function DrawingOverlay({
  activeTool,
  drawingColor,
  zoomLevel,
  paths,
  onPathsChange,
  onCursorMove,
  laserDecayTime = 1200,
  panOffset = { x: 0, y: 0 },
  onPanOffsetChange,
  onZoomCycle,
}: DrawingOverlayProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [laserDots, setLaserDots] = useState<LaserDot[]>([]);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const containerRef = useRef<SVGSVGElement>(null);

  // Requirement 4 panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [panHasMoved, setPanHasMoved] = useState(false);

  // Manage Laser decay trail
  useEffect(() => {
    if (activeTool !== 'laser' && laserDots.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setLaserDots((prev) => prev.filter((dot) => now - dot.createdAt < laserDecayTime));
    }, 30);

    return () => clearInterval(interval);
  }, [activeTool, laserDots.length, laserDecayTime]);

  const getCoordinates = (e: React.MouseEvent<SVGSVGElement>): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    // Normalize coordinates considering active canvas scaling zoom level
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Zoom panning logic
    if (activeTool === 'zoom') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanHasMoved(false);
      e.preventDefault();
      return;
    }

    if (!activeTool || activeTool === 'arrow' || activeTool === 'spotlight') return;
    e.preventDefault();

    const coord = getCoordinates(e);
    setIsDrawing(true);

    if (activeTool === 'laser') {
      const newDot: LaserDot = {
        id: Math.random().toString(),
        x: coord.x,
        y: coord.y,
        createdAt: Date.now(),
      };
      setLaserDots((prev) => [...prev, newDot]);
    } else if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentPoints([coord]);
    } else if (activeTool === 'eraser') {
      eraseAtPoint(coord);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    // Zoom panning drag logic
    if (activeTool === 'zoom' && isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        setPanHasMoved(true);
      }
      if (onPanOffsetChange) {
        onPanOffsetChange({
          x: panOffset.x + dx / zoomLevel,
          y: panOffset.y + dy / zoomLevel,
        });
      }
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const coord = getCoordinates(e);
    setMousePos(coord);

    if (onCursorMove) {
      onCursorMove(coord);
    }

    if (activeTool === 'laser' && laserDecayTime > 0) {
      const newDot: LaserDot = {
        id: Math.random().toString(),
        x: coord.x,
        y: coord.y,
        createdAt: Date.now(),
      };
      setLaserDots((prev) => [...prev, newDot]);
    }

    if (!isDrawing) return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentPoints((prev) => [...prev, coord]);
    } else if (activeTool === 'eraser') {
      eraseAtPoint(coord);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'zoom') {
      setIsPanning(false);
      if (!panHasMoved) {
        // Simple click without dragging -> cycle zoom!
        onZoomCycle?.();
      }
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if ((activeTool === 'pen' || activeTool === 'highlighter') && currentPoints.length > 1) {
      const newPath: DrawingPath = {
        id: Math.random().toString(),
        type: activeTool,
        points: currentPoints,
        color: drawingColor,
        width: activeTool === 'highlighter' ? 24 : 3,
        opacity: activeTool === 'highlighter' ? 0.35 : 1,
        createdAt: Date.now(),
      };
      onPathsChange([...paths, newPath]);
    }

    setCurrentPoints([]);
  };

  const handleMouseLeave = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'zoom') {
      setIsPanning(false);
      return;
    }
    handleMouseUp(e);
  };

  // Proximity eraser calculation
  const eraseAtPoint = (point: Point) => {
    const eraseRadius = 18; // px
    const remainingPaths = paths.filter((path) => {
      // If any point in the path is within radius of eraser cursor, delete the entire path
      const touched = path.points.some((p) => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) < eraseRadius;
      });
      return !touched;
    });

    if (remainingPaths.length !== paths.length) {
      onPathsChange(remainingPaths);
    }
  };

  // SVG drawing converter helper
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
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const renderActivePath = () => {
    if (currentPoints.length === 0) return null;
    const d = currentPoints
      .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <path
        d={d}
        fill="none"
        stroke={drawingColor}
        strokeWidth={activeTool === 'highlighter' ? 24 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={activeTool === 'highlighter' ? 0.35 : 1}
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  // Determine pointer cursor styling depending on tool selection
  const getCursorClass = () => {
    if (activeTool === 'laser') return 'cursor-none';
    if (activeTool === 'pen') return 'cursor-crosshair';
    if (activeTool === 'highlighter') return 'cursor-crosshair';
    if (activeTool === 'eraser') return 'cursor-cell';
    if (activeTool === 'spotlight') return 'cursor-none';
    if (activeTool === 'zoom') return 'cursor-zoom-in';
    return '';
  };

  return (
    <svg
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`absolute inset-0 w-full h-full select-none z-40 bg-transparent ${getCursorClass()}`}
      style={{
        touchAction: 'none',
        pointerEvents: (activeTool === 'arrow' || !activeTool) ? 'none' : 'auto',
      }}
    >
      {/* Dynamic SVG Spotlight Masking */}
      {activeTool === 'spotlight' && (
        <>
          <defs>
            <mask id="spotlight-mask">
              {/* Entire screen is white -> rendered opaque */}
              <rect width="100%" height="100%" fill="white" />
              {/* Black circle -> makes hole transparent */}
              <circle cx={mousePos.x} cy={mousePos.y} r="100" fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.85)"
            mask="url(#spotlight-mask)"
            style={{ pointerEvents: 'none' }}
          />
          {/* Faint circle outline for spotlight border */}
          <circle
            cx={mousePos.x}
            cy={mousePos.y}
            r="100"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            style={{ pointerEvents: 'none' }}
          />
        </>
      )}

      {/* Render existing saved paths */}
      {paths.map(renderPathToSvg)}

      {/* Render actively drawn path */}
      {renderActivePath()}

      {/* Render Laser continuous lines for a smooth glowing trail */}
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
              <g key={`laser-subpath-${segIdx}-${p}`}>
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

      {/* Custom drawing cursor elements */}
      {activeTool === 'laser' && (
        <circle
          cx={mousePos.x}
          cy={mousePos.y}
          r="6"
          fill="#ff0000"
          style={{
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 6px rgba(255,0,0,1))',
          }}
        />
      )}
    </svg>
  );
}
