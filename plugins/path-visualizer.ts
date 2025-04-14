import type { Visitor, XastRoot, XastElement } from '../lib/types.js';
import { type SVGCommand, SVGPathData } from 'svg-pathdata';
import { detachNodeFromParent, visitSkip } from '../lib/xast.js';

export const name = 'pathVisualizer';
export const description =
  'Replace paths by points and segments for visualization and analysis';

type Point = { x: number; y: number };
type Params = {
  /** Attributes for points (both control and end points) */
  pointAttr?: Record<string, string>;
  /** Attributes for path/lines */
  pathAttr?: Record<string, string>;
  /** shouldRemoveNonPathElements */
  shouldRemoveNonPathElements?: boolean;
};

const REMOVABLE_ELEMENTS = [
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'rect',
];

export const fn = (
  _root: XastRoot,
  {
    shouldRemoveNonPathElements = false,
    pointAttr = { r: '2', fill: 'blue' },
    pathAttr = { fill: 'none', stroke: '#555', 'stroke-width': '1' },
  }: Params,
): Visitor => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.attributes?.['data-path-visualized'] === 'true')
          return visitSkip;
        if (node.name !== 'path' || !node.attributes.d) {
          if (
            shouldRemoveNonPathElements &&
            parentNode &&
            parentNode.children &&
            REMOVABLE_ELEMENTS.includes(node.name)
          )
            detachNodeFromParent(node, parentNode);
          return;
        }
        try {
          const { d, ...attributes } = node.attributes;
          const pathData = new SVGPathData(node.attributes.d);
          const segments = pathData.toAbs().commands;
          const { endPoints, controlPoints } = extractPathPoints(segments);
          if (endPoints.length === 0) return;
          const group: XastElement = {
            type: 'element',
            name: 'g',
            attributes: { 'data-path-visualized': 'true' },
            children: [],
          };
          const linePath: XastElement = {
            type: 'element',
            name: 'polyline',
            attributes: {
              points: endPoints.map((p) => `${p.x},${p.y}`).join(' '),
              ...pathAttr,
              ...attributes,
            },
            children: [],
          };
          group.children.push(linePath);
          endPoints.forEach((point) => {
            const circle: XastElement = {
              type: 'element',
              name: 'circle',
              attributes: {
                cx: point.x.toString(),
                cy: point.y.toString(),
                class: 'end-point',
                ...pointAttr,
              },
              children: [],
            };
            group.children.push(circle);
          });
          controlPoints.forEach((point) => {
            const circle: XastElement = {
              type: 'element',
              name: 'circle',
              attributes: {
                cx: point.x.toString(),
                cy: point.y.toString(),
                class: 'control-point',
                ...pointAttr,
                fill: 'red',
              },
              children: [],
            };
            group.children.push(circle);
          });
          detachNodeFromParent(node, parentNode);
          parentNode.children.push(group);
        } catch (error) {
          console.error('Error processing path:', error);
        }
      },
    },
  };
};

function extractPathPoints(segments: Array<SVGCommand>): {
  endPoints: Point[];
  controlPoints: Point[];
} {
  const endPoints: Point[] = [];
  const controlPoints: Point[] = [];
  segments.forEach((segment) => {
    const { type } = segment;
    switch (type) {
      case SVGPathData.MOVE_TO:
      case SVGPathData.LINE_TO:
        endPoints.push({ x: segment.x, y: segment.y });
        break;
      case SVGPathData.HORIZ_LINE_TO:
        endPoints.push({
          x: segment.x,
          y: endPoints.at(-1)?.y ?? 0,
        });
        break;
      case SVGPathData.VERT_LINE_TO:
        endPoints.push({
          x: endPoints.at(-1)?.x ?? 0,
          y: segment.y,
        });
        break;
      case SVGPathData.CURVE_TO:
        controlPoints.push({ x: segment.x1, y: segment.y1 });
        controlPoints.push({ x: segment.x2, y: segment.y2 });
        endPoints.push({ x: segment.x, y: segment.y });
        break;
      case SVGPathData.SMOOTH_CURVE_TO:
        controlPoints.push({ x: segment.x2, y: segment.y2 });
        endPoints.push({ x: segment.x, y: segment.y });
        break;
      case SVGPathData.QUAD_TO:
        controlPoints.push({ x: segment.x1, y: segment.y1 });
        endPoints.push({ x: segment.x, y: segment.y });
        break;
      case SVGPathData.SMOOTH_QUAD_TO:
        endPoints.push({ x: segment.x, y: segment.y });
        break;
      case SVGPathData.ARC:
        endPoints.push({ x: segment.x, y: segment.y });
        break;
      case SVGPathData.CLOSE_PATH:
        break;
    }
  });
  return { endPoints, controlPoints };
}
