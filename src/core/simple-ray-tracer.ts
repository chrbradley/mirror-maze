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
  
  // Use Method of Images: reflect receptor position through each active mirror
  let virtualReceptor = { ...receptorPos }
  const mirrorSequence: string[] = []
  
  // Apply reflections in a specific order (for consistent results)
  // Order: West, East, North, South
  const orderedWalls = ['W', 'E', 'N', 'S']
  
  for (const wall of orderedWalls) {
    const mirror = activeMirrors.find(m => m.wall === wall)
    if (mirror) {
      virtualReceptor = reflectPointAcrossWall(virtualReceptor, wall)
      mirrorSequence.push(wall)
    }
  }
  
  // Now trace from object to virtual receptor
  const segments: RaySegment[] = []
  let currentPos = { ...objectPos }
  
  // Cast ray toward virtual receptor
  const dx = virtualReceptor.x - currentPos.x
  const dy = virtualReceptor.y - currentPos.y
  const totalDist = Math.sqrt(dx * dx + dy * dy)
  
  if (totalDist < 0.001) {
    return [{ start: objectPos, end: receptorPos }]
  }
  
  const dir = { x: dx / totalDist, y: dy / totalDist }
  
  // Trace through each mirror in reverse order
  for (let i = mirrorSequence.length - 1; i >= 0; i--) {
    const wall = mirrorSequence[i]
    const t = rayWallIntersection(currentPos, dir, wall)
    
    if (t > 0.001) {
      const hitPoint = {
        x: currentPos.x + t * dir.x,
        y: currentPos.y + t * dir.y
      }
      
      segments.push({ start: currentPos, end: hitPoint })
      currentPos = { ...hitPoint }
    }
  }
  
  // Final segment to receptor
  segments.push({ start: currentPos, end: receptorPos })
  
  return segments
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