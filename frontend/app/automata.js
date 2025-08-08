// app/components/AutomataVisualizer.jsx

"use client";
import { useState, useRef, useEffect } from "react";

// Color constants
const COLORS = {
  BLACK: '#232323',
  WHITE: '#eeeeee',
  GRAY: '#6b7280',
  ACCENT: '#3b82f6',
  FINAL: '#10b981'
};

export default function AutomataVisualizer({ 
  automaton, 
  positions, 
  onPositionChange,
  isLoading,
  error,
  onErrorDismiss 
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [hasAutoZoomed, setHasAutoZoomed] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    setHasAutoZoomed(false);
  }, [automaton]);

  useEffect(() => {
    if (!automaton || !positions || !svgRef.current || Object.keys(positions).length === 0 || hasAutoZoomed) {
      return;
    }

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const coords = Object.values(positions);
    if (coords.length === 0) return;

    const padding = 100;
    const stateRadius = 45;
    const minX = Math.min(...coords.map(p => p.x)) - stateRadius - padding;
    const maxX = Math.max(...coords.map(p => p.x)) + stateRadius + padding;
    const minY = Math.min(...coords.map(p => p.y)) - stateRadius - padding;
    const maxY = Math.max(...coords.map(p => p.y)) + stateRadius + padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const optimalZoom = Math.min(scaleX, scaleY, 1);

    const contentFits = (minX >= 0 && maxX <= containerWidth) &&
                        (minY >= 0 && maxY <= containerHeight);
    
    if (!contentFits) {
      const centerX = (containerWidth - contentWidth * optimalZoom) / 2 - minX * optimalZoom;
      const centerY = (containerHeight - contentHeight * optimalZoom) / 2 - minY * optimalZoom;

      setZoom(optimalZoom);
      setPan({ x: centerX, y: centerY });
    }

    setHasAutoZoomed(true);
  }, [automaton, positions, hasAutoZoomed]);

  // Use useEffect to add event listeners with explicit passive: false
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
      
      const zoomFactor = newZoom / zoom;
      const newPanX = mouseX - (mouseX - pan.x) * zoomFactor;
      const newPanY = mouseY - (mouseY - pan.y) * zoomFactor;
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    const handleTouchStart = (e) => {
      if (e.target.closest('.state-group') || e.target.closest('.transition-group')) return;
      if (e.touches.length !== 1) return;
      e.preventDefault();
      setIsDragging(true);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      const deltaX = e.touches[0].clientX - lastPanPoint.x;
      const deltaY = e.touches[0].clientY - lastPanPoint.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    // Add event listeners with explicit passive: false
    svg.addEventListener('wheel', handleWheel, { passive: false });
    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd, { passive: false });
    svg.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      svg.removeEventListener('wheel', handleWheel);
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
      svg.removeEventListener('touchend', handleTouchEnd);
      svg.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [zoom, pan.x, pan.y, isDragging, lastPanPoint.x, lastPanPoint.y]);

  const handlePanStart = (e) => {
    if (e.target.closest('.state-group') || e.target.closest('.transition-group')) return;
    setIsDragging(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handlePanMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handlePanEnd = () => {
    setIsDragging(false);
  };

  const handleDrag = (e, state) => {
    const svg = e.target.closest('svg');
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;

    onPositionChange(state, { x, y });
  };

  const groupTransitions = (transitions) => {
    const grouped = {};
    
    Object.entries(transitions).forEach(([from, trans]) => {
      Object.entries(trans).forEach(([sym, targets]) => {
        targets.forEach((to) => {
          const key = `${from}-${to}`;
          if (!grouped[key]) {
            grouped[key] = {
              from,
              to: String(to),
              symbols: []
            };
          }
          grouped[key].symbols.push(sym);
        });
      });
    });
    
    return Object.values(grouped);
  };

  const renderSVG = () => {
    if (!automaton) return null;

    const radius = 45;
    const groupedTransitions = groupTransitions(automaton.transitions);
    const hasReverse = (from, to) =>
      groupedTransitions.some(t => t.from === to && t.to === from);

    return (
      <div
        style={{
          background: COLORS.WHITE,
          borderRadius: '8px',
          border: `1px solid ${COLORS.GRAY}`,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ backgroundColor: COLORS.WHITE }}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="10"
              refX="11"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 12 5, 0 10" fill={COLORS.BLACK} />
            </marker>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Transitions */}
            {groupedTransitions.map(({ from, to, symbols }, index) => {
              const fromPos = positions[from];
              const toPos = positions[to];
              if (!fromPos || !toPos) return null;

              const symbolText = symbols.map(s => s === "" ? "ε" : s).join(", ");
              
              if (from === to) {
                const angle = -Math.PI/2;
                const loopRadius = 35;
                const startX = fromPos.x + Math.cos(angle) * radius;
                const startY = fromPos.y + Math.sin(angle) * radius;
                const endX = fromPos.x + Math.cos(angle + 0.1) * radius;
                const endY = fromPos.y + Math.sin(angle + 0.1) * radius;
                const path = `M${startX} ${startY} A${loopRadius} ${loopRadius} 0 1 1 ${endX} ${endY}`;
                const labelX = fromPos.x;
                const labelY = fromPos.y - radius - loopRadius - 10;

                return (
                  <g key={`${from}-${to}-${index}`} className="transition-group">
                    <path d={path} fill="none" stroke={COLORS.BLACK} strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <text x={labelX} y={labelY} fontSize="14" fontWeight="900" fill={COLORS.BLACK} textAnchor="middle">
                      {symbolText}
                    </text>
                  </g>
                );
              }

              const dx = toPos.x - fromPos.x;
              const dy = toPos.y - fromPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const unitX = dx / distance;
              const unitY = dy / distance;
              const startX = fromPos.x + unitX * radius;
              const startY = fromPos.y + unitY * radius;
              const endX = toPos.x - unitX * radius;
              const endY = toPos.y - unitY * radius;

              let path, labelX, labelY;
              if (hasReverse(from, to)) {
                const refFrom = Math.min(parseInt(from), parseInt(to));
                const refTo = Math.max(parseInt(from), parseInt(to));
                const isForward = parseInt(from) === refFrom;

                const refDx = positions[refTo].x - positions[refFrom].x;
                const refDy = positions[refTo].y - positions[refFrom].y;
                const refDist = Math.sqrt(refDx ** 2 + refDy ** 2);
                const refUnitX = refDx / refDist;
                const refUnitY = refDy / refDist;
                const perpX = -refUnitY;
                const perpY = refUnitX;

                const curvature = isForward ? 80 : -80;
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const controlX = midX + perpX * curvature;
                const controlY = midY + perpY * curvature;

                path = `M${startX} ${startY} Q${controlX} ${controlY} ${endX} ${endY}`;
                labelX = controlX;
                labelY = controlY + (curvature > 0 ? -25 : 25);
              } else {
                path = `M${startX} ${startY} L${endX} ${endY}`;
                labelX = (startX + endX) / 2;
                labelY = (startY + endY) / 2 - 15;
              }

              return (
                <g key={`${from}-${to}-${index}`} className="transition-group">
                  <path d={path} fill="none" stroke={COLORS.BLACK} strokeWidth="2" markerEnd="url(#arrowhead)" />
                  <text x={labelX} y={labelY} fontSize="24" fontWeight="900" fill={COLORS.BLACK} textAnchor="middle" style={{ pointerEvents: 'none', fontFamily: 'Monaco, Consolas, monospace' }}>
                    {symbolText}
                  </text>
                </g>
              );
            })}

            {/* States */}
            {automaton.states.map((s) => {
              const id = String(s);
              const pos = positions[id];
              const isInitial = s === automaton.initial;
              const isFinal = s === automaton.final;
              if (!pos) return null;

              let fill = COLORS.WHITE;
              let strokeColor = COLORS.BLACK;
              if (isInitial) fill = COLORS.ACCENT;
              if (isFinal) fill = COLORS.FINAL;

              return (
                <g
                  key={id}
                  className="state-group"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const move = (ev) => handleDrag(ev, id);
                    const up = () => {
                      window.removeEventListener("mousemove", move);
                      window.removeEventListener("mouseup", up);
                    };
                    window.addEventListener("mousemove", move);
                    window.addEventListener("mouseup", up);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const move = (ev) => {
                      ev.preventDefault();
                      handleDrag(ev, id);
                    };
                    const up = (ev) => {
                      ev.preventDefault();
                      window.removeEventListener("touchmove", move);
                      window.removeEventListener("touchend", up);
                    };
                    window.addEventListener("touchmove", move, { passive: false });
                    window.addEventListener("touchend", up);
                  }}
                  style={{ cursor: 'grab', touchAction: 'none' }}
                >
                  <circle cx={pos.x} cy={pos.y} r={radius} fill={fill} stroke={strokeColor} strokeWidth="2" />
                  {isFinal && (
                    <circle cx={pos.x} cy={pos.y} r={radius - 8} fill="none" stroke={strokeColor} strokeWidth="2" />
                  )}
                  <text x={pos.x} y={pos.y + 6} textAnchor="middle" fontSize="24" fontWeight="900" fill={isFinal || isInitial ? COLORS.WHITE : COLORS.BLACK} style={{ pointerEvents: 'none', fontFamily: 'Monaco, Consolas, monospace' }}>
                    q{id}
                  </text>
                  {isInitial && (
                    <line x1={pos.x - 90} y1={pos.y} x2={pos.x - radius - 5} y2={pos.y} stroke={COLORS.BLACK} strokeWidth="2" markerEnd="url(#arrowhead)" />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    );
  };

  return (
    <>
      {renderSVG()}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            maxWidth: '300px',
            padding: '16px',
            backgroundColor: '#dc2626',
            borderRadius: '8px',
            color: COLORS.WHITE,
            fontWeight: '500',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer'
          }}
          onClick={onErrorDismiss}
          title="Click to dismiss"
        >
          {error}
        </div>
      )}
    </>
  );
}