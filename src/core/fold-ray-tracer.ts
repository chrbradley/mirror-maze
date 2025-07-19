// ABOUTME: Implements the folding approach to trace rays by working backwards from line of sight
// ABOUTME: Folds the line of sight at wall intersections to reconstruct the actual light path

import type { Point2D } from './coordinates'
import type { WallPosition } from './mirrors'
import { ROOM_WIDTH, ROOM_HEIGHT } from './grid'

export interface RaySegment {
  start: Point2D
  end: Point2D
}

// Debug info to return
export interface FoldingDebugInfo {
  lineOfSightStart: Point2D
  lineOfSightEnd: Point2D
  wallIntersection: Point2D | null
  wallType: WallPosition | null
  reflectedObjectPos: Point2D | null
}

// Find where a line segment intersects a wall
function findWallIntersection(
  start: Point2D,
  end: Point2D,
  wall: WallPosition
): Point2D | null {
  const dx = end.x - start.x
  const dy = end.y - start.y
  
  let t = -1
  
  switch (wall) {
    case 'N': // y = 0
      if (Math.abs(dy) < 0.001) return null
      t = (0 - start.y) / dy
      break
      
    case 'S': // y = ROOM_HEIGHT  
      if (Math.abs(dy) < 0.001) return null
      t = (ROOM_HEIGHT - start.y) / dy
      break
      
    case 'E': // x = ROOM_WIDTH
      if (Math.abs(dx) < 0.001) return null
      t = (ROOM_WIDTH - start.x) / dx
      break
      
    case 'W': // x = 0
      if (Math.abs(dx) < 0.001) return null
      t = (0 - start.x) / dx
      break
  }
  
  // Check if intersection is in the forward direction (t > 0)
  // Don't limit to t <= 1 since we want to extend the ray beyond the segment
  if (t < 0) return null
  
  const intersection = {
    x: start.x + t * dx,
    y: start.y + t * dy
  }
  
  // Verify intersection is within wall bounds
  switch (wall) {
    case 'N':
    case 'S':
      if (intersection.x < -0.001 || intersection.x > ROOM_WIDTH + 0.001) return null
      // Clamp to exact wall position
      intersection.y = wall === 'N' ? 0 : ROOM_HEIGHT
      break
    case 'E':
    case 'W':
      if (intersection.y < -0.001 || intersection.y > ROOM_HEIGHT + 0.001) return null
      // Clamp to exact wall position
      intersection.x = wall === 'W' ? 0 : ROOM_WIDTH
      break
  }
  
  return intersection
}

// Find the closest wall intersection
function findClosestWallIntersection(
  start: Point2D,
  end: Point2D,
  walls: WallPosition[]
): { wall: WallPosition; point: Point2D; t: number } | null {
  let closest: { wall: WallPosition; point: Point2D; t: number } | null = null
  let minDist = Infinity
  
  for (const wall of walls) {
    const intersection = findWallIntersection(start, end, wall)
    
    if (intersection) {
      const dist = Math.sqrt(
        Math.pow(intersection.x - start.x, 2) + 
        Math.pow(intersection.y - start.y, 2)
      )
      
      if (dist < minDist && dist > 0.001) {
        minDist = dist
        const dx = end.x - start.x
        const dy = end.y - start.y
        const t = dx !== 0 ? (intersection.x - start.x) / dx : (intersection.y - start.y) / dy
        closest = { wall, point: intersection, t }
      }
    }
  }
  return closest
}

// Global debug info (only set once per frame)
let debugInfo: FoldingDebugInfo | null = null

export function getFoldingDebugInfo(): FoldingDebugInfo | null {
  return debugInfo
}

