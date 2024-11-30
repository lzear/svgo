import type { Visitor, XastRoot } from '../lib/types.js';

export const name = 'colorReplacer';
export const description = 'replaces all colors random colors';

type Params = {
  mode: 'random' | 'spectrum';
  saturation?: number; // 0-100, default 70
  lightness?: number; // 0-100, default 50
  startHue?: number; // 0-360, default 0
  seed?: number; // for random mode
};

// Color attributes to look for
const colorAttributes = ['fill', 'stroke', 'stop-color', 'color'];

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

  // First pass: count total color attributes
  let totalColors = 0;

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
            totalColors++;
          }
        }
      },
    },
  };

  const processNode = (node: any) => {
    if (node.type === 'element') {
      countVisitor.element?.enter?.(node, root);
      if (node.children) {
        node.children.forEach(processNode);
      }
    }
  };
  root.children.forEach(processNode);

  // Generate colors
  let currentIndex = 0;
  const getNextColor = () => {
    if (mode === 'random') {
      const hue = (Math.sin(seed + currentIndex++) * 10000) % 360;
      return hslToHex(hue / 360, saturation / 100, lightness / 100);
    } else {
      const hue = (startHue + (360 * currentIndex++) / totalColors) % 360;
      return hslToHex(hue / 360, saturation / 100, lightness / 100);
    }
  };

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
            // Store original color
            node.attributes[`data-original-${attr}`] = value;
            // Replace with next color in sequence
            node.attributes[attr] = getNextColor();
          }
        }
      },
    },
  };
};
