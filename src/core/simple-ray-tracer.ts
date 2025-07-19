// ABOUTME: Simple ray tracer for calculating light paths within a single room
// ABOUTME: Handles direct paths and multiple bounces off mirrors

import type { Point2D } from './coordinates'
import type { Mirror, WallPosition } from './mirrors'
import { ROOM_WIDTH, ROOM_HEIGHT } from './grid'
import { traceFoldingRay } from './fold-ray-tracer'

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

// Reflect a point across a wall
function reflectPointAcrossWall(point: Point2D, wall: WallPosition): Point2D {
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

// Calculate intersection of ray with wall
function calculateWallIntersection(
  origin: Point2D,
  direction: Point2D,
  wall: WallPosition
): { point: Point2D; t: number } | null {
  // Normalize direction
  const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
  if (length < 0.001) return null
  
  const dir = { x: direction.x / length, y: direction.y / length }
  
  let t = -1
  let hitPoint: Point2D | null = null
  
  switch (wall) {
    case 'N': // y = 0
      if (Math.abs(dir.y) < 0.001) return null
      t = -origin.y / dir.y
      if (t > 0.001) {
        const x = origin.x + t * dir.x
        if (x >= 0 && x <= ROOM_WIDTH) {
          hitPoint = { x, y: 0 }
        }
      }
      break
      
    case 'S': // y = ROOM_HEIGHT
      if (Math.abs(dir.y) < 0.001) return null
      t = (ROOM_HEIGHT - origin.y) / dir.y
      if (t > 0.001) {
        const x = origin.x + t * dir.x
        if (x >= 0 && x <= ROOM_WIDTH) {
          hitPoint = { x, y: ROOM_HEIGHT }
        }
      }
      break
      
    case 'E': // x = ROOM_WIDTH
      if (Math.abs(dir.x) < 0.001) return null
      t = (ROOM_WIDTH - origin.x) / dir.x
      if (t > 0.001) {
        const y = origin.y + t * dir.y
        if (y >= 0 && y <= ROOM_HEIGHT) {
          hitPoint = { x: ROOM_WIDTH, y }
        }
      }
      break
      
    case 'W': // x = 0
      if (Math.abs(dir.x) < 0.001) return null
      t = -origin.x / dir.x
      if (t > 0.001) {
        const y = origin.y + t * dir.y
        if (y >= 0 && y <= ROOM_HEIGHT) {
          hitPoint = { x: 0, y }
        }
      }
      break
  }
  
  return hitPoint && t > 0 ? { point: hitPoint, t } : null
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
  
  
  // If no active mirrors, return direct path
  if (activeMirrors.length === 0) {
    return [{ start: objectPos, end: receptorPos }]
  }
  
  // Get transformed walls for active mirrors
  const activeWalls = activeMirrors.map(mirror => {
    const transformed = transformWallForFlippedRoom(mirror.wall, flipX, flipY) as WallPosition
    return transformed
  })
  
  // For now, return direct path - folding will be done in canvas space
  return [{ start: objectPos, end: receptorPos }]
}

// Extended version for multi-bounce scenarios
export function traceRayWithMultipleBounces(
  objectPos: Point2D,
  receptorPos: Point2D,
  mirrorSequence: WallPosition[],
  flipX: boolean = false,
  flipY: boolean = false
): RaySegment[] {
  if (mirrorSequence.length === 0) {
    return [{ start: objectPos, end: receptorPos }]
  }
  
  const segments: RaySegment[] = []
  let currentPos = { ...objectPos }
  let targetPos = { ...receptorPos }
  
  // Apply Method of Images in reverse order
  const virtualPositions: Point2D[] = [targetPos]
  
  // Transform mirror sequence based on room flipping
  const transformedSequence = mirrorSequence.map(wall => 
    transformWallForFlippedRoom(wall, flipX, flipY) as WallPosition
  )
  
  // Calculate virtual positions for each mirror (in reverse)
  for (let i = transformedSequence.length - 1; i >= 0; i--) {
    const wall = transformedSequence[i]
    const lastVirtual = virtualPositions[virtualPositions.length - 1]
    const newVirtual = reflectPointAcrossWall(lastVirtual, wall)
    virtualPositions.push(newVirtual)
  }
  
  // Reverse to get correct order
  virtualPositions.reverse()
  
  // Trace ray through each mirror
  for (let i = 0; i < transformedSequence.length; i++) {
    const wall = transformedSequence[i]
    const virtualTarget = virtualPositions[i + 1]
    
    // Calculate direction to virtual target
    const direction = {
      x: virtualTarget.x - currentPos.x,
      y: virtualTarget.y - currentPos.y
    }
    
    // Find intersection with wall
    const intersection = calculateWallIntersection(currentPos, direction, wall)
    
    if (intersection) {
      segments.push({ start: currentPos, end: intersection.point })
      currentPos = intersection.point
    } else {
      // If no valid intersection, return direct path
      console.warn(`Failed to find intersection with ${wall} wall`)
      return [{ start: objectPos, end: receptorPos }]
    }
  }
  
  // Add final segment to receptor
  segments.push({ start: currentPos, end: receptorPos })
  
  return segments
}