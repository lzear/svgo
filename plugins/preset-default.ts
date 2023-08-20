import { createPreset } from '../lib/svgo/plugins'

import * as cleanupAttrs from './cleanupAttrs'
import * as cleanupEnableBackground from './cleanupEnableBackground'
import * as cleanupIds from './cleanupIds'
import * as cleanupNumericValues from './cleanupNumericValues'
import * as collapseGroups from './collapseGroups'
import * as convertColors from './convertColors'
import * as convertEllipseToCircle from './convertEllipseToCircle'
import * as convertPathData from './convertPathData'
import * as convertShapeToPath from './convertShapeToPath'
import * as convertTransform from './convertTransform'
import * as inlineStyles from './inlineStyles'
import * as mergePaths from './mergePaths'
import * as mergeStyles from './mergeStyles'
import * as minifyStyles from './minifyStyles'
import * as moveElemsAttrsToGroup from './moveElemsAttrsToGroup'
import * as moveGroupAttrsToElems from './moveGroupAttrsToElems'
import * as removeComments from './removeComments'
import * as removeDesc from './removeDesc'
import * as removeDoctype from './removeDoctype'
import * as removeEditorsNSData from './removeEditorsNSData'
import * as removeEmptyAttrs from './removeEmptyAttrs'
import * as removeEmptyContainers from './removeEmptyContainers'
import * as removeEmptyText from './removeEmptyText'
import * as removeHiddenElems from './removeHiddenElems'
import * as removeMetadata from './removeMetadata'
import * as removeNonInheritableGroupAttrs from './removeNonInheritableGroupAttrs'
import * as removeTitle from './removeTitle'
import * as removeUnknownsAndDefaults from './removeUnknownsAndDefaults'
import * as removeUnusedNS from './removeUnusedNS'
import * as removeUselessDefs from './removeUselessDefs'
import * as removeUselessStrokeAndFill from './removeUselessStrokeAndFill'
import * as removeViewBox from './removeViewBox'
import * as removeXMLProcInst from './removeXMLProcInst'
import * as sortAttrs from './sortAttrs'
import * as sortDefsChildren from './sortDefsChildren'

export const presetDefault = createPreset({
  name: 'preset-default',
  plugins: [
    removeDoctype,
    removeXMLProcInst,
    removeComments,
    removeMetadata,
    removeEditorsNSData,
    cleanupAttrs,
    mergeStyles,
    inlineStyles,
    minifyStyles,
    cleanupIds,
    removeUselessDefs,
    cleanupNumericValues,
    convertColors,
    removeUnknownsAndDefaults,
    removeNonInheritableGroupAttrs,
    removeUselessStrokeAndFill,
    removeViewBox,
    cleanupEnableBackground,
    removeHiddenElems,
    removeEmptyText,
    convertShapeToPath,
    convertEllipseToCircle,
    moveElemsAttrsToGroup,
    moveGroupAttrsToElems,
    collapseGroups,
    convertPathData,
    convertTransform,
    removeEmptyAttrs,
    removeEmptyContainers,
    mergePaths,
    removeUnusedNS,
    sortAttrs,
    sortDefsChildren,
    removeTitle,
    removeDesc,
  ],
})

export default presetDefault
