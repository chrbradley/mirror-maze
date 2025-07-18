// ABOUTME: Grid rendering system for the 2x5 room layout
// ABOUTME: Handles drawing room boundaries and labels with proper spacing

import p5 from 'p5'
import { COLORS, STROKE_WEIGHTS, drawCyanOutline, applyFont, FONT_CONFIG } from '../ui/theme'

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
const GRID_OFFSET_X = (CANVAS_WIDTH - GRID_TOTAL_WIDTH) / 2
const GRID_OFFSET_Y = (CANVAS_HEIGHT - GRID_TOTAL_HEIGHT) / 2

// Draw the grid of rooms
export function drawGrid(p: p5) {
  p.push()
  
  // Draw room boundaries
  drawCyanOutline(p, () => {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = GRID_OFFSET_X + col * ROOM_WIDTH
        const y = GRID_OFFSET_Y + row * ROOM_HEIGHT
        
        p.rect(x, y, ROOM_WIDTH, ROOM_HEIGHT)
      }
    }
  })
  
  // Draw room indices
  p.fill(COLORS.CYAN)
  p.noStroke()
  applyFont(p, FONT_CONFIG.SIZE_SMALL)
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = GRID_OFFSET_X + col * ROOM_WIDTH + 5
      const y = GRID_OFFSET_Y + row * ROOM_HEIGHT + 15
      
      p.text(`(${row},${col})`, x, y)
    }
  }
  
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