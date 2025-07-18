// ABOUTME: Simple ray tracer for calculating light paths within a single room
// ABOUTME: Handles direct paths and multiple bounces off mirrors

import type { Point2D } from './coordinates'
import type { Mirror } from './mirrors'
import { ROOM_WIDTH, ROOM_HEIGHT } from './grid'

export interface RaySegment {
  start: Point2D
  end: Point2D
}

// Transform wall position based on room flipping
function transformWallForFlippedRoom(wall: string, flipX: boolean, flipY: boolean): string {
  if (flipX) {
    if (wall === 'E') return 'W'
    if (wall === 'W') return 'E'
  }
  if (flipY) {
    if (wall === 'N') return 'S'
    if (wall === 'S') return 'N'
  }
  return wall
}

// Trace a ray from object to receptor within a room, bouncing off active mirrors
export function traceRayInRoom(
  objectPos: Point2D,
  receptorPos: Point2D,
  roomMirrors: Mirror[],
  maxBounces: number = 5,
  flipX: boolean = false,
  flipY: boolean = false
): RaySegment[] {
  // Filter to only active mirrors
  const activeMirrors = roomMirrors.filter(m => m.state === 'on')
  
  console.log('Active mirrors:', activeMirrors.map(m => m.wall))
  console.log('Object pos:', objectPos)
  console.log('Receptor pos:', receptorPos)
  console.log('Room flipped - X:', flipX, 'Y:', flipY)
  
  // If no active mirrors, return direct path
  if (activeMirrors.length === 0) {
    return [{ start: objectPos, end: receptorPos }]
  }
  
  // Handle each active mirror type
  for (const mirror of activeMirrors) {
    // Transform the wall based on room flipping
    const transformedWall = transformWallForFlippedRoom(mirror.wall, flipX, flipY)
    console.log(`Mirror on ${mirror.wall} wall transforms to ${transformedWall} wall`)
    
    if (transformedWall === 'E') {
      // East wall reflection
      const virtualReceptor = {
        x: 2 * ROOM_WIDTH - receptorPos.x,
        y: receptorPos.y
      }
      
      console.log('Virtual receptor for East wall:', virtualReceptor)
      console.log('ROOM_WIDTH:', ROOM_WIDTH)
      
      // Cast ray from object toward virtual receptor
      const dx = virtualReceptor.x - objectPos.x
      const dy = virtualReceptor.y - objectPos.y
      const length = Math.sqrt(dx * dx + dy * dy)
      
      if (length < 0.001) {
        return [{ start: objectPos, end: receptorPos }]
      }
      
      const dir = { x: dx / length, y: dy / length }
      console.log('Ray direction:', dir)
      
      // Find intersection with East wall
      const t = (ROOM_WIDTH - objectPos.x) / dir.x
      console.log('t value for East wall:', t)
      
      if (t > 0 && dir.x > 0) { // Ray must be going right
        const hitPoint = {
          x: ROOM_WIDTH,
          y: objectPos.y + t * dir.y
        }
        console.log('Hit point on East wall:', hitPoint)
        
        // Ensure hit point is within room bounds
        if (hitPoint.y >= 0 && hitPoint.y <= ROOM_HEIGHT) {
          return [
            { start: objectPos, end: hitPoint },
            { start: hitPoint, end: receptorPos }
          ]
        }
      }
    } else if (transformedWall === 'W') {
      // West wall reflection
      const virtualReceptor = {
        x: -receptorPos.x,
        y: receptorPos.y
      }
      
      console.log('Virtual receptor for West wall:', virtualReceptor)
      
      // Cast ray from object toward virtual receptor
      const dx = virtualReceptor.x - objectPos.x
      const dy = virtualReceptor.y - objectPos.y
      const length = Math.sqrt(dx * dx + dy * dy)
      
      if (length < 0.001) {
        return [{ start: objectPos, end: receptorPos }]
      }
      
      const dir = { x: dx / length, y: dy / length }
      console.log('Ray direction:', dir)
      
      // Find intersection with West wall
      const t = -objectPos.x / dir.x
      console.log('t value for West wall:', t)
      
      if (t > 0 && dir.x < 0) { // Ray must be going left
        const hitPoint = {
          x: 0,
          y: objectPos.y + t * dir.y
        }
        console.log('Hit point on West wall:', hitPoint)
        
        // Ensure hit point is within room bounds
        if (hitPoint.y >= 0 && hitPoint.y <= ROOM_HEIGHT) {
          return [
            { start: objectPos, end: hitPoint },
            { start: hitPoint, end: receptorPos }
          ]
        }
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