// ABOUTME: Grid rendering system for the 2x5 room layout
// ABOUTME: Handles drawing room boundaries and labels with proper spacing

import p5 from 'p5'
import { COLORS, STROKE_WEIGHTS } from '../ui/theme'

// Grid configuration constants
export const ROOM_WIDTH = 240
export const ROOM_HEIGHT = 240
export const GRID_COLS = 5
export const GRID_ROWS = 2

// Calculate grid positioning
const GRID_TOTAL_WIDTH = GRID_COLS * ROOM_WIDTH
const GRID_TOTAL_HEIGHT = GRID_ROWS * ROOM_HEIGHT
export const CANVAS_WIDTH = 1280
export const CANVAS_HEIGHT = 600
export const TOTAL_HEIGHT = 720 // Including control panel area
const GRID_OFFSET_X = (CANVAS_WIDTH - GRID_TOTAL_WIDTH) / 2
const GRID_OFFSET_Y = (CANVAS_HEIGHT - GRID_TOTAL_HEIGHT) / 2

// Draw the grid of rooms
export function drawGrid(p: p5, homeRoom?: {row: number, col: number}, targetRoom?: {row: number, col: number}) {
  p.push()
  
  // Draw room boundaries with varying opacity based on active status
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = GRID_OFFSET_X + col * ROOM_WIDTH
      const y = GRID_OFFSET_Y + row * ROOM_HEIGHT
      
      // Check if this room is active (home or target)
      const isHomeRoom = homeRoom && homeRoom.row === row && homeRoom.col === col
      const isTargetRoom = targetRoom && targetRoom.row === row && targetRoom.col === col
      const isActiveRoom = isHomeRoom || isTargetRoom
      
      // Set stroke opacity based on room status
      if (isActiveRoom) {
        p.stroke(COLORS.CYAN) // Full opacity for active rooms
      } else {
        p.stroke(0, 255, 255, 128) // Half opacity for inactive rooms
      }
      p.strokeWeight(STROKE_WEIGHTS.MEDIUM)
      p.noFill()
      p.rect(x, y, ROOM_WIDTH, ROOM_HEIGHT)
    }
  }
  
  // Room indices removed to avoid UI clutter with radio buttons
  
  p.pop()
}

// Get the grid offset for external use
export function getGridOffset() {
  return { x: GRID_OFFSET_X, y: GRID_OFFSET_Y }
}

// Draw test dots at the center of each room
export function drawTestDots(p: p5) {
  p.push()
  p.fill(COLORS.CYAN)
  p.noStroke()
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = GRID_OFFSET_X + col * ROOM_WIDTH + ROOM_WIDTH / 2
      const y = GRID_OFFSET_Y + row * ROOM_HEIGHT + ROOM_HEIGHT / 2
      
      p.circle(x, y, 8)
    }
  }
  
  p.pop()
}

// Draw an 'F' shape for testing mirroring
export function drawTestF(p: p5, x: number, y: number, size: number = 40) {
  p.push()
  p.stroke(COLORS.CYAN)
  p.strokeWeight(STROKE_WEIGHTS.MEDIUM)
  p.noFill()
  
  // Draw the F shape
  p.beginShape()
  p.vertex(x, y)
  p.vertex(x, y + size)
  p.vertex(x, y)
  p.vertex(x + size * 0.7, y)
  p.vertex(x, y)
  p.vertex(x, y + size * 0.5)
  p.vertex(x + size * 0.5, y + size * 0.5)
  p.endShape()
  
  p.pop()
}