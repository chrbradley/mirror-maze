// ABOUTME: Mirror wall system for toggling reflective surfaces
// ABOUTME: Manages mirror states and visual representation

import p5 from 'p5'
import { roomToCanvas } from './coordinates'
import type { RoomCoord } from './coordinates'
import { COLORS, STROKE_WEIGHTS } from '../ui/theme'
import { ROOM_WIDTH, ROOM_HEIGHT, GRID_ROWS, GRID_COLS } from './grid'

export type WallPosition = 'N' | 'S' | 'E' | 'W'
export type MirrorState = 'disabled' | 'off' | 'on'

export class Mirror {
  public room: RoomCoord
  public wall: WallPosition
  public state: MirrorState
  
  constructor(room: RoomCoord, wall: WallPosition, state: MirrorState = 'disabled') {
    this.room = room
    this.wall = wall
    this.state = state
  }
  
  // Cycle through states
  public cycleState() {
    switch (this.state) {
      case 'disabled': this.state = 'off'; break
      case 'off': this.state = 'on'; break
      case 'on': this.state = 'disabled'; break
    }
  }
  
  // Get wall segment endpoints in room coordinates
  public getWallSegment(): { start: { x: number, y: number }, end: { x: number, y: number } } {
    switch (this.wall) {
      case 'N':
        return { start: { x: 0, y: 0 }, end: { x: ROOM_WIDTH, y: 0 } }
      case 'S':
        return { start: { x: 0, y: ROOM_HEIGHT }, end: { x: ROOM_WIDTH, y: ROOM_HEIGHT } }
      case 'E':
        return { start: { x: ROOM_WIDTH, y: 0 }, end: { x: ROOM_WIDTH, y: ROOM_HEIGHT } }
      case 'W':
        return { start: { x: 0, y: 0 }, end: { x: 0, y: ROOM_HEIGHT } }
    }
  }
}

export class MirrorManager {
  private mirrors: Mirror[] = []
  
  constructor() {
    this.initializeMirrors()
  }
  
  private initializeMirrors() {
    // Initialize mirrors based on room position
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const room = { row, col }
        
        // Top row: North walls are always disabled, South walls can toggle
        if (row === 0) {
          this.mirrors.push(new Mirror(room, 'N', 'disabled'))
          this.mirrors.push(new Mirror(room, 'S', 'off'))
        }
        
        // Bottom row: South walls are always disabled, North walls can toggle
        if (row === 1) {
          this.mirrors.push(new Mirror(room, 'S', 'disabled'))
          this.mirrors.push(new Mirror(room, 'N', 'off'))
        }
        
        // All rooms have E and W walls that can toggle
        this.mirrors.push(new Mirror(room, 'E', 'off'))
        this.mirrors.push(new Mirror(room, 'W', 'off'))
      }
    }
  }
  
  public getMirrors(): Mirror[] {
    return this.mirrors
  }
  
  // Draw all mirrors
  public drawMirrors(p: p5) {
    for (const mirror of this.mirrors) {
      const segment = mirror.getWallSegment()
      const startCanvas = roomToCanvas(mirror.room, segment.start)
      const endCanvas = roomToCanvas(mirror.room, segment.end)
      
      p.push()
      p.stroke(COLORS.CYAN)
      
      // Different stroke weights for different states
      if (mirror.state === 'disabled') {
        p.strokeWeight(STROKE_WEIGHTS.THIN)
      } else if (mirror.state === 'off') {
        p.strokeWeight(STROKE_WEIGHTS.MEDIUM)
      } else if (mirror.state === 'on') {
        p.strokeWeight(STROKE_WEIGHTS.EXTRA_THICK)
      }
      
      p.line(startCanvas.x, startCanvas.y, endCanvas.x, endCanvas.y)
      p.pop()
    }
  }
  
  // Handle click on mirrors
  public handleClick(p: p5): boolean {
    const mousePos = { x: p.mouseX, y: p.mouseY }
    
    for (const mirror of this.mirrors) {
      if (mirror.state === 'disabled') continue
      
      const segment = mirror.getWallSegment()
      const startCanvas = roomToCanvas(mirror.room, segment.start)
      const endCanvas = roomToCanvas(mirror.room, segment.end)
      
      // Check if click is near the wall segment (within 10 pixels)
      const dist = this.distanceToSegment(mousePos, startCanvas, endCanvas)
      
      if (dist < 10) {
        mirror.cycleState()
        return true
      }
    }
    
    return false
  }
  
  // Draw hover highlight
  public drawHoverHighlight(p: p5) {
    const mousePos = { x: p.mouseX, y: p.mouseY }
    
    for (const mirror of this.mirrors) {
      if (mirror.state === 'disabled') continue
      
      const segment = mirror.getWallSegment()
      const startCanvas = roomToCanvas(mirror.room, segment.start)
      const endCanvas = roomToCanvas(mirror.room, segment.end)
      
      const dist = this.distanceToSegment(mousePos, startCanvas, endCanvas)
      
      if (dist < 10) {
        p.push()
        p.stroke(COLORS.CYAN)
        p.strokeWeight(STROKE_WEIGHTS.THICK + 2)
        p.line(startCanvas.x, startCanvas.y, endCanvas.x, endCanvas.y)
        p.pop()
        break
      }
    }
  }
  
  // Calculate distance from point to line segment
  private distanceToSegment(
    point: { x: number, y: number },
    start: { x: number, y: number },
    end: { x: number, y: number }
  ): number {
    const A = point.x - start.x
    const B = point.y - start.y
    const C = end.x - start.x
    const D = end.y - start.y
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    
    if (lenSq !== 0) {
      param = dot / lenSq
    }
    
    let xx, yy
    
    if (param < 0) {
      xx = start.x
      yy = start.y
    } else if (param > 1) {
      xx = end.x
      yy = end.y
    } else {
      xx = start.x + param * C
      yy = start.y + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    
    return Math.sqrt(dx * dx + dy * dy)
  }
}