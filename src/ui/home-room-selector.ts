// ABOUTME: UI component for selecting which room is the home room
// ABOUTME: Draws radio buttons in each room and handles selection

import p5 from 'p5'
import type { RoomCoord } from '../core/coordinates'
import { roomToCanvas } from '../core/coordinates'
import { COLORS } from './theme'
import { ROOM_WIDTH, ROOM_HEIGHT, GRID_ROWS, GRID_COLS } from '../core/grid'
import { HomeRoomManager } from '../core/home-room-manager'

export class HomeRoomSelector {
  private radioSize = 12
  private radioOffset = { x: 20, y: 20 } // Position from top-left of room
  
  constructor(private homeRoomManager: HomeRoomManager) {}
  
  // Draw radio buttons in all rooms
  drawRadioButtons(p: p5) {
    const currentHomeRoom = this.homeRoomManager.getCurrentHomeRoom()
    
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const room: RoomCoord = { row, col }
        const isSelected = room.row === currentHomeRoom.row && room.col === currentHomeRoom.col
        
        // Get canvas position for radio button
        const canvasPos = roomToCanvas(room, this.radioOffset)
        
        // Draw radio button
        p.push()
        p.stroke(COLORS.CYAN)
        p.strokeWeight(2)
        
        if (isSelected) {
          p.fill(COLORS.CYAN)
        } else {
          p.noFill()
        }
        
        p.circle(canvasPos.x, canvasPos.y, this.radioSize)
        
        // Draw "HOME" label next to selected radio
        if (isSelected) {
          p.noStroke()
          p.fill(COLORS.CYAN)
          p.textAlign(p.LEFT, p.CENTER)
          p.textSize(10)
          p.text('HOME', canvasPos.x + this.radioSize, canvasPos.y)
        }
        
        p.pop()
      }
    }
  }
  
  // Handle mouse click on radio buttons
  handleMouseClick(mouseX: number, mouseY: number): boolean {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const room: RoomCoord = { row, col }
        const canvasPos = roomToCanvas(room, this.radioOffset)
        
        // Check if click is within radio button
        const dist = Math.sqrt(
          Math.pow(mouseX - canvasPos.x, 2) + 
          Math.pow(mouseY - canvasPos.y, 2)
        )
        
        if (dist <= this.radioSize / 2) {
          this.homeRoomManager.setHomeRoom(room)
          return true // Click was handled
        }
      }
    }
    
    return false // Click was not on a radio button
  }
  
  // Check if mouse is over a radio button (for hover effect)
  isMouseOverRadio(mouseX: number, mouseY: number): boolean {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const room: RoomCoord = { row, col }
        const canvasPos = roomToCanvas(room, this.radioOffset)
        
        const dist = Math.sqrt(
          Math.pow(mouseX - canvasPos.x, 2) + 
          Math.pow(mouseY - canvasPos.y, 2)
        )
        
        if (dist <= this.radioSize / 2) {
          return true
        }
      }
    }
    
    return false
  }
}