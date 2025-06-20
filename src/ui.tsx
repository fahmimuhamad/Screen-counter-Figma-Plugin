import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Hash, Frame, Eye, MousePointer } from 'lucide-react';
import './ui.css';

interface FrameInfo {
  name: string;
  id: string;
  type: string;
}

interface PrefixGroup {
  prefix: string;
  frames: FrameInfo[];
}

interface DisplayGroup {
  groupName: string;
  frames: FrameInfo[];
  count: number;
  isGroup: boolean;
}

interface CountResult {
  total: number;
  filtered: number;
  prefix: string;
  matches: FrameInfo[];
  groupedCount?: number;
  prefixGroups?: PrefixGroup[];
}

function App() {
  const [prefix, setPrefix] = useState('');
  const [result, setResult] = useState<CountResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCount = () => {
    setIsLoading(true);
    parent.postMessage(
      { 
        pluginMessage: { 
          type: 'count-screens', 
          prefix: prefix.trim() 
        } 
      }, 
      '*'
    );
  };

  const handleSelectFrame = (frameId: string) => {
    parent.postMessage(
      { 
        pluginMessage: { 
          type: 'select-frame', 
          frameId 
        } 
      }, 
      '*'
    );
  };

  const handleReset = () => {
    setResult(null);
    setPrefix('');
    setIsLoading(false);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage;
      if (message && message.type === 'count-result') {
        setResult(message.result);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Group frames for display when prefixes are used
  const getDisplayGroups = (): DisplayGroup[] => {
    if (!result || !result.prefix || !result.prefixGroups) return [];
    
    const groups: DisplayGroup[] = [];
    
    // Add prefix groups
    result.prefixGroups.forEach(group => {
      groups.push({
        groupName: group.prefix,
        frames: group.frames,
        count: group.frames.length,
        isGroup: true
      });
    });
    
    // Find individual frames (not in any prefix group)
    const groupedFrameIds = new Set(
      result.prefixGroups.flatMap(group => group.frames.map(f => f.id))
    );
    
    const individualFrames = result.matches.filter(frame => !groupedFrameIds.has(frame.id));
    
    // Add individual frames as separate "groups" - use the frame name prefix for grouping
    individualFrames.forEach(frame => {
      // For individual frames, use the first part of the name as the group name
      const framePrefixes = result.prefix.split(',').map(p => p.trim());
      let frameGroupName = frame.name;
      
      // Try to find a meaningful prefix from the frame name
      for (const prefix of framePrefixes) {
        if (frame.name.toLowerCase().startsWith(prefix.toLowerCase())) {
          frameGroupName = prefix;
          break;
        }
      }
      
      // If no prefix match, use the first word or the full name if it's short
      if (frameGroupName === frame.name) {
        const words = frame.name.split(/\s+/);
        frameGroupName = words.length > 1 && words[0].length > 2 ? words[0] : frame.name;
      }
      
      groups.push({
        groupName: frameGroupName,
        frames: [frame],
        count: 1,
        isGroup: false
      });
    });
    
    return groups;
  };

  const displayGroups = result?.prefix ? getDisplayGroups() : [];

  return (
    <div className="plugin-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <Hash className="w-5 h-5 text-blue-500" />
          <h1 className="header-title">Screen Counter</h1>
        </div>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-group">
          <label className="input-label">
            Screen Group Prefixes (optional)
          </label>
          <div className="input-wrapper">
            <Search className="input-icon" />
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g., Daftar Pesanan,Daftar Produk,Dashboard"
              className="input-field"
              onKeyDown={(e) => e.key === 'Enter' && handleCount()}
            />
          </div>
          <p className="input-help">
            Use commas to separate multiple prefixes.
          </p>
        </div>

        <button
          onClick={handleCount}
          disabled={isLoading}
          className="count-button"
        >
          {isLoading ? 'Counting...' : 'Count Selected Screens'}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="results-section">
          <div className="results-header">
            <h2 className="results-title">Results</h2>
            <button
              onClick={handleReset}
              className="ml-3 text-xs text-red-500 hover:underline focus:outline-none"
              type="button"
            >
              Reset
            </button>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card primary">
              <div className="summary-number">
                {result.prefix && result.groupedCount !== undefined ? result.groupedCount : result.total}
              </div>
              <div className="summary-label">
                {result.prefix ? 'Unique Screens' : 'Selected Screens'}
              </div>
            </div>
            
            {result.prefix && result.groupedCount !== undefined && (
              <div className="summary-card secondary">
                <div className="summary-number">{result.total}</div>
                <div className="summary-label">Total Frames</div>
              </div>
            )}
          </div>

          {/* Prefix Info */}
          {result.prefix && (
            <div className="prefix-info">
              <span className="prefix-label">Grouping prefixes:</span>
              <code className="prefix-value">"{result.prefix}"</code>
            </div>
          )}

          {/* Frame Groups or List */}
          {result.matches.length > 0 && (
            <div className="frame-list">
              <h3 className="frame-list-title">
                <Frame className="w-4 h-4" />
                {result.prefix ? 'Screen Groups' : 'Selected Frames'}
              </h3>
              
              {result.prefix && displayGroups.length > 0 ? (
                <div className="frame-groups">
                  {displayGroups.map((group, index) => (
                    <div key={`${group.groupName}-${index}`} className="frame-group">
                      <div className="group-header">
                        <span className="group-name">
                          {group.isGroup ? `${group.groupName} Group` : group.groupName}
                        </span>
                        <span className="group-count">
                          {group.isGroup ? `(${group.count} frames)` : '(1 screen)'}
                        </span>
                      </div>
                      <div className="frame-items">
                        {group.frames.map((frame: FrameInfo) => (
                          <div
                            key={frame.id}
                            onClick={() => handleSelectFrame(frame.id)}
                            className="frame-item"
                          >
                            <div className="frame-info">
                              <span className="frame-name">{frame.name}</span>
                            </div>
                            <div className="frame-actions">
                              <Eye className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="frame-items">
                  {result.matches.map((frame: FrameInfo) => (
                    <div
                      key={frame.id}
                      onClick={() => handleSelectFrame(frame.id)}
                      className="frame-item"
                    >
                      <div className="frame-info">
                        <span className="frame-name">{frame.name}</span>
                      </div>
                      <div className="frame-actions">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {result.matches.length === 0 && result.prefix && (
            <div className="no-results">
              <Frame className="w-8 h-8 text-gray-300 mb-2" />
              <p className="no-results-text">
                No frames found matching prefixes "{result.prefix}"
              </p>
              <p className="no-results-subtext">
                Try different prefixes or leave it empty to count all selected frames.
              </p>
            </div>
          )}

          {/* No Selection */}
          {result.total === 0 && (
            <div className="no-results">
              <MousePointer className="w-8 h-8 text-gray-300 mb-2" />
              <p className="no-results-text">
                No frames selected
              </p>
              <p className="no-results-subtext">
                Please select some frames in Figma and try again.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!result && !isLoading && (
        <div className="empty-state">
          <Frame className="w-8 h-8 text-gray-300 mb-2" />
          <p className="empty-state-subtext">
          Please select some frames
          </p>
        </div>
      )}

      {/* Copyright Footer */}
      <div className="copyright-footer text-xs text-gray-400 pb-6 text-center">
        © Mengantar '25
      </div>
    </div>
  );
}

// Mount the React app
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}