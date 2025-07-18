// ABOUTME: Entry point for the Mirror Maze application
// ABOUTME: Sets up p5.js instance mode and renders the room grid

import './style.css'
import p5 from 'p5'
import { COLORS } from './ui/theme'
import { drawGrid, CANVAS_WIDTH, CANVAS_HEIGHT } from './core/grid'
import { EntityManager, ObjectEntity, ReceptorEntity } from './core/entities'
import { DragManager } from './core/drag-manager'
import { MirrorManager } from './core/mirrors'

const sketch = (p: p5) => {
  // Create managers and entities
  const entityManager = new EntityManager()
  const dragManager = new DragManager()
  const mirrorManager = new MirrorManager()
  
  // Create an object at room (0,0) center
  const object = new ObjectEntity({ row: 0, col: 0 }, { x: 120, y: 120 })
  entityManager.addEntity(object)
  
  // Create a receptor at room (0,0) different position
  const receptor = new ReceptorEntity({ row: 0, col: 0 }, { x: 180, y: 180 })
  entityManager.addEntity(receptor)
  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    canvas.parent('canvas-container')
  }

  p.draw = () => {
    p.background(COLORS.BACKGROUND)
    
    // Draw the room grid
    drawGrid(p)
    
    // Draw mirrors
    mirrorManager.drawMirrors(p)
    
    // Draw all entities
    entityManager.drawAll(p)
    
    // Draw hover highlights
    dragManager.drawHoverHighlight(entityManager.getEntities(), p)
    mirrorManager.drawHoverHighlight(p)
  }
  
  // Mouse interactions
  p.mousePressed = () => {
    // Try mirror click first
    const mirrorClicked = mirrorManager.handleClick(p)
    
    // If no mirror clicked, try entity drag
    if (!mirrorClicked) {
      dragManager.handleMousePressed(entityManager.getEntities(), p)
    }
  }
  
  p.mouseDragged = () => {
    dragManager.handleMouseDragged(p)
  }
  
  p.mouseReleased = () => {
    dragManager.handleMouseReleased()
  }
}

new p5(sketch)