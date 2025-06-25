/// <reference types="@figma/plugin-typings" />

// Plugin main thread logic
figma.showUI(__html__, { 
  width: 320, 
  height: 600, // default height
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
  const selectedFrames = selection.filter((node: SceneNode) => 
    node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE'
  );
  
  const allFrames: Array<{name: string, id: string, type: string}> = selectedFrames.map((frame: SceneNode) => ({
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

async function generateSummaryFrame(result: CountResult) {
  // Create main container frame as vertical auto layout
  const summaryFrame = figma.createFrame();
  summaryFrame.name = "Screen Count Summary";
  summaryFrame.layoutMode = "VERTICAL";
  summaryFrame.primaryAxisSizingMode = "AUTO";
  summaryFrame.counterAxisSizingMode = "AUTO";
  summaryFrame.resize(800, 600);
  summaryFrame.fills = [{
    type: 'SOLID',
    color: { r: 0.98, g: 0.95, b: 0.87 } // Light cream background
  }];
  summaryFrame.cornerRadius = 16;
  summaryFrame.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offset: { x: 0, y: 4 },
    radius: 12,
    visible: true,
    blendMode: 'NORMAL'
  }];
  summaryFrame.paddingTop = 40;
  summaryFrame.paddingBottom = 40;
  summaryFrame.paddingLeft = 40;
  summaryFrame.paddingRight = 40;
  summaryFrame.itemSpacing = 24;

  // Create header section as horizontal auto layout
  const headerFrame = figma.createFrame();
  headerFrame.name = "Header";
  headerFrame.layoutMode = "HORIZONTAL";
  headerFrame.primaryAxisSizingMode = "AUTO";
  headerFrame.counterAxisSizingMode = "AUTO";
  headerFrame.itemSpacing = 24;
  headerFrame.paddingTop = 24;
  headerFrame.paddingBottom = 24;
  headerFrame.paddingLeft = 32;
  headerFrame.paddingRight = 32;
  headerFrame.fills = [{
    type: 'SOLID',
    color: { r: 1, g: 0.8, b: 0.4 } // Orange background
  }];
  headerFrame.cornerRadius = 12;

  // Create main title
  const titleText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  titleText.fontName = { family: "Inter", style: "Bold" };
  titleText.fontSize = 48;
  titleText.fills = [{
    type: 'SOLID',
    color: { r: 0.2, g: 0.3, b: 0.4 } // Dark blue-gray
  }];
  const screenCount = result.prefix && result.groupedCount !== undefined ? result.groupedCount : result.total;
  titleText.characters = `${screenCount} Screen${screenCount !== 1 ? 's' : ''}`;
  headerFrame.appendChild(titleText);

  // Create dev note
  const devNoteFrame = figma.createFrame();
  devNoteFrame.name = "Dev Note";
  devNoteFrame.layoutMode = "VERTICAL";
  devNoteFrame.primaryAxisSizingMode = "AUTO";
  devNoteFrame.counterAxisSizingMode = "AUTO";
  devNoteFrame.paddingTop = 12;
  devNoteFrame.paddingBottom = 12;
  devNoteFrame.paddingLeft = 16;
  devNoteFrame.paddingRight = 16;
  devNoteFrame.fills = [{
    type: 'SOLID',
    color: { r: 1, g: 0.9, b: 0.5 } // Lighter orange
  }];
  devNoteFrame.cornerRadius = 8;

  const devNoteText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  devNoteText.fontName = { family: "Inter", style: "Medium" };
  devNoteText.fontSize = 16;
  devNoteText.fills = [{
    type: 'SOLID',
    color: { r: 0.2, g: 0.3, b: 0.4 }
  }];
  devNoteText.characters = "👨‍💻 Dev Note";
  devNoteFrame.appendChild(devNoteText);
  headerFrame.appendChild(devNoteFrame);

  summaryFrame.appendChild(headerFrame);

headerFrame.layoutMode = "HORIZONTAL"; // or "HORIZONTAL" if you prefer row layout
headerFrame.primaryAxisSizingMode = "AUTO";
headerFrame.counterAxisSizingMode = "AUTO";
headerFrame.layoutGrow = 1;
headerFrame.resize(720, 120);

// ✅ Align content to the left
headerFrame.counterAxisAlignItems = "CENTER";


  // Create divider line
  const dividerLine = figma.createLine();
  dividerLine.resize(720, 0);
  dividerLine.strokes = [{
    type: 'SOLID',
    color: { r: 1, g: 0.8, b: 0.4 }
  }];
  dividerLine.strokeWeight = 3;
  summaryFrame.appendChild(dividerLine);

  // --- Create auto layout for content section ---
  const contentAutoLayout = figma.createFrame();
  contentAutoLayout.name = "Content AutoLayout";
  contentAutoLayout.layoutMode = "VERTICAL";
  contentAutoLayout.primaryAxisSizingMode = "AUTO";
  contentAutoLayout.counterAxisSizingMode = "AUTO";
  contentAutoLayout.itemSpacing = 16;
  contentAutoLayout.paddingTop = 0;
  contentAutoLayout.paddingBottom = 0;
  contentAutoLayout.paddingLeft = 0;
  contentAutoLayout.paddingRight = 0;
  contentAutoLayout.fills = [];
  summaryFrame.appendChild(contentAutoLayout);

  if (result.prefixGroups && result.prefixGroups.length > 0) {
    // Show grouped results
    for (const [index, group] of result.prefixGroups.entries()) {
      // Create a horizontal auto layout for group name and count
      const groupRow = figma.createFrame();
      groupRow.layoutMode = "HORIZONTAL";
      groupRow.primaryAxisSizingMode = "AUTO";
      groupRow.counterAxisSizingMode = "AUTO";
      groupRow.itemSpacing = 16;
      groupRow.fills = [];
      groupRow.paddingTop = 0;
      groupRow.paddingBottom = 0;
      groupRow.paddingLeft = 0;
      groupRow.paddingRight = 0;

      const groupText = figma.createText();
      groupText.fontName = { family: "Inter", style: "Medium" };
      groupText.fontSize = 32;
      groupText.fills = [{
        type: 'SOLID',
        color: { r: 0.2, g: 0.3, b: 0.4 }
      }];
      groupText.characters = `${index + 1}. ${group.prefix}`;
      groupRow.appendChild(groupText);

      const countText = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      countText.fontName = { family: "Inter", style: "Regular" };
      countText.fontSize = 32;
      countText.fills = [{
        type: 'SOLID',
        color: { r: 0.4, g: 0.5, b: 0.6 }
      }];
      countText.characters = `(${group.frames.length} frame${group.frames.length !== 1 ? 's' : ''})`;
      groupRow.appendChild(countText);

      contentAutoLayout.appendChild(groupRow);
    }
    // Add individual frames if any
    const groupedFrameIds = new Set(
      result.prefixGroups.flatMap(group => group.frames.map(f => f.id))
    );
    const individualFrames = result.matches.filter(frame => !groupedFrameIds.has(frame.id));
    for (const [index, frame] of individualFrames.entries()) {
      const frameText = figma.createText();
      frameText.fontName = { family: "Inter", style: "Medium" };
      frameText.fontSize = 32;
      frameText.fills = [{
        type: 'SOLID',
        color: { r: 0.2, g: 0.3, b: 0.4 }
      }];
      frameText.characters = `${result.prefixGroups!.length + index + 1}. ${frame.name}`;
      contentAutoLayout.appendChild(frameText);
    }
  } else {
    // Show simple list
    for (const [index, frame] of result.matches.entries()) {
      const frameText = figma.createText();
      frameText.fontName = { family: "Inter", style: "Medium" };
      frameText.fontSize = 32;
      frameText.fills = [{
        type: 'SOLID',
        color: { r: 0.2, g: 0.3, b: 0.4 }
      }];
      frameText.characters = `${index + 1}. ${frame.name}`;
      contentAutoLayout.appendChild(frameText);
    }
  }

  // Adjust frame height based on content (auto layout will handle sizing)
  summaryFrame.resize(800, summaryFrame.height);

  // Position the frame in the viewport
  const viewport = figma.viewport.center;
  summaryFrame.x = viewport.x - 400;
  summaryFrame.y = viewport.y - summaryFrame.height / 2;

  // Add to current page and select
  figma.currentPage.appendChild(summaryFrame);
  figma.currentPage.selection = [summaryFrame];
  figma.viewport.scrollAndZoomIntoView([summaryFrame]);

  return summaryFrame;
}

// Handle messages from UI
figma.ui.onmessage = (msg: any) => {
  if (msg.type === 'count-screens') {
    const result = countScreens(msg.prefix);
    figma.ui.postMessage({
      type: 'count-result',
      result
    });
  } else if (msg.type === 'generate-frame') {
    generateSummaryFrame(msg.result).then(() => {
      figma.ui.postMessage({
        type: 'frame-generated',
        success: true
      });
    }).catch((error) => {
      figma.ui.postMessage({
        type: 'frame-generated',
        success: false,
        error: error.message
      });
    });
  } else if (msg.type === 'select-frame') {
    // Find and select the frame using the async API
    figma.getNodeByIdAsync(msg.frameId).then((node: BaseNode | null) => {
      if (node && "visible" in node && "locked" in node) {
        // node is a SceneNode
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      }
    });
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};