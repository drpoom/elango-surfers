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

  return {
    getSurfaceY,
    getSurfaceZ,
    getSurfaceTilt,
    getCurveX,
    curveFrontZ,
  };
}