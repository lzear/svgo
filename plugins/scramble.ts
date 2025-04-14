import type { Visitor, XastRoot, XastElement } from '../lib/types.js';
import { SVGPathData } from 'svg-pathdata';

export const name = 'scramble';
export const description = 'Shuffles all coordinates of svg elements';

export type ScrambleParams = {
  distance?: number;
  transformPrecision?: number;
};

type Point = {
  x: number;
  y: number;
};

/**
 * Moves a point randomly within the specified distance
 * @param point The original point
 * @param distance Maximum distance to move
 * @returns The moved point
 */
const movePoint = (point: Point, distance?: number): Point => {
  if (!distance) return point;
  const angle = Math.random() * Math.PI * 2;
  const r = distance * Math.random();
  const dx = Math.cos(angle) * r;
  const dy = Math.sin(angle) * r;
  return { x: point.x + dx, y: point.y + dy };
};

export const fn = (
  _root: XastRoot,
  { distance: _distance, transformPrecision }: ScrambleParams,
): Visitor => {
  const distance =
    _distance ??
    (transformPrecision === undefined ? 10 : (8 - transformPrecision) ** 2);
  return {
    element: {
      enter: (node: XastElement) => {
        if (!node.attributes || node.attributes['data-scrambled']) return;
        let updated = false;
        switch (node.name) {
          case 'circle':
          case 'ellipse':
            if (node.attributes.cx != null && node.attributes.cy != null) {
              const point = {
                x: parseFloat(node.attributes.cx),
                y: parseFloat(node.attributes.cy),
              };
              const movedPoint = movePoint(point, distance);
              node.attributes.cx = movedPoint.x.toFixed(2);
              node.attributes.cy = movedPoint.y.toFixed(2);
              updated = true;
            }
            break;

          case 'rect':
            if (node.attributes.x != null && node.attributes.y != null) {
              const point = {
                x: parseFloat(node.attributes.x),
                y: parseFloat(node.attributes.y),
              };
              const movedPoint = movePoint(point, distance);
              node.attributes.x = movedPoint.x.toFixed(2);
              node.attributes.y = movedPoint.y.toFixed(2);
              updated = true;
            }
            break;

          case 'line':
            if (
              node.attributes.x1 != null &&
              node.attributes.y1 != null &&
              node.attributes.x2 != null &&
              node.attributes.y2 != null
            ) {
              const startPoint = {
                x: parseFloat(node.attributes.x1),
                y: parseFloat(node.attributes.y1),
              };
              const endPoint = {
                x: parseFloat(node.attributes.x2),
                y: parseFloat(node.attributes.y2),
              };
              const movedStartPoint = movePoint(startPoint, distance);
              const movedEndPoint = movePoint(endPoint, distance);
              node.attributes.x1 = movedStartPoint.x.toFixed(2);
              node.attributes.y1 = movedStartPoint.y.toFixed(2);
              node.attributes.x2 = movedEndPoint.x.toFixed(2);
              node.attributes.y2 = movedEndPoint.y.toFixed(2);
              updated = true;
            }
            break;

          case 'polyline':
          case 'polygon':
            if (node.attributes.points) {
              const points = node.attributes.points
                .trim()
                .split(/\s+/)
                .map((pair) => {
                  const [x, y] = pair.split(',').map(Number);
                  const movedPoint = movePoint({ x, y }, distance);
                  return `${movedPoint.x.toFixed(2)},${movedPoint.y.toFixed(2)}`;
                })
                .join(' ');
              node.attributes.points = points;
              updated = true;
            }
            break;

          case 'path':
            if (node.attributes.d) {
              try {
                const pathData = new SVGPathData(node.attributes.d);
                const transformedCommands = pathData.commands.map((cmd) => {
                  const newCmd = { ...cmd };
                  if ('x' in newCmd && 'y' in newCmd) {
                    const point = { x: newCmd.x, y: newCmd.y };
                    const movedPoint = movePoint(point, distance);
                    newCmd.x = movedPoint.x;
                    newCmd.y = movedPoint.y;
                  }
                  if ('x1' in newCmd && 'y1' in newCmd) {
                    const point = { x: newCmd.x1, y: newCmd.y1 };
                    const movedPoint = movePoint(point, distance);
                    newCmd.x1 = movedPoint.x;
                    newCmd.y1 = movedPoint.y;
                  }
                  if ('x2' in newCmd && 'y2' in newCmd) {
                    const point = { x: newCmd.x2, y: newCmd.y2 };
                    const movedPoint = movePoint(point, distance);
                    newCmd.x2 = movedPoint.x;
                    newCmd.y2 = movedPoint.y;
                  }
                  return newCmd;
                });
                const newPathData = new SVGPathData('');
                newPathData.commands = transformedCommands;
                node.attributes.d = newPathData.encode();
                updated = true;
              } catch (error) {
                node.attributes.d = node.attributes.d.replace(
                  /(-?\d*\.?\d+),?(-?\d*\.?\d+)?/g,
                  (match, xStr, yStr) => {
                    if (yStr === undefined) return match;
                    const point = {
                      x: parseFloat(xStr),
                      y: parseFloat(yStr),
                    };
                    const movedPoint = movePoint(point, distance);
                    return `${movedPoint.x.toFixed(2)},${movedPoint.y.toFixed(2)}`;
                  },
                );
                updated = true;
              }
            }
            break;
        }
        if (updated) node.attributes['data-scrambled'] = 'true';
      },
    },
  };
};
