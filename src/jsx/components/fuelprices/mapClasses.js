import * as d3 from 'd3';
import { tokenColor } from './helpers.js';

// Increases above this (in per cent) are counted in the text; the classes above it run from yellow to red
export const THRESHOLD = 20;

const mix = (from, to, t) => d3.interpolateRgb(tokenColor(from), tokenColor(to))(t);

/** Map classes, upper bound inclusive: two blues up to the threshold, then yellow, orange and red. */
export const mapClasses = () => [
  { color: tokenColor('blue-light'), hi: 10, label: '<10%' },
  { color: mix('blue-light', 'blue', 0.3), hi: THRESHOLD, label: '10–20%' },
  { color: tokenColor('yellow'), hi: 30, label: '20–30%' },
  { color: tokenColor('orange-brand'), hi: 40, label: '30–40%' },
  { color: tokenColor('red'), hi: Number.POSITIVE_INFINITY, label: '>40%' }
];

/** Stripe colour of the "no data" hatching: halfway between the two lightest greys, so it stays quiet next to the data classes. */
export const noDataStripe = () => mix('grey-light', 'grey-lightest', 0.5);
