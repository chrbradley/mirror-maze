// ABOUTME: Calculates the sequence of mirrors needed to reach a target room
// ABOUTME: Determines minimum bounces and mirror configurations for room-to-room paths

import type { RoomCoord } from './coordinates'
import type { WallPosition } from './mirrors'

export interface MirrorStep {
  wall: WallPosition
  room: RoomCoord
}

// Calculate the mirror sequence needed to go from home room to target room
export function calculateMirrorSequence(
  homeRoom: RoomCoord,
  targetRoom: RoomCoord
): MirrorStep[] {
  const sequence: MirrorStep[] = []
  
  // Calculate room differences
  const rowDiff = targetRoom.row - homeRoom.row
  const colDiff = targetRoom.col - homeRoom.col
  
  // If same room, no mirrors needed
  if (rowDiff === 0 && colDiff === 0) {
    return []
  }
  
  // Current position as we trace the path
  let currentRoom = { ...homeRoom }
  
  // Handle horizontal movement (East/West)
  if (colDiff > 0) {
    // Move East
    for (let i = 0; i < colDiff; i++) {
      sequence.push({
        wall: 'E',
        room: { ...currentRoom }
      })
      currentRoom.col++
    }
  } else if (colDiff < 0) {
    // Move West
    for (let i = 0; i < Math.abs(colDiff); i++) {
      sequence.push({
        wall: 'W',
        room: { ...currentRoom }
      })
      currentRoom.col--
    }
  }
  
  // Handle vertical movement (North/South)
  if (rowDiff > 0) {
    // Move South
    for (let i = 0; i < rowDiff; i++) {
      sequence.push({
        wall: 'S',
        room: { ...currentRoom }
      })
      currentRoom.row++
    }
  } else if (rowDiff < 0) {
    // Move North
    for (let i = 0; i < Math.abs(rowDiff); i++) {
      sequence.push({
        wall: 'N',
        room: { ...currentRoom }
      })
      currentRoom.row--
    }
  }
  
  return sequence
}

// Calculate minimum number of bounces needed
export function calculateMinimumBounces(
  homeRoom: RoomCoord,
  targetRoom: RoomCoord
): number {
  const rowDiff = Math.abs(targetRoom.row - homeRoom.row)
  const colDiff = Math.abs(targetRoom.col - homeRoom.col)
  return rowDiff + colDiff
}

// Get the first mirror needed for the path
export function getRequiredMirror(
  homeRoom: RoomCoord,
  targetRoom: RoomCoord
): WallPosition | null {
  const sequence = calculateMirrorSequence(homeRoom, targetRoom)
  return sequence.length > 0 ? sequence[0].wall : null
}