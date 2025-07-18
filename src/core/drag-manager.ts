// ABOUTME: Drag and drop system for sandbox mode
// ABOUTME: Handles mouse interactions for draggable entities in the home room

import p5 from 'p5'
import { Entity } from './entities'
import { canvasToRoom, roomToCanvas, isRoomFlippedX, isRoomFlippedY, mirrorPoint, getMirroredRoomPoint } from './coordinates'
import type { Point2D, RoomCoord } from './coordinates'
import { COLORS } from '../ui/theme'
import { HomeRoomManager } from './home-room-manager'

export class DragManager {
  private currentDrag: Entity | null = null
  private dragOffset: Point2D = { x: 0, y: 0 }
  
  constructor(private homeRoomManager: HomeRoomManager) {}
  
  // Check if mouse is over an entity in the home room
  private getEntityAtPosition(entities: Entity[], p: p5): Entity | null {
    const mousePos = { x: p.mouseX, y: p.mouseY }
    const result = canvasToRoom(mousePos)
    
    if (!result) return null
    
    // Only allow dragging in home room
    if (!this.homeRoomManager.isHomeRoom(result.room)) return null
    
    // Check each draggable entity
    for (const entity of entities) {
      if (!entity.isDraggable) continue
      if (!this.homeRoomManager.isHomeRoom(entity.homeRoom)) continue
      
      // Convert mouse position to entity's local space (accounting for flips)
      const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
      const mouseInLocalSpace = mirrorPoint(
        result.localPoint,
        isRoomFlippedX(homeRoom.col),
        isRoomFlippedY(homeRoom.row)
      )
      
      // Check if mouse is within 20 pixels of entity position
      const dist = Math.sqrt(
        Math.pow(entity.position.x - mouseInLocalSpace.x, 2) +
        Math.pow(entity.position.y - mouseInLocalSpace.y, 2)
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
        // Convert mouse position to entity's local space (accounting for flips)
        const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
        const mouseInLocalSpace = mirrorPoint(
          result.localPoint,
          isRoomFlippedX(homeRoom.col),
          isRoomFlippedY(homeRoom.row)
        )
        this.dragOffset = {
          x: entity.position.x - mouseInLocalSpace.x,
          y: entity.position.y - mouseInLocalSpace.y
        }
      }
    }
  }
  
  // Handle mouse dragged
  public handleMouseDragged(p: p5) {
    if (!this.currentDrag) return
    
    const result = canvasToRoom({ x: p.mouseX, y: p.mouseY })
    if (!result) return
    
    // Only allow dragging within home room
    if (!this.homeRoomManager.isHomeRoom(result.room)) return
    
    // Convert mouse position to entity's local space (accounting for flips)
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    const mouseInLocalSpace = mirrorPoint(
      result.localPoint,
      isRoomFlippedX(homeRoom.col),
      isRoomFlippedY(homeRoom.row)
    )
    
    // Update entity position with offset
    this.currentDrag.position = {
      x: Math.max(10, Math.min(230, mouseInLocalSpace.x + this.dragOffset.x)),
      y: Math.max(10, Math.min(230, mouseInLocalSpace.y + this.dragOffset.y))
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
      const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
      // Apply the same mirroring transformation as when drawing entities
      const mirroredPos = getMirroredRoomPoint(homeRoom, entity.position)
      const canvasPos = roomToCanvas(homeRoom, mirroredPos)
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