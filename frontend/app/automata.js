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

  // Reset auto-zoom flag when automaton changes (new automata loaded)
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

    // Get all position coordinates
    const coords = Object.values(positions);
    if (coords.length === 0) return;

    // Calculate bounding box of all states (with some padding for state radius)
    const padding = 100; // Extra padding around states
    const stateRadius = 45;
    const minX = Math.min(...coords.map(p => p.x)) - stateRadius - padding;
    const maxX = Math.max(...coords.map(p => p.x)) + stateRadius + padding;
    const minY = Math.min(...coords.map(p => p.y)) - stateRadius - padding;
    const maxY = Math.max(...coords.map(p => p.y)) + stateRadius + padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate required zoom to fit content
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const optimalZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1x

    // Only auto-zoom if content doesn't fit
    const currentContentFitsX = (minX >= 0 && maxX <= containerWidth);
    const currentContentFitsY = (minY >= 0 && maxY <= containerHeight);
    const contentFits = currentContentFitsX && currentContentFitsY;
    
    if (!contentFits) {
      // Center the content
      const centerX = (containerWidth - contentWidth * optimalZoom) / 2 - minX * optimalZoom;
      const centerY = (containerHeight - contentHeight * optimalZoom) / 2 - minY * optimalZoom;

      setZoom(optimalZoom);
      setPan({ x: centerX, y: centerY });
    }

    // Mark that we've performed the initial auto-zoom
    setHasAutoZoomed(true);
  }, [automaton, positions, hasAutoZoomed]);

  // Handle zoom with mouse wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
    
    // Zoom towards mouse position
    const zoomFactor = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * zoomFactor;
    const newPanY = mouseY - (mouseY - pan.y) * zoomFactor;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Handle pan start
  const handlePanStart = (e) => {
    if (e.target.closest('.state-group') || e.target.closest('.transition-group')) return;
    setIsDragging(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  // Handle pan move
  const handlePanMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  // Handle pan end
  const handlePanEnd = () => {
    setIsDragging(false);
  };

  // Drag handler with smooth movement
  const handleDrag = (e, state) => {
    const svg = e.target.closest('svg');
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    onPositionChange(state, { x, y });
  };

  // Group transitions between same states
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
    
    // Simple approach: just check if there's a reverse transition for each transition
    const hasReverse = (from, to) => {
      return groupedTransitions.some(t => t.from === to && t.to === from);
    };

    return (
      <div 
        style={{
          background: COLORS.WHITE,
          borderRadius: '8px',
          border: `1px solid ${COLORS.GRAY}`,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          width: '100%',
          height: '100%'
        }}
        onWheel={(e) => e.preventDefault()}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ backgroundColor: COLORS.WHITE }}
          onWheel={handleWheel}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          <defs>
            {/* Simple arrowhead */}
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="10"
              refX="11"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon 
                points="0 0, 12 5, 0 10" 
                fill={COLORS.BLACK}
              />
            </marker>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Draw each transition */}
            {groupedTransitions.map((transition, index) => {
              const { from, to, symbols } = transition;
              const fromPos = positions[from];
              const toPos = positions[to];
              
              if (!fromPos || !toPos) return null;

              // Self-loop
              if (from === to) {
                const loopRadius = 35;
                const angle = -Math.PI/2;
                const startX = fromPos.x + Math.cos(angle) * radius;
                const startY = fromPos.y + Math.sin(angle) * radius;
                const endX = fromPos.x + Math.cos(angle + 0.1) * radius;
                const endY = fromPos.y + Math.sin(angle + 0.1) * radius;
                
                const path = `M${startX} ${startY} A${loopRadius} ${loopRadius} 0 1 1 ${endX} ${endY}`;
                const labelX = fromPos.x + Math.cos(angle + Math.PI/8) * (radius + loopRadius + 20);
                const labelY = fromPos.y + Math.sin(angle + Math.PI/8) * (radius + loopRadius + 20);

                const symbolText = symbols.map(s => s === "" ? "ε" : s).join(", ");

                return (
                  <g key={`${from}-${to}-${index}`} className="transition-group">
                    <path
                      d={path}
                      fill="none"
                      stroke={COLORS.BLACK}
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      fontSize="14"
                      fontWeight="900"
                      fill={COLORS.BLACK}
                      textAnchor="middle"
                    >
                      {symbolText}
                    </text>
                  </g>
                );
              }

              // Calculate line between states
              const dx = toPos.x - fromPos.x;
              const dy = toPos.y - fromPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const unitX = dx / distance;
              const unitY = dy / distance;
              
              const startX = fromPos.x + unitX * radius;
              const startY = fromPos.y + unitY * radius;
              const endX = toPos.x - unitX * radius;
              const endY = toPos.y - unitY * radius;

              // SIMPLE FIX: If there's a reverse transition, curve this one
              let path, labelX, labelY;
              if (hasReverse(from, to)) {
                // The KEY insight: we need to curve based on the SAME reference direction
                // Always calculate as if going from smaller to larger state ID
                const refFrom = Math.min(parseInt(from), parseInt(to));
                const refTo = Math.max(parseInt(from), parseInt(to));
                const isForwardDirection = (parseInt(from) === refFrom);
                
                // Use consistent reference positions
                const refFromPos = positions[refFrom];
                const refToPos = positions[refTo];
                const refDx = refToPos.x - refFromPos.x;
                const refDy = refToPos.y - refFromPos.y;
                const refDistance = Math.sqrt(refDx * refDx + refDy * refDy);
                const refUnitX = refDx / refDistance;
                const refUnitY = refDy / refDistance;
                const refPerpX = -refUnitY; // Always same perpendicular direction
                const refPerpY = refUnitX;
                
                // Curve in opposite directions
                const curvature = isForwardDirection ? 80 : -80;
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const controlX = midX + refPerpX * curvature;
                const controlY = midY + refPerpY * curvature;
                
                path = `M${startX} ${startY} Q${controlX} ${controlY} ${endX} ${endY}`;
                labelX = controlX;
                labelY = controlY + (curvature > 0 ? -25 : 25);
              } else {
                // Straight line
                path = `M${startX} ${startY} L${endX} ${endY}`;
                labelX = (startX + endX) / 2;
                labelY = (startY + endY) / 2 - 15;
              }

              const symbolText = symbols.map(s => s === "" ? "ε" : s).join(", ");

              return (
                <g key={`${from}-${to}-${index}`} className="transition-group">
                  <path
                    d={path}
                    fill="none"
                    stroke={COLORS.BLACK}
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    fontSize="24"
                    fontWeight="900"
                    fill={COLORS.BLACK}
                    textAnchor="middle"
                    style={{
                      pointerEvents: 'none',
                      fontFamily: 'Monaco, Consolas, monospace'
                    }}
                  >
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
              if (isInitial && isFinal) {
                fill = COLORS.ACCENT;
                strokeColor = COLORS.BLACK;
              } else if (isInitial) {
                fill = COLORS.ACCENT;
                strokeColor = COLORS.BLACK;
              } else if (isFinal) {
                fill = COLORS.FINAL;
                strokeColor = COLORS.BLACK;
              }

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
                  style={{ cursor: 'grab' }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill={fill}
                    stroke={strokeColor}
                    strokeWidth="2"
                  />
                  {isFinal && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius - 8}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2"
                    />
                  )}
                  <text
                    x={pos.x}
                    y={pos.y + 6}
                    textAnchor="middle"
                    fontSize="24"
                    fontWeight="900"
                    fill={isFinal || isInitial ? COLORS.WHITE : COLORS.BLACK}
                    style={{
                      pointerEvents: 'none',
                      fontFamily: 'Monaco, Consolas, monospace'
                    }}
                  >
                    q{id}
                  </text>
                  {isInitial && (
                    <>
                      <line
                        x1={pos.x - 90}
                        y1={pos.y}
                        x2={pos.x - radius - 5}
                        y2={pos.y}
                        stroke={COLORS.BLACK}
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    </>
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
      
      {/* Floating Error Popup */}
      {error && (
        <div style={{
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