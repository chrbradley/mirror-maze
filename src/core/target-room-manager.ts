// ABOUTME: Manages which room is currently the target for ray reflections
// ABOUTME: Handles transitions when switching between different target rooms

import type { RoomCoord } from './coordinates'

export class TargetRoomManager {
  private currentTargetRoom: RoomCoord = { row: 0, col: 2 } // Default to (0,2) - simple horizontal case
  private listeners: ((newTargetRoom: RoomCoord) => void)[] = []
  
  // Get the current target room
  getCurrentTargetRoom(): RoomCoord {
    return { ...this.currentTargetRoom }
  }
  
  // Set a new target room
  setTargetRoom(newTargetRoom: RoomCoord) {
    if (newTargetRoom.row === this.currentTargetRoom.row && 
        newTargetRoom.col === this.currentTargetRoom.col) {
      return // No change
    }
    
    this.currentTargetRoom = { ...newTargetRoom }
    
    // Notify listeners
    this.listeners.forEach(listener => listener(newTargetRoom))
  }
  
  // Add a listener for target room changes
  addListener(listener: (newTargetRoom: RoomCoord) => void) {
    this.listeners.push(listener)
  }
  
  // Remove a listener
  removeListener(listener: (newTargetRoom: RoomCoord) => void) {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) {
      this.listeners.splice(index, 1)
    }
  }
  
  // Check if a given room is the current target room
  isTargetRoom(room: RoomCoord): boolean {
    return room.row === this.currentTargetRoom.row && 
           room.col === this.currentTargetRoom.col
  }
}