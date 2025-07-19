// ABOUTME: Traces line of sight through multiple rooms and folds it to get light path
// ABOUTME: Implements reverse-engineering approach for multi-bounce ray tracing

import type { Point2D, RoomCoord } from './coordinates'
import type { WallPosition } from './mirrors'
import { ROOM_WIDTH, ROOM_HEIGHT, GRID_COLS, GRID_ROWS } from './grid'

export interface WallIntersection {
  point: Point2D
  wall: WallPosition
  room: RoomCoord
}

// Find which wall a ray exits a room through
function findRoomExit(
  origin: Point2D,
  direction: Point2D,
  currentRoom: RoomCoord
): WallIntersection | null {
  // Normalize direction
  const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
  if (length < 0.001) return null
  
  const dir = { x: direction.x / length, y: direction.y / length }
  
  // Check all four walls
  const walls: { wall: WallPosition; t: number; point: Point2D }[] = []
  
  // North wall (y = 0)
  if (dir.y < -0.001) {
    const t = -origin.y / dir.y
    if (t > 0.001) {
      const x = origin.x + t * dir.x
      if (x >= 0 && x <= ROOM_WIDTH) {
        walls.push({ wall: 'N', t, point: { x, y: 0 } })
      }
    }
  }
  
  // South wall (y = ROOM_HEIGHT)
  if (dir.y > 0.001) {
    const t = (ROOM_HEIGHT - origin.y) / dir.y
    if (t > 0.001) {
      const x = origin.x + t * dir.x
      if (x >= 0 && x <= ROOM_WIDTH) {
        walls.push({ wall: 'S', t, point: { x, y: ROOM_HEIGHT } })
      }
    }
  }
  
  // East wall (x = ROOM_WIDTH)
  if (dir.x > 0.001) {
    const t = (ROOM_WIDTH - origin.x) / dir.x
    if (t > 0.001) {
      const y = origin.y + t * dir.y
      if (y >= 0 && y <= ROOM_HEIGHT) {
        walls.push({ wall: 'E', t, point: { x: ROOM_WIDTH, y } })
      }
    }
  }
  
  // West wall (x = 0)
  if (dir.x < -0.001) {
    const t = -origin.x / dir.x
    if (t > 0.001) {
      const y = origin.y + t * dir.y
      if (y >= 0 && y <= ROOM_HEIGHT) {
        walls.push({ wall: 'W', t, point: { x: 0, y } })
      }
    }
  }
  
  // Find the closest wall
  if (walls.length === 0) return null
  
  walls.sort((a, b) => a.t - b.t)
  const closest = walls[0]
  
  return {
    point: closest.point,
    wall: closest.wall,
    room: currentRoom
  }
}

// Get the next room when crossing a wall
function getNextRoom(currentRoom: RoomCoord, wall: WallPosition): RoomCoord | null {
  const { row, col } = currentRoom
  
  switch (wall) {
    case 'N':
      if (row === 0) return null // Edge of grid
      return { row: row - 1, col }
    case 'S':
      if (row === GRID_ROWS - 1) return null // Edge of grid
      return { row: row + 1, col }
    case 'E':
      if (col === GRID_COLS - 1) return null // Edge of grid
      return { row, col: col + 1 }
    case 'W':
      if (col === 0) return null // Edge of grid
      return { row, col: col - 1 }
  }
}

// Get entry point in next room after crossing a wall
function getEntryPoint(exitPoint: Point2D, wall: WallPosition): Point2D {
  switch (wall) {
    case 'N':
      return { x: exitPoint.x, y: ROOM_HEIGHT }
    case 'S':
      return { x: exitPoint.x, y: 0 }
    case 'E':
      return { x: 0, y: exitPoint.y }
    case 'W':
      return { x: ROOM_WIDTH, y: exitPoint.y }
  }
}

// Trace line of sight from receptor to object through multiple rooms
export function traceLineOfSight(
  receptorPos: Point2D,
  receptorRoom: RoomCoord,
  objectPos: Point2D,
  objectRoom: RoomCoord
): WallIntersection[] {
  const intersections: WallIntersection[] = []
  
  // If in same room, no wall intersections
  if (receptorRoom.row === objectRoom.row && receptorRoom.col === objectRoom.col) {
    return []
  }
  
  // Start from receptor position
  let currentPos = { ...receptorPos }
  let currentRoom = { ...receptorRoom }
  
  // Continue until we reach the object's room
  while (currentRoom.row !== objectRoom.row || currentRoom.col !== objectRoom.col) {
    // Calculate direction towards object (in object's room)
    // This is a simplification - in reality we'd need to account for the actual path
    const targetX = objectRoom.col * ROOM_WIDTH + objectPos.x
    const targetY = objectRoom.row * ROOM_HEIGHT + objectPos.y
    const currentX = currentRoom.col * ROOM_WIDTH + currentPos.x
    const currentY = currentRoom.row * ROOM_HEIGHT + currentPos.y
    
    const direction = {
      x: targetX - currentX,
      y: targetY - currentY
    }
    
    // Find where we exit the current room
    const exit = findRoomExit(currentPos, direction, currentRoom)
    if (!exit) break
    
    intersections.push(exit)
    
    // Move to next room
    const nextRoom = getNextRoom(currentRoom, exit.wall)
    if (!nextRoom) break
    
    currentRoom = nextRoom
    currentPos = getEntryPoint(exit.point, exit.wall)
  }
  
  return intersections
}

// Reflect a point across a wall
function reflectAcrossWall(point: Point2D, wall: WallPosition): Point2D {
  switch (wall) {
    case 'N':
      return { x: point.x, y: -point.y }
    case 'S':
      return { x: point.x, y: 2 * ROOM_HEIGHT - point.y }
    case 'E':
      return { x: 2 * ROOM_WIDTH - point.x, y: point.y }
    case 'W':
      return { x: -point.x, y: point.y }
  }
}

// Fold the line of sight at wall intersections to get the light path
export function foldLineOfSight(
  objectPos: Point2D,
  receptorPos: Point2D,
  wallIntersections: WallIntersection[]
): { start: Point2D; end: Point2D }[] {
  if (wallIntersections.length === 0) {
    // Direct path
    return [{ start: objectPos, end: receptorPos }]
  }
  
  const segments: { start: Point2D; end: Point2D }[] = []
  
  // Work backwards from receptor through each wall
  let currentEnd = receptorPos
  
  for (let i = wallIntersections.length - 1; i >= 0; i--) {
    const intersection = wallIntersections[i]
    
    // Add segment from previous point to wall
    segments.unshift({
      start: intersection.point,
      end: currentEnd
    })
    
    currentEnd = intersection.point
  }
  
  // Add final segment from object to first wall
  segments.unshift({
    start: objectPos,
    end: currentEnd
  })
  
  return segments
}