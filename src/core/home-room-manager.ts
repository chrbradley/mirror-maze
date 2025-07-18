// ABOUTME: Manages which room is currently the home room where entities can be dragged
// ABOUTME: Handles transitions when switching between different home rooms

import type { RoomCoord } from './coordinates'
import { EntityManager } from './entities'

export class HomeRoomManager {
  private currentHomeRoom: RoomCoord = { row: 0, col: 1 }
  private listeners: ((newHomeRoom: RoomCoord) => void)[] = []
  
  constructor(private entityManager: EntityManager) {}
  
  // Get the current home room
  getCurrentHomeRoom(): RoomCoord {
    return { ...this.currentHomeRoom }
  }
  
  // Set a new home room
  setHomeRoom(newHomeRoom: RoomCoord) {
    if (newHomeRoom.row === this.currentHomeRoom.row && 
        newHomeRoom.col === this.currentHomeRoom.col) {
      return // No change
    }
    
    const oldHomeRoom = { ...this.currentHomeRoom }
    this.currentHomeRoom = { ...newHomeRoom }
    
    // Update all entities to be in the new home room
    const entities = this.entityManager.getEntities()
    for (const entity of entities) {
      entity.homeRoom = { ...newHomeRoom }
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener(newHomeRoom))
  }
  
  // Add a listener for home room changes
  addListener(listener: (newHomeRoom: RoomCoord) => void) {
    this.listeners.push(listener)
  }
  
  // Remove a listener
  removeListener(listener: (newHomeRoom: RoomCoord) => void) {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) {
      this.listeners.splice(index, 1)
    }
  }
  
  // Check if a given room is the current home room
  isHomeRoom(room: RoomCoord): boolean {
    return room.row === this.currentHomeRoom.row && 
           room.col === this.currentHomeRoom.col
  }
}