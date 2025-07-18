// ABOUTME: Entry point for the Mirror Maze application
// ABOUTME: Sets up p5.js instance mode and renders the room grid

import './style.css'
import p5 from 'p5'
import { COLORS } from './ui/theme'
import { drawGrid, CANVAS_WIDTH, CANVAS_HEIGHT, TOTAL_HEIGHT } from './core/grid'
import { EntityManager, ObjectEntity, ReceptorEntity } from './core/entities'
import { DragManager } from './core/drag-manager'
import { MirrorManager } from './core/mirrors'
import { Controls, type GameMode } from './ui/controls'

const sketch = (p: p5) => {
  // Create managers and entities
  const entityManager = new EntityManager()
  const dragManager = new DragManager()
  const mirrorManager = new MirrorManager()
  let controls: Controls
  
  
  // Create an object at room (0,0) center
  const object = new ObjectEntity({ row: 0, col: 0 }, { x: 120, y: 120 })
  entityManager.addEntity(object)
  
  // Create a receptor at room (0,0) different position
  const receptor = new ReceptorEntity({ row: 0, col: 0 }, { x: 180, y: 180 })
  entityManager.addEntity(receptor)
  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_WIDTH, TOTAL_HEIGHT)
    canvas.parent('canvas-container')
    
    // Initialize controls
    controls = new Controls(p, CANVAS_HEIGHT)
    
    // Set up control callbacks
    controls.setOnModeChange((mode: GameMode) => {
      console.log('Mode changed to:', mode)
    })
    
    controls.setOnBounceChange((bounces: number) => {
      console.log('Bounce count changed to:', bounces)
    })
    
    controls.setOnFire(() => {
      console.log('Fire button clicked!')
      // TODO: Implement ray tracing in future steps
    })
  }

  p.draw = () => {
    p.background(COLORS.BACKGROUND)
    
    // Create clipping region for the grid area
    p.push()
    p.drawingContext.save()
    p.drawingContext.beginPath()
    p.drawingContext.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    p.drawingContext.clip()
    
    // Draw the room grid
    drawGrid(p)
    
    // Draw mirrors
    mirrorManager.drawMirrors(p)
    
    // Draw all entities
    entityManager.drawAll(p)
    
    // Draw hover highlights
    dragManager.drawHoverHighlight(entityManager.getEntities(), p)
    mirrorManager.drawHoverHighlight(p)
    
    p.drawingContext.restore()
    p.pop()
    
    // Draw controls (outside clipping region)
    controls.draw()
  }
  
  // Mouse interactions
  p.mousePressed = () => {
    // Try controls first
    const controlsHandled = controls.handleMousePressed(p.mouseX, p.mouseY)
    
    if (!controlsHandled) {
      // Try mirror click
      const mirrorClicked = mirrorManager.handleClick(p)
      
      // If no mirror clicked, try entity drag
      if (!mirrorClicked) {
        dragManager.handleMousePressed(entityManager.getEntities(), p)
      }
    }
  }
  
  p.mouseDragged = () => {
    // Try controls first
    const controlsHandled = controls.handleMouseDragged(p.mouseX, p.mouseY)
    
    if (!controlsHandled) {
      dragManager.handleMouseDragged(p)
    }
  }
  
  p.mouseReleased = () => {
    dragManager.handleMouseReleased()
  }
}

new p5(sketch)