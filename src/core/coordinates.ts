// ABOUTME: Coordinate system for room transformations and mirroring
// ABOUTME: Handles conversion between canvas, room, and local coordinates

import { ROOM_WIDTH, ROOM_HEIGHT, GRID_COLS, GRID_ROWS, getGridOffset } from './grid'

// Type definitions
export type RoomCoord = { row: number; col: number }
export type Point2D = { x: number; y: number }

// Check if a room should be horizontally flipped
export function isRoomFlippedX(col: number): boolean {
  return col % 2 === 1  // Odd columns are flipped
}

// Check if a room should be vertically flipped
export function isRoomFlippedY(row: number): boolean {
  return row === 1  // Second row is flipped
}

// Convert room coordinates and local point to canvas coordinates
export function roomToCanvas(roomCoord: RoomCoord, localPoint: Point2D): Point2D {
  const gridOffset = getGridOffset()
  const roomX = roomCoord.col * ROOM_WIDTH + gridOffset.x
  const roomY = roomCoord.row * ROOM_HEIGHT + gridOffset.y
  
  return {
    x: roomX + localPoint.x,
    y: roomY + localPoint.y
  }
}

// Convert canvas coordinates to room coordinates and local point
export function canvasToRoom(canvasPoint: Point2D): { room: RoomCoord; localPoint: Point2D } | null {
  const gridOffset = getGridOffset()
  
  // Calculate which room the point is in
  const relativeX = canvasPoint.x - gridOffset.x
  const relativeY = canvasPoint.y - gridOffset.y
  
  // Check if point is outside the grid
  if (relativeX < 0 || relativeY < 0 || 
      relativeX >= GRID_COLS * ROOM_WIDTH || 
      relativeY >= GRID_ROWS * ROOM_HEIGHT) {
    return null
  }
  
  const col = Math.floor(relativeX / ROOM_WIDTH)
  const row = Math.floor(relativeY / ROOM_HEIGHT)
  
  const localX = relativeX % ROOM_WIDTH
  const localY = relativeY % ROOM_HEIGHT
  
  return {
    room: { row, col },
    localPoint: { x: localX, y: localY }
  }
}

// Mirror a point based on flip flags
export function mirrorPoint(point: Point2D, flipX: boolean, flipY: boolean): Point2D {
  return {
    x: flipX ? ROOM_WIDTH - point.x : point.x,
    y: flipY ? ROOM_HEIGHT - point.y : point.y
  }
}

// Get the mirrored position of a point in a specific room
export function getMirroredRoomPoint(roomCoord: RoomCoord, localPoint: Point2D): Point2D {
  const flipX = isRoomFlippedX(roomCoord.col)
  const flipY = isRoomFlippedY(roomCoord.row)
  return mirrorPoint(localPoint, flipX, flipY)
}