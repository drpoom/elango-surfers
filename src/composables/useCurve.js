/**
 * useCurve.js — Surface Y, surface tilt, and road curve X calculations
 * 
 * Pure math functions for the curved-earth road model.
 * Depends on: EARTH_R (constant), roadCurveEnabled (ref), roadCurve (ref)
 * 
 * Usage: const { getSurfaceY, getSurfaceTilt, getCurveX, curveFrontZ } = useCurve({ roadCurveEnabled, roadCurve })
 */

import { ref } from 'vue'
import { EARTH_R } from '../gameConstants.js'

export function useCurve({ roadCurveEnabled, roadCurve }) {
  // z is world Z (negative = ahead). Returns Y offset.
  // Near the player (z > -5): flat (y=0)
  // Far away: drops below as if curving over a sphere
  const getSurfaceY = (z) => {
    const dist = Math.max(0, -z);
    if (dist < 5) return 0;
    const angle = dist / EARTH_R;
    return -EARTH_R * (1 - Math.cos(angle));
  };

  const getSurfaceZ = (z) => {
    const dist = Math.max(0, -z);
    if (dist < 5) return -dist;
    const angle = dist / EARTH_R;
    return -EARTH_R * Math.sin(angle);
  };

  const getSurfaceTilt = (z) => {
    const dist = Math.max(0, -z);
    if (dist < 5) return 0;
    return -dist / EARTH_R; // radians, objects lean back
  };

  // curveFrontZ: 0 = front at player (full curve), negative = front still approaching
  // Using ref so mutations from App.vue propagate into getCurveX reads
  const curveFrontZ = ref(0);

  const getCurveX = (z) => {
    if (!roadCurveEnabled.value) return 0;
    const depth = Math.max(0, -z); // how far ahead (positive)
    const frontDepth = Math.max(0, -curveFrontZ.value); // depth where curve starts
    if (depth <= frontDepth) return 0; // player side of front: straight
    const pastFront = depth - frontDepth;
    const t = pastFront / 80;
    return roadCurve.value * t * t * 24;
  };

  return {
    getSurfaceY,
    getSurfaceZ,
    getSurfaceTilt,
    getCurveX,
    curveFrontZ,
  };
}