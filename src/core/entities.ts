// ABOUTME: Entity system for objects and receptors in the mirror maze
// ABOUTME: Manages game entities with position tracking and rendering

import p5 from 'p5'
import { roomToCanvas, getMirroredRoomPoint, isRoomFlippedX, isRoomFlippedY } from './coordinates'
import type { RoomCoord, Point2D } from './coordinates'
import { GRID_ROWS, GRID_COLS } from './grid'

// Base entity class
export abstract class Entity {
  public position: Point2D
  public homeRoom: RoomCoord
  public isDraggable: boolean = false
  public abstract readonly type: string
  
  constructor(homeRoom: RoomCoord, position: Point2D) {
    this.homeRoom = homeRoom
    this.position = position
  }
  
  // Draw the entity in all rooms with proper mirroring
  public drawInAllRooms(p: p5, homeRoom?: RoomCoord, targetRoom?: RoomCoord) {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const room: RoomCoord = { row, col }
        const mirroredPos = getMirroredRoomPoint(room, this.position)
        const canvasPos = roomToCanvas(room, mirroredPos)
        
        // Check if this room is active (home or target)
        const isHomeRoom = homeRoom && homeRoom.row === row && homeRoom.col === col
        const isTargetRoom = targetRoom && targetRoom.row === row && targetRoom.col === col
        const isActiveRoom = isHomeRoom || isTargetRoom
        
        this.drawAt(p, canvasPos.x, canvasPos.y, room, isActiveRoom)
      }
    }
  }
  
  // Abstract method to draw the entity at a specific position
  protected abstract drawAt(p: p5, x: number, y: number, room: RoomCoord, isActiveRoom?: boolean): void
}

// Object entity (cyan triangle)
export class ObjectEntity extends Entity {
  public readonly type = 'object'
  private rotation: number
  
  constructor(homeRoom: RoomCoord, position: Point2D) {
    super(homeRoom, position)
    this.isDraggable = true
    // Random rotation between -45 and +45 degrees
    this.rotation = (Math.random() - 0.5) * Math.PI / 2
  }
  
  protected drawAt(p: p5, x: number, y: number, room: RoomCoord, isActiveRoom: boolean = true) {
    const flipX = isRoomFlippedX(room.col)
    const flipY = isRoomFlippedY(room.row)
    
    p.push()
    p.translate(x, y)
    if (flipX) p.scale(-1, 1)
    if (flipY) p.scale(1, -1)
    p.rotate(this.rotation)
    
    // Draw triangle with appropriate opacity
    p.noFill()
    if (isActiveRoom) {
      p.stroke(0, 255, 255) // Full opacity cyan
    } else {
      p.stroke(0, 255, 255, 128) // Half opacity cyan
    }
    p.strokeWeight(2)
    p.triangle(0, -15, -15, 15, 15, 15)
    
    // Single cyan dot at top vertex for mirroring validation
    p.push()
    if (isActiveRoom) {
      p.fill(0, 255, 255) // Full opacity cyan
    } else {
      p.fill(0, 255, 255, 128) // Half opacity cyan
    }
    p.noStroke()
    p.circle(0, -15, 6)
    p.pop()
    
    p.pop()
  }
}

// Receptor entity (cyan circle with colored dots)
export class ReceptorEntity extends Entity {
  public readonly type = 'receptor'
  private rotation: number
  
  constructor(homeRoom: RoomCoord, position: Point2D) {
    super(homeRoom, position)
    this.isDraggable = true
    // Initial rotation
    this.rotation = 0
  }
  
  // Update rotation to aim at target
  public aimAt(targetPosition: Point2D) {
    // Calculate angle from receptor to target
    const mirroredReceptorPos = getMirroredRoomPoint(this.homeRoom, this.position)
    const receptorCanvasPos = roomToCanvas(this.homeRoom, mirroredReceptorPos)
    
    let dx = targetPosition.x - receptorCanvasPos.x
    let dy = targetPosition.y - receptorCanvasPos.y
    
    // Account for mirroring transformations that will be applied during drawing
    const flipX = isRoomFlippedX(this.homeRoom.col)
    const flipY = isRoomFlippedY(this.homeRoom.row)
    
    // If room is flipped, we need to adjust the target direction 
    // to account for the coordinate system flip that happens in drawAt
    if (flipX) dx = -dx
    if (flipY) dy = -dy
    
    this.rotation = Math.atan2(dy, dx)
  }
  
  protected drawAt(p: p5, x: number, y: number, room: RoomCoord, isActiveRoom: boolean = true) {
    const flipX = isRoomFlippedX(room.col)
    const flipY = isRoomFlippedY(room.row)
    
    p.push()
    p.translate(x, y)
    if (flipX) p.scale(-1, 1)
    if (flipY) p.scale(1, -1)
    p.rotate(this.rotation)
    
    // Draw circle with appropriate opacity
    p.noFill()
    if (isActiveRoom) {
      p.stroke(0, 255, 255) // Full opacity cyan
    } else {
      p.stroke(0, 255, 255, 128) // Half opacity cyan
    }
    p.strokeWeight(2)
    p.circle(0, 0, 30)
    
    // Single cyan dot at right position for mirroring validation
    const radius = 18
    const dotX = radius * Math.cos(0) // Right position
    const dotY = radius * Math.sin(0)
    
    p.push()
    if (isActiveRoom) {
      p.fill(0, 255, 255) // Full opacity cyan
    } else {
      p.fill(0, 255, 255, 128) // Half opacity cyan
    }
    p.noStroke()
    p.circle(dotX, dotY, 8)
    p.pop()
    
    p.pop()
  }
}

// Entity manager to track all entities
export class EntityManager {
  private entities: Entity[] = []
  
  public addEntity(entity: Entity) {
    this.entities.push(entity)
  }
  
  public getEntities(): Entity[] {
    return this.entities
  }
  
  public drawAll(p: p5, homeRoom?: RoomCoord, targetRoom?: RoomCoord) {
    for (const entity of this.entities) {
      entity.drawInAllRooms(p, homeRoom, targetRoom)
    }
  }
}