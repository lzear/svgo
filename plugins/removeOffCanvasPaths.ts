import { parsePathData } from '../lib/path'
import type { PathDataItem } from '../lib/types'
import { detachNodeFromParent, visitSkip } from '../lib/xast'

import { intersects } from './_path'
import type { Plugin } from './plugins-types'

export const name = 'removeOffCanvasPaths'
export const description =
  'removes elements that are drawn outside of the viewbox (disabled by default)'

/**
 * Remove elements that are drawn outside of the viewbox.
 *
 * @author JoshyPHP
 */
export const fn: Plugin<'removeOffCanvasPaths'> = () => {
  let viewBoxData: null | {
    top: number
    right: number
    bottom: number
    left: number
    width: number
    height: number
  } = null

  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          let viewBox = ''
          // find viewbox
          if (node.attributes.viewBox != null) {
            // remove commas and plus signs, normalize and trim whitespace
            viewBox = node.attributes.viewBox
          } else if (
            node.attributes.height != null &&
            node.attributes.width != null
          ) {
            viewBox = `0 0 ${node.attributes.width} ${node.attributes.height}`
          }

          // parse viewbox
          // remove commas and plus signs, normalize and trim whitespace
          viewBox = viewBox
            .replaceAll(/[+,]|px/g, ' ')
            .replaceAll(/\s+/g, ' ')
            .replaceAll(/^\s*|\s*$/g, '')
          // ensure that the dimensions are 4 values separated by space
          const m =
            /^(-?\d*\.?\d+) (-?\d*\.?\d+) (\d*\.?\d+) (\d*\.?\d+)$/.exec(
              viewBox,
            )
          if (m == null) {
            return
          }
          const left = Number.parseFloat(m[1])
          const top = Number.parseFloat(m[2])
          const width = Number.parseFloat(m[3])
          const height = Number.parseFloat(m[4])

          // store the viewBox boundaries
          viewBoxData = {
            left,
            top,
            right: left + width,
            bottom: top + height,
            width,
            height,
          }
        }

        // consider that any item with a transform attribute is visible
        if (node.attributes.transform != null) {
          return visitSkip
        }

        if (
          node.name === 'path' &&
          node.attributes.d != null &&
          viewBoxData != null
        ) {
          const pathData = parsePathData(node.attributes.d)

          // consider that a M command within the viewBox is visible
          let visible = false
          for (const pathDataItem of pathData) {
            if (pathDataItem.command === 'M') {
              const [x, y] = pathDataItem.args
              if (
                x >= viewBoxData.left &&
                x <= viewBoxData.right &&
                y >= viewBoxData.top &&
                y <= viewBoxData.bottom
              ) {
                visible = true
              }
            }
          }
          if (visible) {
            return
          }

          if (pathData.length === 2) {
            // close the path too short for intersects()
            pathData.push({ command: 'z', args: [] })
          }

          const { left, top, width, height } = viewBoxData
          const viewBoxPathData: PathDataItem[] = [
            { command: 'M', args: [left, top] },
            { command: 'h', args: [width] },
            { command: 'v', args: [height] },
            { command: 'H', args: [left] },
            { command: 'z', args: [] },
          ]

          if (intersects(viewBoxPathData, pathData) === false) {
            detachNodeFromParent(node, parentNode)
          }
        }
      },
    },
  }
}
