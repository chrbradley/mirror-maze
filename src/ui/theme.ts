// ABOUTME: Theme constants and styling utilities for retro vector monitor aesthetic
// ABOUTME: Provides colors, stroke weights, and helper drawing functions

import p5 from 'p5'

// Color constants
export const COLORS = {
  BACKGROUND: '#000000',
  CYAN: '#00FFFF',
  NEON_GREEN: '#00FF00',
  ERROR_RED: '#FF0000',
} as const

// Stroke weight constants
export const STROKE_WEIGHTS = {
  THIN: 1,
  MEDIUM: 2,
  THICK: 4,
  EXTRA_THICK: 8,
} as const

// Font configuration
export const FONT_CONFIG = {
  FAMILY: 'monospace',
  SIZE_SMALL: 10,
  SIZE_MEDIUM: 14,
  SIZE_LARGE: 18,
} as const

// Helper function to draw cyan outline shapes
export function drawCyanOutline(p: p5, drawFunc: () => void) {
  p.push()
  p.noFill()
  p.stroke(COLORS.CYAN)
  p.strokeWeight(STROKE_WEIGHTS.MEDIUM)
  drawFunc()
  p.pop()
}

// Helper function to draw neon green lines with glow effect
export function drawNeonLine(p: p5, x1: number, y1: number, x2: number, y2: number) {
  p.push()
  
  // Draw glow effect (multiple lines with decreasing opacity)
  for (let i = 3; i >= 0; i--) {
    const alpha = 50 + i * 50
    p.stroke(0, 255, 0, alpha)
    p.strokeWeight(STROKE_WEIGHTS.THICK - i * 0.5)
    p.line(x1, y1, x2, y2)
  }
  
  // Draw core line
  p.stroke(COLORS.NEON_GREEN)
  p.strokeWeight(STROKE_WEIGHTS.THIN)
  p.line(x1, y1, x2, y2)
  
  p.pop()
}

// Helper function to apply monospace font
export function applyFont(p: p5, size: number = FONT_CONFIG.SIZE_MEDIUM) {
  p.textFont(FONT_CONFIG.FAMILY)
  p.textSize(size)
}