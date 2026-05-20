// We use an invisible UI to handle the file download prompt
figma.showUI(__html__, { visible: false });

// A function to safely serialize the Figma node tree
// Figma nodes have circular references (like parent), so we only grab what we need.
function serializeNode(node) {
  const result = {
    id: node.id,
    name: node.name,
    type: node.type
  };

  // 0. Base Properties (Visibility, Opacity, Blend Mode, Export)
  if ('visible' in node && node.visible === false) result.visible = false;
  if ('opacity' in node && node.opacity < 1) result.opacity = node.opacity;
  if ('blendMode' in node && node.blendMode !== 'PASS_THROUGH' && node.blendMode !== 'NORMAL') result.blendMode = node.blendMode;
  if ('exportSettings' in node && node.exportSettings.length > 0) result.exportable = true;

  // 1. Basic Layout & Dimensions
  if ('x' in node) result.x = node.x;
  if ('y' in node) result.y = node.y;
  if ('width' in node) result.width = node.width;
  if ('height' in node) result.height = node.height;
  if ('rotation' in node && node.rotation !== 0) result.rotation = node.rotation;

  // 2. Auto-Layout & Constraints
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    result.layoutMode = node.layoutMode; // 'HORIZONTAL' or 'VERTICAL'
    result.primaryAxisAlignItems = node.primaryAxisAlignItems; // justify-content
    result.counterAxisAlignItems = node.counterAxisAlignItems; // align-items
    result.itemSpacing = node.itemSpacing; // gap
    result.paddingTop = node.paddingTop;
    result.paddingRight = node.paddingRight;
    result.paddingBottom = node.paddingBottom;
    result.paddingLeft = node.paddingLeft;
  }
  if ('layoutPositioning' in node) result.layoutPositioning = node.layoutPositioning;
  if ('layoutAlign' in node) result.layoutAlign = node.layoutAlign;
  if ('layoutGrow' in node) result.layoutGrow = node.layoutGrow;
  if ('constraints' in node) result.constraints = node.constraints;

  // 3. Borders & Radii
  if ('cornerRadius' in node && node.cornerRadius !== 0) {
    result.cornerRadius = node.cornerRadius;
  } else if ('topLeftRadius' in node) {
    result.radii = {
      tl: node.topLeftRadius,
      tr: node.topRightRadius,
      br: node.bottomRightRadius,
      bl: node.bottomLeftRadius
    };
  }

  // 4. Strokes (Borders)
  if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    result.strokeWeight = node.strokeWeight;
    result.strokes = node.strokes.map(stroke => {
      if (stroke.type === 'SOLID' && stroke.color) {
        return {
          type: stroke.type,
          r: Math.round(stroke.color.r * 255),
          g: Math.round(stroke.color.g * 255),
          b: Math.round(stroke.color.b * 255),
          a: stroke.opacity !== undefined ? stroke.opacity : 1
        };
      }
      return { type: stroke.type };
    });
  }

  // 5. Typography
  if (node.type === 'TEXT') {
    if ('characters' in node) result.characters = node.characters;
    if ('fontSize' in node) result.fontSize = node.fontSize;
    if ('fontName' in node) {
      if (typeof node.fontName !== 'symbol') {
        result.fontFamily = node.fontName.family;
        result.fontStyle = node.fontName.style;
      } else {
        result.fontFamily = 'MIXED';
      }
    }
    if ('fontWeight' in node) result.fontWeight = node.fontWeight;
    if ('letterSpacing' in node) {
      if (typeof node.letterSpacing !== 'symbol') result.letterSpacing = node.letterSpacing;
    }
    if ('lineHeight' in node) {
      if (typeof node.lineHeight === 'symbol') {
        result.lineHeight = 'MIXED';
      } else if (node.lineHeight.value !== undefined) {
        result.lineHeight = node.lineHeight.value;
      }
    }
    if ('textAlignHorizontal' in node) result.textAlignHorizontal = node.textAlignHorizontal;
    if ('textAlignVertical' in node) result.textAlignVertical = node.textAlignVertical;
    if ('textDecoration' in node && typeof node.textDecoration !== 'symbol' && node.textDecoration !== 'NONE') result.textDecoration = node.textDecoration;
    if ('textAutoResize' in node) result.textAutoResize = node.textAutoResize;
  }

  // 6. Fills (Background Colors)
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    result.fills = node.fills.map(fill => {
      if (fill.type === 'SOLID' && fill.color) {
        return {
          type: fill.type,
          r: Math.round(fill.color.r * 255),
          g: Math.round(fill.color.g * 255),
          b: Math.round(fill.color.b * 255),
          a: fill.opacity !== undefined ? fill.opacity : 1
        };
      }
      if (fill.type.startsWith('GRADIENT') && fill.gradientStops) {
        return {
          type: fill.type,
          gradientStops: fill.gradientStops.map(stop => ({
            position: stop.position,
            r: Math.round(stop.color.r * 255),
            g: Math.round(stop.color.g * 255),
            b: Math.round(stop.color.b * 255),
            a: stop.color.a
          }))
        };
      }
      if (fill.type === 'IMAGE') {
        return { type: fill.type, scaleMode: fill.scaleMode };
      }
      return { type: fill.type };
    });
  }

  // 7. Effects (Shadows, Blurs)
  if ('effects' in node && Array.isArray(node.effects) && node.effects.length > 0) {
    result.effects = node.effects.map(effect => {
      if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
        return {
          type: effect.type,
          color: effect.color ? {
            r: Math.round(effect.color.r * 255),
            g: Math.round(effect.color.g * 255),
            b: Math.round(effect.color.b * 255),
            a: effect.color.a
          } : null,
          offset: effect.offset,
          radius: effect.radius,
          spread: effect.spread
        }
      }
      return { type: effect.type, radius: effect.radius }; // Covers layer/background blurs
    });
  }

  // 8. Component & Vector Info
  if (node.type === 'INSTANCE') {
    if (node.mainComponent) result.mainComponentName = node.mainComponent.name;
    if ('componentProperties' in node) result.componentProperties = node.componentProperties;
  } else if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    if ('componentPropertyDefinitions' in node) result.componentPropertyDefinitions = node.componentPropertyDefinitions;
  }

  // Identify Vector Nodes
  if (['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'ELLIPSE', 'POLYGON'].includes(node.type)) {
    result.isVector = true;
  }

  // Recursively extract children
  if ('children' in node) {
    result.children = node.children.map(serializeNode);
  }

  return result;
}

