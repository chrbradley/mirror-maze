// ABOUTME: UI component for selecting which room is the target for ray reflections
// ABOUTME: Draws square radio buttons in each room and handles selection

import p5 from 'p5'
import type { RoomCoord } from '../core/coordinates'
import { roomToCanvas } from '../core/coordinates'
import { COLORS } from './theme'
import { ROOM_WIDTH, ROOM_HEIGHT, GRID_ROWS, GRID_COLS } from '../core/grid'
import { TargetRoomManager } from '../core/target-room-manager'

export class TargetRoomSelector {
  private radioSize = 12
  // Position in bottom-right corner of room to avoid overlap with home selector
  private radioOffset = { x: ROOM_WIDTH - 30, y: ROOM_HEIGHT - 30 }
  
  constructor(private targetRoomManager: TargetRoomManager) {}
  
  // Draw square radio buttons in all rooms
  drawRadioButtons(p: p5) {
    const currentTargetRoom = this.targetRoomManager.getCurrentTargetRoom()
    
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const room: RoomCoord = { row, col }
        const isSelected = room.row === currentTargetRoom.row && room.col === currentTargetRoom.col
        
        // Get canvas position for radio button
        const canvasPos = roomToCanvas(room, this.radioOffset)
        
        // Draw square radio button
        p.push()
        p.stroke(COLORS.NEON_GREEN)
        p.strokeWeight(2)
        
        if (isSelected) {
          p.fill(COLORS.NEON_GREEN)
        } else {
          p.noFill()
        }
        
        // Draw square instead of circle
        p.rectMode(p.CENTER)
        p.rect(canvasPos.x, canvasPos.y, this.radioSize, this.radioSize)
        
        // Draw "TARGET" label next to selected radio
        if (isSelected) {
          p.noStroke()
          p.fill(COLORS.NEON_GREEN)
          p.textAlign(p.RIGHT, p.CENTER)
          p.textSize(10)
          p.text('TARGET', canvasPos.x - this.radioSize, canvasPos.y)
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
        
        // Check if click is within square radio button
        const halfSize = this.radioSize / 2
        if (mouseX >= canvasPos.x - halfSize && mouseX <= canvasPos.x + halfSize &&
            mouseY >= canvasPos.y - halfSize && mouseY <= canvasPos.y + halfSize) {
          this.targetRoomManager.setTargetRoom(room)
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
        
        const halfSize = this.radioSize / 2
        if (mouseX >= canvasPos.x - halfSize && mouseX <= canvasPos.x + halfSize &&
            mouseY >= canvasPos.y - halfSize && mouseY <= canvasPos.y + halfSize) {
          return true
        }
      }
    }
    
    return false
  }
}