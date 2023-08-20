'use strict';

const { createPreset } = require('../lib/svgo/plugins');

const removeDoctype = require('./removeDoctype');
const removeXMLProcInst = require('./removeXMLProcInst');
const removeComments = require('./removeComments');
const removeMetadata = require('./removeMetadata');
const removeEditorsNSData = require('./removeEditorsNSData');
const cleanupAttrs = require('./cleanupAttrs');
const mergeStyles = require('./mergeStyles');
const inlineStyles = require('./inlineStyles');
const minifyStyles = require('./minifyStyles');
const cleanupIds = require('./cleanupIds');
const removeUselessDefs = require('./removeUselessDefs');
const cleanupNumericValues = require('./cleanupNumericValues');
const convertColors = require('./convertColors');
const removeUnknownsAndDefaults = require('./removeUnknownsAndDefaults');
const removeNonInheritableGroupAttrs = require('./removeNonInheritableGroupAttrs');
const removeUselessStrokeAndFill = require('./removeUselessStrokeAndFill');
const removeViewBox = require('./removeViewBox');
const cleanupEnableBackground = require('./cleanupEnableBackground');
const removeHiddenElems = require('./removeHiddenElems');
const removeEmptyText = require('./removeEmptyText');
const convertShapeToPath = require('./convertShapeToPath');
const convertEllipseToCircle = require('./convertEllipseToCircle');
const moveElemsAttrsToGroup = require('./moveElemsAttrsToGroup');
const moveGroupAttrsToElems = require('./moveGroupAttrsToElems');
const collapseGroups = require('./collapseGroups');
const convertPathData = require('./convertPathData');
const convertTransform = require('./convertTransform');
const removeEmptyAttrs = require('./removeEmptyAttrs');
const removeEmptyContainers = require('./removeEmptyContainers');
const mergePaths = require('./mergePaths');
const removeUnusedNS = require('./removeUnusedNS');
const sortAttrs = require('./sortAttrs');
const sortDefsChildren = require('./sortDefsChildren');
const removeTitle = require('./removeTitle');
const removeDesc = require('./removeDesc');

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

module.exports = presetDefault;