// The correct folding algorithm
export function traceFoldingRay(
  objectPos: Point2D,
  receptorPos: Point2D,
  activeWalls: WallPosition[]
): RaySegment[] {
  // Remove logs to prevent infinite logging in draw loop
  
  if (activeWalls.length === 0) {
    return [{ start: objectPos, end: receptorPos }]
  }
  
  // Step 1: Find where line of sight intersects the first wall
  const lineOfSight = { start: receptorPos, end: objectPos }
  
  const firstIntersection = findClosestWallIntersection(lineOfSight.start, lineOfSight.end, activeWalls)
  
  if (!firstIntersection) {
    return [{ start: objectPos, end: receptorPos }]
  }
  
  // The segments we'll build - the actual light path
  const segments: RaySegment[] = []
  
  // The light travels from object to wall, then from wall to receptor
  // Segment 1: Object to wall intersection
  segments.push({ start: objectPos, end: firstIntersection.point })
  
  // Segment 2: Wall intersection to receptor
  segments.push({ start: firstIntersection.point, end: receptorPos })
  
  // Store debug info
  debugInfo = {
    lineOfSightStart: receptorPos,
    lineOfSightEnd: objectPos,
    wallIntersection: firstIntersection.point,
    wallType: firstIntersection.wall,
    reflectedObjectPos: null // No longer calculating reflected position
  }
  
  // Log the key points once - but prevent spamming by using a simple flag
  const logKey = `${receptorPos.x},${receptorPos.y}-${objectPos.x},${objectPos.y}-${activeWalls.join(',')}`
  if (!(traceFoldingRay as any).lastLogKey || (traceFoldingRay as any).lastLogKey !== logKey) {
    (traceFoldingRay as any).lastLogKey = logKey
    console.log('=== FOLD RAY TRACER (ROOM COORDS) ===')
    console.log('Object pos:', objectPos)
    console.log('Receptor pos:', receptorPos)
    console.log('Active walls:', activeWalls)
    console.log('Wall intersection:', firstIntersection.wall, 'at', firstIntersection.point)
    console.log('Ray segments:')
    segments.forEach((seg, i) => {
      console.log(`  ${i}: ${JSON.stringify(seg.start)} -> ${JSON.stringify(seg.end)}`)
    })
    console.log('=====================================')
  }
  
  // Validation: The angle of incidence should equal angle of reflection
  const incident = {
    x: firstIntersection.point.x - objectPos.x,
    y: firstIntersection.point.y - objectPos.y
  }
  const reflected = {
    x: receptorPos.x - firstIntersection.point.x,
    y: receptorPos.y - firstIntersection.point.y
  }
  
  // Normalize vectors
  const incidentLength = Math.sqrt(incident.x * incident.x + incident.y * incident.y)
  const reflectedLength = Math.sqrt(reflected.x * reflected.x + reflected.y * reflected.y)
  
  if (incidentLength > 0.001 && reflectedLength > 0.001) {
    const incidentNorm = { x: incident.x / incidentLength, y: incident.y / incidentLength }
    const reflectedNorm = { x: reflected.x / reflectedLength, y: reflected.y / reflectedLength }
    
    // Check angle equality based on wall type
    let angleValid = false
    switch (firstIntersection.wall) {
      case 'N':
      case 'S':
        // For horizontal walls, x components should match, y components should be opposite
        angleValid = Math.abs(incidentNorm.x - reflectedNorm.x) < 0.01 && 
                    Math.abs(incidentNorm.y + reflectedNorm.y) < 0.01
        break
      case 'E':
      case 'W':
        // For vertical walls, y components should match, x components should be opposite
        angleValid = Math.abs(incidentNorm.y - reflectedNorm.y) < 0.01 && 
                    Math.abs(incidentNorm.x + reflectedNorm.x) < 0.01
        break
    }
    
    if (!angleValid && (traceFoldingRay as any).lastLogKey === logKey) {
      console.log('Warning: Angle validation failed')
      console.log('Incident vector (normalized):', incidentNorm)
      console.log('Reflected vector (normalized):', reflectedNorm)
    }
  }
  
  return segments
}

// Add this as a property to prevent log spam
;(traceFoldingRay as any).lastLogKey = null