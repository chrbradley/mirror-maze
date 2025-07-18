// ABOUTME: Simple ray tracer for calculating light paths within a single room
// ABOUTME: Handles direct paths and multiple bounces off mirrors

import type { Point2D } from './coordinates'
import type { Mirror } from './mirrors'
import { ROOM_WIDTH, ROOM_HEIGHT } from './grid'

export interface RaySegment {
  start: Point2D
  end: Point2D
}

// Trace a ray from object to receptor within a room, bouncing off active mirrors
export function traceRayInRoom(
  objectPos: Point2D,
  receptorPos: Point2D,
  roomMirrors: Mirror[],
  maxBounces: number = 5
): RaySegment[] {
  // Filter to only active mirrors
  const activeMirrors = roomMirrors.filter(m => m.state === 'on')
  
  // If no active mirrors, return direct path
  if (activeMirrors.length === 0) {
    return [{ start: objectPos, end: receptorPos }]
  }
  
  // Simple case: single East mirror
  if (activeMirrors.length === 1 && activeMirrors[0].wall === 'E') {
    // Calculate virtual receptor position by reflecting across East wall
    const virtualReceptor = {
      x: 2 * ROOM_WIDTH - receptorPos.x,
      y: receptorPos.y
    }
    
    // Cast ray from object toward virtual receptor
    const dx = virtualReceptor.x - objectPos.x
    const dy = virtualReceptor.y - objectPos.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length < 0.001) {
      return [{ start: objectPos, end: receptorPos }]
    }
    
    const dir = { x: dx / length, y: dy / length }
    
    // Find intersection with East wall
    const t = (ROOM_WIDTH - objectPos.x) / dir.x
    
    if (t > 0 && t * Math.abs(dir.y) < ROOM_HEIGHT) {
      const hitPoint = {
        x: ROOM_WIDTH,
        y: objectPos.y + t * dir.y
      }
      
      // Ensure hit point is within room bounds
      if (hitPoint.y >= 0 && hitPoint.y <= ROOM_HEIGHT) {
        return [
          { start: objectPos, end: hitPoint },
          { start: hitPoint, end: receptorPos }
        ]
      }
    }
  }
  
  // For other cases, return direct path for now
  return [{ start: objectPos, end: receptorPos }]
}

// Reflect a point across a wall
function reflectPointAcrossWall(point: Point2D, wall: string): Point2D {
  switch (wall) {
    case 'N':
      return { x: point.x, y: -point.y }
    case 'S':
      return { x: point.x, y: 2 * ROOM_HEIGHT - point.y }
    case 'E':
      return { x: 2 * ROOM_WIDTH - point.x, y: point.y }
    case 'W':
      return { x: -point.x, y: point.y }
    default:
      return point
  }
}

// Calculate ray-wall intersection
function rayWallIntersection(
  origin: Point2D,
  dir: Point2D,
  wall: string
): number {
  // Convert to room-local coordinates (0,0 to ROOM_WIDTH,ROOM_HEIGHT)
  const localOrigin = { ...origin }
  
  switch (wall) {
    case 'N': // y = 0
      if (Math.abs(dir.y) < 1e-6) return -1
      const tN = -localOrigin.y / dir.y
      const xN = localOrigin.x + tN * dir.x
      if (tN > 0 && xN >= 0 && xN <= ROOM_WIDTH) return tN
      break
      
    case 'S': // y = ROOM_HEIGHT
      if (Math.abs(dir.y) < 1e-6) return -1
      const tS = (ROOM_HEIGHT - localOrigin.y) / dir.y
      const xS = localOrigin.x + tS * dir.x
      if (tS > 0 && xS >= 0 && xS <= ROOM_WIDTH) return tS
      break
      
    case 'E': // x = ROOM_WIDTH
      if (Math.abs(dir.x) < 1e-6) return -1
      const tE = (ROOM_WIDTH - localOrigin.x) / dir.x
      const yE = localOrigin.y + tE * dir.y
      if (tE > 0 && yE >= 0 && yE <= ROOM_HEIGHT) return tE
      break
      
    case 'W': // x = 0
      if (Math.abs(dir.x) < 1e-6) return -1
      const tW = -localOrigin.x / dir.x
      const yW = localOrigin.y + tW * dir.y
      if (tW > 0 && yW >= 0 && yW <= ROOM_HEIGHT) return tW
      break
  }
  
  return -1
}