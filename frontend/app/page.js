"use client";
import { useState, useEffect } from "react";
import AutomataVisualizer from "./automata";

// Color constants
const COLORS = {
  BLACK: '#232323',
  WHITE: '#eeeeee',
  GRAY: '#6b7280',
  ACCENT: '#3b82f6',
  FINAL: '#10b981'
};

export default function Home() {
  const [regex, setRegex] = useState("");
  const [automaton, setAutomaton] = useState(null);
  const [positions, setPositions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Default automaton that accepts epsilon
  const defaultAutomaton = {
    initial: 0,
    final: 0,
    states: [0],
    transitions: {}
  };

  // Load default automaton on component mount
  useEffect(() => {
    const states = defaultAutomaton.states.map(String);
    const newPos = layoutStates(states);
    setAutomaton(defaultAutomaton);
    setPositions(newPos);
  }, []);

  // Assign initial positions in a circular layout for better visualization
  const layoutStates = (states) => {
    const centerX = 400;
    const centerY = 300;
    const radius = Math.max(150, states.length * 30);
    const pos = {};

    if (states.length === 1) {
      pos[states[0]] = { x: centerX, y: centerY };
      return pos;
    }

    states.forEach((s, i) => {
      const angle = (2 * Math.PI * i) / states.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      pos[s] = { x, y };
    });

    return pos;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!regex.trim()) {
      return;
    }

    setIsLoading(true);
    setError("");

    // Use actual API call
    fetch("https://automata-j8vc.onrender.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regex }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const states = data.states.map(String);
        const newPos = layoutStates(states);
        setAutomaton(data);
        setPositions(newPos);
      })
      .catch(err => {
        console.error("Error fetching automaton:", err);
        setError("Error generating automaton. Please check your regex syntax.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handlePositionChange = (state, newPosition) => {
    setPositions((prev) => ({
      ...prev,
      [state]: newPosition,
    }));
  };

  const handleErrorDismiss = () => {
    setError("");
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.BLACK,
      fontFamily: 'Monaco, Consolas, monospace',
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gridTemplateRows: 'auto 1fr auto',
      gridTemplateAreas: `
        "header automata"
        "states automata"
        "states automata"
      `,
      gap: '1.5vw',
      padding: '1.5vw'
    }}>
      
      <div style={{
        gridArea: 'header',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5vw',
        animation: 'fadeInDown 0.8s ease-out'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '2.5vw',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1vh',
            margin: 0,
            transition: 'transform 0.2s ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}>
            Regex To Finite Automata
          </h1>
        </div>


        <div style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}>
          <div style={{ marginBottom: '1vh' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                placeholder="Enter regex"
                style={{
                  width: '100%',
                  padding: '1vw 1.5vw',
                  fontSize: '1.125rem',
                  border: `2px solid ${COLORS.BLACK}`,
                  borderRadius: '0.5vw',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Monaco, Consolas, monospace',
                  boxSizing: 'border-box',
                  backgroundColor: `${COLORS.WHITE}`,
                  color: `${COLORS.BLACK}`
                }}
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = `0 4px 12px rgba(59, 130, 246, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1vw 1.5vw',
              background: isLoading ? COLORS.BLACK : COLORS.BLACK,
              color: COLORS.WHITE,
              fontWeight: '500',
              borderRadius: '0.5vw',
              border: `2px solid ${COLORS.WHITE}`,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease',
              fontFamily: 'Monaco, Consolas, monospace'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.background = COLORS.WHITE;
                e.target.style.color = COLORS.BLACK;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.background = COLORS.BLACK;
                e.target.style.color = COLORS.WHITE;
              }
            }}
          >
            {isLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5vw'
              }}>
                <div style={{
                  width: '1vw',
                  height: '1vw',
                  borderRadius: '8px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Generating...
              </div>
            ) : (
              'Generate NFA'
            )}
          </button>
        </div>
      </div>

      <div style={{
        gridArea: 'states',
        display: 'flex',
        flexDirection: 'column',
        marginTop:"5vh",
        gap: '16px',
        animation: 'slideInLeft 0.8s ease-out 0.4s both'
      }}>
        {automaton && (
          <>
            <div style={{
              backgroundColor: COLORS.WHITE,
              borderRadius: '0.5vw',
              padding: '1vw',
              border: `1px solid ${COLORS.GRAY}`,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}
            >
              <h4 style={{
                fontWeight: '500',
                color: COLORS.BLACK,
                marginBottom: '0.5vh',
                margin: '0 0 0.5vh 0',
                fontSize: '1rem'
              }}>States</h4>
              <p style={{
                color: COLORS.GRAY,
                margin: 0
              }}>{automaton.states.length} total states</p>
            </div>
            
            <div style={{
              backgroundColor: COLORS.WHITE,
              borderRadius: '0.5vw',
              padding: '1vw',
              border: `1px solid ${COLORS.GRAY}`,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}>
              <h4 style={{
                fontWeight: '500',
                color: COLORS.BLACK,
                marginBottom: '0.5vh',
                margin: '0 0 0.5vh 0',
                fontSize: '1rem'
              }}>Initial</h4>
              <p style={{
                color: COLORS.GRAY,
                margin: 0
              }}>State q{automaton.initial}</p>
            </div>
            
            <div style={{
              backgroundColor: COLORS.WHITE,
              borderRadius: '0.5vw',
              padding: '1vw',
              border: `1px solid ${COLORS.GRAY}`,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}
            >
              <h4 style={{
                fontWeight: '500',
                color: COLORS.BLACK,
                marginBottom: '0.5vh',
                margin: '0 0 0.5vh 0',
                fontSize: '1rem'
              }}>Final</h4>
              <p style={{
                color: COLORS.GRAY,
                margin: 0
              }}>State q{automaton.final}</p>
            </div>
          </>
        )}
      </div>

      <div 
        style={{
          gridArea: 'automata',
          minHeight: '60vh',
          position: 'relative',
          animation: 'fadeIn 1s ease-out 0.5s both'
        }}
        onWheel={(e) => e.preventDefault()}
      >
        <AutomataVisualizer 
          automaton={automaton}
          positions={positions}
          onPositionChange={handlePositionChange}
          isLoading={isLoading}
          error={error}
          onErrorDismiss={handleErrorDismiss}
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @media (max-width: 1024px) {
          div[style*="grid-template-areas"] {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
            grid-template-areas: 
              "header"
              "automata" !important;
          }
          
          div[style*="grid-area: states"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}