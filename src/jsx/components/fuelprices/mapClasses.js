import * as d3 from 'd3';
import { tokenColor } from './helpers.js';

// Increases above this (in per cent) are counted in the text and shown in red
export const THRESHOLD = 20;

const mix = (from, to, t) => d3.interpolateRgb(tokenColor(from), tokenColor(to))(t);

/** Map classes, upper bound inclusive: two blues up to the threshold, three reds above it. */
export const mapClasses = () => [
  { color: tokenColor('blue-lightest'), hi: 10, label: '<10%' },
  { color: tokenColor('blue-light'), hi: THRESHOLD, label: '10–20%' },
  { color: mix('red-light', 'red', 0.5), hi: 30, label: '20–30%' },
  { color: tokenColor('red'), hi: 40, label: '30–40%' },
  { color: tokenColor('red-dark'), hi: Number.POSITIVE_INFINITY, label: '>40%' }
];

/** Stripe colour of the "no data" hatching, slightly lighter than the base grey. */
export const noDataStripe = () => mix('grey', 'grey-light', 0.85);
