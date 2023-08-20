import { createPreset } from '../lib/svgo/plugins';

import removeDoctype from './removeDoctype';
import removeXMLProcInst from './removeXMLProcInst';
import removeComments from './removeComments';
import removeMetadata from './removeMetadata';
import removeEditorsNSData from './removeEditorsNSData';
import cleanupAttrs from './cleanupAttrs';
import mergeStyles from './mergeStyles';
import inlineStyles from './inlineStyles';
import minifyStyles from './minifyStyles';
import cleanupIds from './cleanupIds';
import removeUselessDefs from './removeUselessDefs';
import cleanupNumericValues from './cleanupNumericValues';
import convertColors from './convertColors';
import removeUnknownsAndDefaults from './removeUnknownsAndDefaults';
import removeNonInheritableGroupAttrs from './removeNonInheritableGroupAttrs';
import removeUselessStrokeAndFill from './removeUselessStrokeAndFill';
import removeViewBox from './removeViewBox';
import cleanupEnableBackground from './cleanupEnableBackground';
import removeHiddenElems from './removeHiddenElems';
import removeEmptyText from './removeEmptyText';
import convertShapeToPath from './convertShapeToPath';
import convertEllipseToCircle from './convertEllipseToCircle';
import moveElemsAttrsToGroup from './moveElemsAttrsToGroup';
import moveGroupAttrsToElems from './moveGroupAttrsToElems';
import collapseGroups from './collapseGroups';
import convertPathData from './convertPathData';
import convertTransform from './convertTransform';
import removeEmptyAttrs from './removeEmptyAttrs';
import removeEmptyContainers from './removeEmptyContainers';
import mergePaths from './mergePaths';
import removeUnusedNS from './removeUnusedNS';
import sortAttrs from './sortAttrs';
import sortDefsChildren from './sortDefsChildren';
import removeTitle from './removeTitle';
import removeDesc from './removeDesc';

const presetDefault = createPreset({
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