// Start extraction from the current page or selection
try {
  let targetNodes = [];
  let documentName = figma.root.name;

  // Check if the user has specific elements selected
  if (figma.currentPage.selection.length > 0) {
    targetNodes = [...figma.currentPage.selection];

    // If only one item is selected, name the file after that item
    if (targetNodes.length === 1) {
      documentName = targetNodes[0].name;
    } else {
      documentName = "selected_nodes";
    }
  } else {
    // Fall back to extracting the entire page if nothing is selected
    targetNodes = [figma.currentPage];
  }

  // Serialize the targeted nodes
  const extractedData = targetNodes.map(serializeNode);

  // If we only extracted one node (like the whole page or one specific item), don't wrap it in an array
  const finalData = extractedData.length === 1 ? extractedData[0] : extractedData;

  // Remove figma.mixed symbols before sending to UI
  function sanitizeSymbols(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'symbol') return 'MIXED';
    if (Array.isArray(obj)) return obj.map(sanitizeSymbols);
    if (typeof obj === 'object') {
      const newObj = {};
      for (const key in obj) {
        newObj[key] = sanitizeSymbols(obj[key]);
      }
      return newObj;
    }
    return obj;
  }

  const safeData = sanitizeSymbols(finalData);

  // Send the data to our invisible UI window to trigger the download
  figma.ui.postMessage({ type: 'export', data: safeData, name: documentName });
} catch (error) {
  console.error("Extraction error: ", error);
  // Send the actual error message to the user interface
  figma.closePlugin(`❌ Error extracting JSON: ${error.message}`);
}

// Listen for the UI telling us the download started
figma.ui.onmessage = msg => {
  if (msg.type === 'done') {
    figma.closePlugin("JSON Extracted.");
  }
};
