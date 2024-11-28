import type { Visitor, XastElement, XastRoot } from '../lib/types.js';

export const name = 'rainbow';
export const description = 'converts path fills to rainbow gradients';

type Params = {
  gradientId?: string;
  type?: 'linear' | 'radial';
  stops?: { color: string; offset: string }[];
};

type Gradient = {
  type: 'element';
  name: 'linearGradient' | 'radialGradient';
  attributes: {
    id: string;
    gradientUnits: 'userSpaceOnUse';
    x1?: string;
    y1?: string;
    x2?: string;
    y2?: string;
    cx?: string;
    cy?: string;
    r?: string;
  };
  children: {
    type: 'element';
    name: 'stop';
    attributes: {
      offset: string;
      'stop-color': string;
    };
    children: [];
  }[];
};

/**
 * Converts path fills to rainbow gradients
 */
export const fn = (root: XastRoot, params: Params): Visitor => {
  const {
    gradientId = 'rainbowGradient',
    type = 'linear', // 'linear' or 'radial'
    stops = [
      { color: '#FF0000', offset: '0%' }, // Red
      { color: '#FF7F00', offset: '16.6%' }, // Orange
      { color: '#FFFF00', offset: '33.3%' }, // Yellow
      { color: '#00FF00', offset: '50%' }, // Green
      { color: '#0000FF', offset: '66.6%' }, // Blue
      { color: '#4B0082', offset: '83.3%' }, // Indigo
      { color: '#9400D3', offset: '100%' }, // Violet
    ],
  } = params;

  const ensureGradientDefs = (svg: XastElement) => {
    const _defs = svg.children.find(
      (child) => child.type === 'element' && child.name === 'defs',
    ) as XastElement | undefined;
    console.log(
      `%cantoinelog%c_defs`,
      `color:#fff;background:pink;`,
      `color:#000;background:#fcb8e3;border-radius:5px;font-weight:bold;padding:3px;margin-left:-2px;`,
      _defs,
    );

    const defs = _defs || {
      type: 'element',
      name: 'defs',
      attributes: {},
      children: [],
    };
    if (!_defs) svg.children.unshift(defs);

    // Check if gradient already exists
    const existingGradient =
      defs.type === 'element' &&
      defs?.children.find(
        (child) =>
          child.type === 'element' && child.attributes.id === gradientId,
      );

    if (!existingGradient) {
      const gradient: Gradient = {
        type: 'element',
        name: type === 'linear' ? 'linearGradient' : 'radialGradient',
        attributes: {
          id: gradientId,
          gradientUnits: 'userSpaceOnUse',
        },
        children: stops.map((stop) => ({
          type: 'element',
          name: 'stop',
          attributes: {
            offset: stop.offset,
            'stop-color': stop.color,
          },
          children: [],
        })),
      };

      // Add additional attributes based on gradient type
      if (type === 'linear') {
        gradient.attributes.x1 = '0%';
        gradient.attributes.y1 = '0%';
        gradient.attributes.x2 = '100%';
        gradient.attributes.y2 = '0%';
      } else {
        gradient.attributes.cx = '50%';
        gradient.attributes.cy = '50%';
        gradient.attributes.r = '50%';
      }

      defs.children.push(gradient);
    }
  };

  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root')
          ensureGradientDefs(node);

        if (node.name === 'path') {
          if (node.attributes.fill && node.attributes.fill !== 'none')
            node.attributes['data-original-fill'] = node.attributes.fill;
          node.attributes.fill = `url(#${gradientId})`;
        }
      },
    },
  };
};
