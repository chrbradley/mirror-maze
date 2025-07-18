// ABOUTME: Renders ray paths showing light traveling from object to receptor
// ABOUTME: Visualizes both actual light path and line of sight to virtual image

import p5 from 'p5'
import type { RayPath } from '../core/raytrace'
import type { Point2D } from '../core/coordinates'
import { COLORS } from './theme'
import { EntityManager } from '../core/entities'
import { roomToCanvas, getMirroredRoomPoint } from '../core/coordinates'
import { TargetRoomManager } from '../core/target-room-manager'

export class RayRenderer {
  constructor(
    private entityManager: EntityManager,
    private targetRoomManager: TargetRoomManager
  ) {}
  
  // Draw the complete ray visualization
  drawRayPath(p: p5, rayPath: RayPath | null) {
    if (!rayPath || !rayPath.valid || rayPath.segments.length === 0) {
      return
    }
    
    // Draw the actual light path (solid lines with glow)
    this.drawLightPath(p, rayPath.segments)
    
    // Draw the line of sight from receptor to virtual object (dotted line)
    this.drawLineOfSight(p)
  }
  
  // Draw the solid light path segments with neon glow
  private drawLightPath(p: p5, segments: { start: Point2D, end: Point2D }[]) {
    // Draw multiple layers for glow effect
    for (let layer = 3; layer > 0; layer--) {
      p.push()
      p.strokeWeight(layer * 2)
      p.stroke(0, 255, 0, 255 / (layer + 1)) // Fade for outer layers
      
      for (const segment of segments) {
        p.line(segment.start.x, segment.start.y, segment.end.x, segment.end.y)
      }
      
      p.pop()
    }
    
    // Draw the bright core
    p.push()
    p.stroke(COLORS.NEON_GREEN)
    p.strokeWeight(2)
    
    for (const segment of segments) {
      p.line(segment.start.x, segment.start.y, segment.end.x, segment.end.y)
    }
    
    p.pop()
    
    // Draw small circles at reflection points
    p.push()
    p.fill(COLORS.NEON_GREEN)
    p.noStroke()
    
    for (let i = 1; i < segments.length; i++) {
      // Draw a small circle at each reflection point
      p.circle(segments[i].start.x, segments[i].start.y, 6)
    }
    
    p.pop()
  }
  
  // Draw the dotted line of sight from receptor to virtual object
  private drawLineOfSight(p: p5) {
    const entities = this.entityManager.getEntities()
    const object = entities.find(e => e.constructor.name === 'ObjectEntity')
    const receptor = entities.find(e => e.constructor.name === 'ReceptorEntity')
    
    if (!object || !receptor) {
      return
    }
    
    // Get receptor position in home room with mirroring applied
    const mirroredReceptorPos = getMirroredRoomPoint(receptor.homeRoom, receptor.position)
    const receptorCanvasPos = roomToCanvas(receptor.homeRoom, mirroredReceptorPos)
    
    // Get object position in target room (with mirroring applied)
    const targetRoom = this.targetRoomManager.getCurrentTargetRoom()
    const mirroredObjectPos = getMirroredRoomPoint(targetRoom, object.position)
    const virtualObjectCanvasPos = roomToCanvas(targetRoom, mirroredObjectPos)
    
    // Draw dotted line
    this.drawDottedLine(p, receptorCanvasPos, virtualObjectCanvasPos)
  }
  
  // Draw a dotted line between two points
  private drawDottedLine(p: p5, start: Point2D, end: Point2D) {
    p.push()
    p.stroke(COLORS.NEON_GREEN)
    p.strokeWeight(1)
    
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const dashLength = 10
    const gapLength = 5
    const totalLength = dashLength + gapLength
    const numDashes = Math.floor(distance / totalLength)
    
    const stepX = dx / distance
    const stepY = dy / distance
    
    for (let i = 0; i < numDashes; i++) {
      const startX = start.x + i * totalLength * stepX
      const startY = start.y + i * totalLength * stepY
      const endX = startX + dashLength * stepX
      const endY = startY + dashLength * stepY
      
      p.line(startX, startY, endX, endY)
    }
    
    // Draw any remaining segment
    const remaining = distance - numDashes * totalLength
    if (remaining > 0) {
      const startX = start.x + numDashes * totalLength * stepX
      const startY = start.y + numDashes * totalLength * stepY
      const endX = startX + Math.min(remaining, dashLength) * stepX
      const endY = startY + Math.min(remaining, dashLength) * stepY
      
      p.line(startX, startY, endX, endY)
    }
    
    p.pop()
  }
}