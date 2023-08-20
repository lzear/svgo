import { createPreset } from '../lib/svgo/plugins';

import * as removeDoctype from './removeDoctype';
import * as removeXMLProcInst from './removeXMLProcInst';
import * as removeComments from './removeComments';
import * as removeMetadata from './removeMetadata';
import * as removeEditorsNSData from './removeEditorsNSData';
import * as cleanupAttrs from './cleanupAttrs';
import * as mergeStyles from './mergeStyles';
import * as inlineStyles from './inlineStyles';
import * as minifyStyles from './minifyStyles';
import * as cleanupIds from './cleanupIds';
import * as removeUselessDefs from './removeUselessDefs';
import * as cleanupNumericValues from './cleanupNumericValues';
import * as convertColors from './convertColors';
import * as removeUnknownsAndDefaults from './removeUnknownsAndDefaults';
import * as removeNonInheritableGroupAttrs from './removeNonInheritableGroupAttrs';
import * as removeUselessStrokeAndFill from './removeUselessStrokeAndFill';
import * as removeViewBox from './removeViewBox';
import * as cleanupEnableBackground from './cleanupEnableBackground';
import * as removeHiddenElems from './removeHiddenElems';
import * as removeEmptyText from './removeEmptyText';
import * as convertShapeToPath from './convertShapeToPath';
import * as convertEllipseToCircle from './convertEllipseToCircle';
import * as moveElemsAttrsToGroup from './moveElemsAttrsToGroup';
import * as moveGroupAttrsToElems from './moveGroupAttrsToElems';
import * as collapseGroups from './collapseGroups';
import * as convertPathData from './convertPathData';
import * as convertTransform from './convertTransform';
import * as removeEmptyAttrs from './removeEmptyAttrs';
import * as removeEmptyContainers from './removeEmptyContainers';
import * as mergePaths from './mergePaths';
import * as removeUnusedNS from './removeUnusedNS';
import * as sortAttrs from './sortAttrs';
import * as sortDefsChildren from './sortDefsChildren';
import * as removeTitle from './removeTitle';
import * as removeDesc from './removeDesc';

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
});

export default presetDefault;
