/**
 * useCurve.ts — Surface Y, surface tilt, and road curve X calculations
 * 
 * Pure math functions for the curved-earth road model.
 * Depends on: EARTH_R (constant), roadCurveEnabled (ref), roadCurve (ref)
 * 
 * Usage: const { getSurfaceY, getSurfaceTilt, getCurveX, curveFrontZ } = useCurve({ roadCurveEnabled, roadCurve })
 */

import { ref, type Ref } from 'vue'
import { EARTH_R } from '../gameConstants'

export interface UseCurveParams {
  roadCurveEnabled: Ref<boolean>;
  roadCurve: Ref<number>;
}

export function useCurve({ roadCurveEnabled, roadCurve }: UseCurveParams) {
  // z is world Z (negative = ahead). Returns Y offset.
  // Near the player (z > -5): flat (y=0)
  // Far away: drops below as if curving over a sphere
  const getSurfaceY = (z: number): number => {
    const dist = Math.max(0, -z);
    if (dist < 5) return 0;
    const angle = dist / EARTH_R;
    return -EARTH_R * (1 - Math.cos(angle));
  };

  const getSurfaceZ = (z: number): number => {
    const dist = Math.max(0, -z);
    if (dist < 5) return -dist;
    const angle = dist / EARTH_R;
    return -EARTH_R * Math.sin(angle);
  };

  const getSurfaceTilt = (z: number): number => {
    const dist = Math.max(0, -z);
    if (dist < 5) return 0;
    return -dist / EARTH_R; // radians, objects lean back
  };

  // curveFrontZ: 0 = front at player (full curve), negative = front still approaching
  const curveFrontZ: Ref<number> = ref(0);

  const getCurveX = (z: number): number => {
    if (!roadCurveEnabled.value) return 0;
    const depth = Math.max(0, -z); // how far ahead (positive)
    const frontDepth = Math.max(0, -curveFrontZ.value); // depth where curve starts
    if (depth <= frontDepth) return 0; // player side of front: straight
    const pastFront = depth - frontDepth;
    const t = pastFront / 80;
    return roadCurve.value * t * t * 24;
  };

  const getCurveSlope = (z: number): number => {
    if (!roadCurveEnabled.value) return 0;
    const depth = Math.max(0, -z);
    const frontDepth = Math.max(0, -curveFrontZ.value);
    if (depth <= frontDepth) return 0;
    const pastFront = depth - frontDepth;
    return Math.atan(-0.0075 * roadCurve.value * pastFront);
  };

  return {
    getSurfaceY,
    getSurfaceZ,
    getSurfaceTilt,
    getCurveX,
    getCurveSlope,
    curveFrontZ,
  };
}