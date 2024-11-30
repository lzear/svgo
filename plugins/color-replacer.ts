import type { Visitor, XastChild, XastRoot } from '../lib/types.js';

export const name = 'colorReplacer';
export const description =
  'replaces all colors with either random or evenly spaced colors';

type Params = {
  mode: 'random' | 'spectrum';
  saturation?: number; // 0-100, default 70
  lightness?: number; // 0-100, default 50
  startHue?: number; // 0-360, default 0
  seed?: number; // for random mode
};

// Color attributes to look for
const colorAttributes = ['fill', 'stroke', 'stop-color', 'color'];

// Helper to generate random number between 0 and 1
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Convert HSL to hex
const hslToHex = (h: number, s: number, l: number): string => {
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hueToRgb(p, q, h + 1 / 3);
  const g = hueToRgb(p, q, h);
  const b = hueToRgb(p, q, h - 1 / 3);

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const fn = (root: XastRoot, params: Params): Visitor => {
  const {
    mode = 'spectrum',
    saturation = 70,
    lightness = 50,
    startHue = 0,
    seed = Date.now(),
  } = params;

  // First pass: find all unique colors and their positions
  const colorMap = new Map<string, string[]>();
  let uniqueColorCount = 0;

  const countVisitor: Visitor = {
    element: {
      enter: (node) => {
        if (!node.attributes) return;

        for (const attr of colorAttributes) {
          const value = node.attributes[attr];
          if (
            value &&
            value !== 'none' &&
            value !== 'transparent' &&
            !value.startsWith('url(')
          ) {
            const key = `${value.toLowerCase()}_${attr}`;
            if (!colorMap.has(key)) {
              colorMap.set(key, []);
              uniqueColorCount++;
            }
            colorMap.get(key)?.push(`${(node as any).id || ''}_${attr}`);
          }
        }
      },
    },
  };

  // Count unique colors
  const processNode = (node: XastChild) => {
    if (node.type === 'element') {
      countVisitor.element?.enter?.(node, root);
      if (node.children) {
        node.children.forEach(processNode);
      }
    }
  };
  root.children.forEach(processNode);

  // Generate new colors
  const newColors = new Map<string, string>();
  let currentIndex = 0;
  let currentSeed = seed;

  colorMap.forEach((_, key) => {
    let newColor: string;
    if (mode === 'random') {
      // Generate random hue using seed
      const hue = seededRandom(currentSeed++) * 360;
      newColor = hslToHex(hue / 360, saturation / 100, lightness / 100);
    } else {
      // Generate evenly spaced color
      const hue = (startHue + (360 * currentIndex) / uniqueColorCount) % 360;
      newColor = hslToHex(hue / 360, saturation / 100, lightness / 100);
    }
    newColors.set(key, newColor);
    currentIndex++;
  });

  // Second pass: replace colors
  return {
    element: {
      enter: (node) => {
        if (!node.attributes) return;

        for (const attr of colorAttributes) {
          const value = node.attributes[attr];
          if (
            value &&
            value !== 'none' &&
            value !== 'transparent' &&
            !value.startsWith('url(')
          ) {
            const key = `${value.toLowerCase()}_${attr}`;
            // Store original color
            node.attributes[`data-original-${attr}`] = value;
            // Replace with new color
            node.attributes[attr] = newColors.get(key) || value;
          }
        }
      },
    },
  };
};
