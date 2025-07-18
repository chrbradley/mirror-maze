// ABOUTME: Drag and drop system for sandbox mode
// ABOUTME: Handles mouse interactions for draggable entities in the home room

import p5 from 'p5'
import { Entity } from './entities'
import { canvasToRoom, roomToCanvas } from './coordinates'
import type { Point2D } from './coordinates'
import { COLORS } from '../ui/theme'

export class DragManager {
  private currentDrag: Entity | null = null
  private dragOffset: Point2D = { x: 0, y: 0 }
  
  // Check if mouse is over an entity in the home room
  private getEntityAtPosition(entities: Entity[], p: p5): Entity | null {
    const mousePos = { x: p.mouseX, y: p.mouseY }
    const result = canvasToRoom(mousePos)
    
    if (!result) return null
    
    // Only allow dragging in home room (0,0)
    if (result.room.row !== 0 || result.room.col !== 0) return null
    
    // Check each draggable entity
    for (const entity of entities) {
      if (!entity.isDraggable) continue
      if (entity.homeRoom.row !== 0 || entity.homeRoom.col !== 0) continue
      
      // Check if mouse is within 20 pixels of entity position
      const dist = Math.sqrt(
        Math.pow(entity.position.x - result.localPoint.x, 2) +
        Math.pow(entity.position.y - result.localPoint.y, 2)
      )
      
      if (dist < 20) {
        return entity
      }
    }
    
    return null
  }
  
  // Handle mouse pressed
  public handleMousePressed(entities: Entity[], p: p5) {
    const entity = this.getEntityAtPosition(entities, p)
    
    if (entity) {
      this.currentDrag = entity
      const result = canvasToRoom({ x: p.mouseX, y: p.mouseY })
      if (result) {
        this.dragOffset = {
          x: entity.position.x - result.localPoint.x,
          y: entity.position.y - result.localPoint.y
        }
      }
    }
  }
  
  // Handle mouse dragged
  public handleMouseDragged(p: p5) {
    if (!this.currentDrag) return
    
    const result = canvasToRoom({ x: p.mouseX, y: p.mouseY })
    if (!result) return
    
    // Only allow dragging within home room (0,0)
    if (result.room.row !== 0 || result.room.col !== 0) return
    
    // Update entity position with offset
    this.currentDrag.position = {
      x: Math.max(10, Math.min(230, result.localPoint.x + this.dragOffset.x)),
      y: Math.max(10, Math.min(230, result.localPoint.y + this.dragOffset.y))
    }
  }
  
  // Handle mouse released
  public handleMouseReleased() {
    this.currentDrag = null
  }
  
  // Draw hover highlight
  public drawHoverHighlight(entities: Entity[], p: p5) {
    const entity = this.getEntityAtPosition(entities, p)
    
    if (entity && !this.currentDrag) {
      const canvasPos = roomToCanvas({ row: 0, col: 0 }, entity.position)
      p.push()
      p.noFill()
      p.stroke(COLORS.CYAN)
      p.strokeWeight(1)
      p.circle(canvasPos.x, canvasPos.y, 40)
      p.pop()
    }
  }
  
  // Check if currently dragging
  public isDragging(): boolean {
    return this.currentDrag !== null
  }
}