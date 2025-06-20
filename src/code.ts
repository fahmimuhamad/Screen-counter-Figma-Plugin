// Plugin main thread logic
figma.showUI(__html__, { 
  width: 320, 
  height: 800, // default height
  themeColors: true
});

interface CountResult {
  total: number;
  filtered: number;
  prefix: string;
  matches: Array<{
    name: string;
    id: string;
    type: string;
  }>;
  groupedCount?: number;
  prefixGroups?: Array<{
    prefix: string;
    frames: Array<{name: string, id: string, type: string}>;
  }>;
}

function countScreens(prefixInput?: string): CountResult {
  const selection = figma.currentPage.selection;
  
  // Filter to only get top-level frames from selection (no nested frames)
  const selectedFrames = selection.filter(node => 
    node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE'
  );
  
  const allFrames: Array<{name: string, id: string, type: string}> = selectedFrames.map(frame => ({
    name: frame.name,
    id: frame.id,
    type: frame.type
  }));
  
  let matchingFrames: Array<{name: string, id: string, type: string}> = [];
  let groupedCount = 0;
  let prefixGroups: Array<{prefix: string, frames: Array<{name: string, id: string, type: string}>}> = [];
  
  if (prefixInput && prefixInput.trim()) {
    // Parse multiple prefixes separated by commas
    const prefixes = prefixInput.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    // Create groups for each prefix
    const prefixGroupsMap = new Map<string, Array<{name: string, id: string, type: string}>>();
    const nonMatchingFrames: Array<{name: string, id: string, type: string}> = [];
    
    // Initialize groups for each prefix
    prefixes.forEach(prefix => {
      prefixGroupsMap.set(prefix, []);
    });
    
    // Categorize frames
    allFrames.forEach(frame => {
      let matched = false;
      
      // Check if frame name starts with any of the prefixes (case-insensitive)
      for (const prefix of prefixes) {
        if (frame.name.toLowerCase().startsWith(prefix.toLowerCase())) {
          prefixGroupsMap.get(prefix)!.push(frame);
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        nonMatchingFrames.push(frame);
      }
    });
    
    // Build prefix groups for display
    prefixes.forEach(prefix => {
      const frames = prefixGroupsMap.get(prefix)!;
      if (frames.length > 0) {
        prefixGroups.push({
          prefix: prefix,
          frames: frames
        });
      }
    });
    
    // Calculate grouped count: 1 for each prefix group that has frames + 1 for each non-matching frame
    const activeGroups = prefixGroups.length;
    groupedCount = activeGroups + nonMatchingFrames.length;
    
    // For display purposes, show all frames (grouped and individual)
    const allGroupedFrames = prefixGroups.flatMap(group => group.frames);
    matchingFrames = [...allGroupedFrames, ...nonMatchingFrames];
  } else {
    matchingFrames = allFrames;
  }
  
  return {
    total: allFrames.length,
    filtered: matchingFrames.length,
    prefix: prefixInput || '',
    matches: matchingFrames,
    groupedCount: prefixInput ? groupedCount : undefined,
    prefixGroups: prefixInput ? prefixGroups : undefined
  };
}

// Handle messages from UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'count-screens') {
    const result = countScreens(msg.prefix);
    figma.ui.postMessage({
      type: 'count-result',
      result
    });
  } else if (msg.type === 'select-frame') {
    // Find and select the frame using the async API
    figma.getNodeByIdAsync(msg.frameId).then((node) => {
      if (node) {
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      }
    });
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};