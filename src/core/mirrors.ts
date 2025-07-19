// ABOUTME: Mirror wall system for toggling reflective surfaces
// ABOUTME: Manages mirror states and visual representation

import p5 from 'p5'
import { roomToCanvas } from './coordinates'
import type { RoomCoord } from './coordinates'
import { COLORS, STROKE_WEIGHTS } from '../ui/theme'
import { ROOM_WIDTH, ROOM_HEIGHT, GRID_ROWS, GRID_COLS } from './grid'
import { HomeRoomManager } from './home-room-manager'
import { TargetRoomManager } from './target-room-manager'

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
  
  // Cycle through states (only between off and on for toggleable walls)
  public cycleState() {
    if (this.state === 'disabled') return // Disabled walls can't be toggled
    
    switch (this.state) {
      case 'off': this.state = 'on'; break
      case 'on': this.state = 'off'; break
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
  private wallStates: Map<WallPosition, MirrorState> = new Map()
  
  constructor(
    private homeRoomManager: HomeRoomManager,
    private targetRoomManager?: TargetRoomManager
  ) {
    this.initializeMirrors()
    this.initializeWallStates()
    
    // Store previous home room for state transfer
    let previousHomeRoom = this.homeRoomManager.getCurrentHomeRoom()
    
    // Listen for home room changes
    this.homeRoomManager.addListener((newHomeRoom) => {
      this.transferWallStates(previousHomeRoom, newHomeRoom)
      previousHomeRoom = newHomeRoom
      this.autoEnableRequiredMirrors()
    })
    
    // Listen for target room changes
    if (this.targetRoomManager) {
      this.targetRoomManager.addListener(() => {
        this.autoEnableRequiredMirrors()
      })
    }
    
    // Enable mirrors for initial configuration
    this.autoEnableRequiredMirrors()
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
  
  // Get only the mirrors in the home room that are turned on
  public getActiveHomeMirrors(): Mirror[] {
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    return this.mirrors.filter(m => 
      m.room.row === homeRoom.row && 
      m.room.col === homeRoom.col && 
      m.state === 'on'
    )
  }
  
  private initializeWallStates() {
    // Store initial wall states from the current home room
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    const homeMirrors = this.mirrors.filter(m => 
      m.room.row === homeRoom.row && m.room.col === homeRoom.col
    )
    
    for (const mirror of homeMirrors) {
      if (mirror.state !== 'disabled') {
        this.wallStates.set(mirror.wall, mirror.state)
      }
    }
  }
  
  private transferWallStates(previousHomeRoom: RoomCoord, newHomeRoom: RoomCoord) {
    // Save previous home room wall states
    const previousHomeMirrors = this.mirrors.filter(m => 
      m.room.row === previousHomeRoom.row && m.room.col === previousHomeRoom.col
    )
    
    // Update saved states from previous home room
    for (const mirror of previousHomeMirrors) {
      if (mirror.state !== 'disabled') {
        this.wallStates.set(mirror.wall, mirror.state)
      }
    }
    
    // Reset all non-home room mirrors to 'off'
    for (const mirror of this.mirrors) {
      if (mirror.state !== 'disabled' && 
          (mirror.room.row !== newHomeRoom.row || mirror.room.col !== newHomeRoom.col)) {
        mirror.state = 'off'
      }
    }
    
    // Apply saved states to new home room
    const newHomeMirrors = this.mirrors.filter(m => 
      m.room.row === newHomeRoom.row && m.room.col === newHomeRoom.col
    )
    
    for (const mirror of newHomeMirrors) {
      if (mirror.state !== 'disabled' && this.wallStates.has(mirror.wall)) {
        mirror.state = this.wallStates.get(mirror.wall)!
      }
    }
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
  
  // Handle click on mirrors (only in home room)
  public handleClick(p: p5): boolean {
    const mousePos = { x: p.mouseX, y: p.mouseY }
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    
    for (const mirror of this.mirrors) {
      // Only allow clicking mirrors in the home room
      if (mirror.room.row !== homeRoom.row || mirror.room.col !== homeRoom.col) continue
      if (mirror.state === 'disabled') continue
      
      const segment = mirror.getWallSegment()
      const startCanvas = roomToCanvas(mirror.room, segment.start)
      const endCanvas = roomToCanvas(mirror.room, segment.end)
      
      // Check if click is near the wall segment (within 10 pixels)
      const dist = this.distanceToSegment(mousePos, startCanvas, endCanvas)
      
      if (dist < 10) {
        mirror.cycleState()
        // Update saved wall states
        if (mirror.state === 'on' || mirror.state === 'off') {
          this.wallStates.set(mirror.wall, mirror.state)
        }
        return true
      }
    }
    
    return false
  }
  
  // Draw hover highlight (only for home room mirrors)
  public drawHoverHighlight(p: p5) {
    const mousePos = { x: p.mouseX, y: p.mouseY }
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    
    for (const mirror of this.mirrors) {
      // Only show hover for mirrors in the home room
      if (mirror.room.row !== homeRoom.row || mirror.room.col !== homeRoom.col) continue
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
  
  // Auto-enable mirrors needed to reach target room
  private autoEnableRequiredMirrors() {
    if (!this.targetRoomManager) return
    
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    const targetRoom = this.targetRoomManager.getCurrentTargetRoom()
    
    // Reset all home room mirrors to 'off'
    const homeMirrors = this.mirrors.filter(m => 
      m.room.row === homeRoom.row && 
      m.room.col === homeRoom.col &&
      m.state !== 'disabled'
    )
    
    for (const mirror of homeMirrors) {
      mirror.state = 'off'
    }
    
    // Calculate which mirrors to enable
    const rowDiff = targetRoom.row - homeRoom.row
    const colDiff = targetRoom.col - homeRoom.col
    
    // Enable mirrors based on direction to target
    if (colDiff > 0) {
      // Target is to the right - enable East mirror
      const eastMirror = homeMirrors.find(m => m.wall === 'E')
      if (eastMirror) eastMirror.state = 'on'
    } else if (colDiff < 0) {
      // Target is to the left - enable West mirror
      const westMirror = homeMirrors.find(m => m.wall === 'W')
      if (westMirror) westMirror.state = 'on'
    }
    
    if (rowDiff > 0) {
      // Target is below - enable South mirror
      const southMirror = homeMirrors.find(m => m.wall === 'S')
      if (southMirror) southMirror.state = 'on'
    } else if (rowDiff < 0) {
      // Target is above - enable North mirror
      const northMirror = homeMirrors.find(m => m.wall === 'N')
      if (northMirror) northMirror.state = 'on'
    }
    
    // Update saved wall states
    for (const mirror of homeMirrors) {
      if (mirror.state !== 'disabled') {
        this.wallStates.set(mirror.wall, mirror.state)
      }
    }
  }
}