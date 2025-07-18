// ABOUTME: Entity system for objects and receptors in the mirror maze
// ABOUTME: Manages game entities with position tracking and rendering

import p5 from 'p5'
import { roomToCanvas, getMirroredRoomPoint } from './coordinates'
import type { RoomCoord, Point2D } from './coordinates'
import { drawCyanOutline } from '../ui/theme'
import { GRID_ROWS, GRID_COLS } from './grid'

// Base entity class
export abstract class Entity {
  public position: Point2D
  public homeRoom: RoomCoord
  public isDraggable: boolean = false
  
  constructor(homeRoom: RoomCoord, position: Point2D) {
    this.homeRoom = homeRoom
    this.position = position
  }
  
  // Draw the entity in all rooms with proper mirroring
  public drawInAllRooms(p: p5) {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const room: RoomCoord = { row, col }
        const mirroredPos = getMirroredRoomPoint(room, this.position)
        const canvasPos = roomToCanvas(room, mirroredPos)
        this.drawAt(p, canvasPos.x, canvasPos.y)
      }
    }
  }
  
  // Abstract method to draw the entity at a specific position
  protected abstract drawAt(p: p5, x: number, y: number): void
}

// Object entity (cyan triangle)
export class ObjectEntity extends Entity {
  constructor(homeRoom: RoomCoord, position: Point2D) {
    super(homeRoom, position)
    this.isDraggable = true
  }
  
  protected drawAt(p: p5, x: number, y: number) {
    drawCyanOutline(p, () => {
      p.triangle(x, y - 15, x - 15, y + 15, x + 15, y + 15)
    })
  }
}

// Receptor entity (cyan circle)
export class ReceptorEntity extends Entity {
  constructor(homeRoom: RoomCoord, position: Point2D) {
    super(homeRoom, position)
    this.isDraggable = true
  }
  
  protected drawAt(p: p5, x: number, y: number) {
    drawCyanOutline(p, () => {
      p.circle(x, y, 30)
    })
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
  
  public drawAll(p: p5) {
    for (const entity of this.entities) {
      entity.drawInAllRooms(p)
    }
  }
}