// ABOUTME: Calculates ray paths between home and target rooms
// ABOUTME: Determines mirror sequences and integrates with Method of Images

import type { RoomCoord, Point2D } from './coordinates'
import { roomToCanvas, getMirroredRoomPoint, isRoomFlippedX, isRoomFlippedY } from './coordinates'
import type { MirrorReflection, RayPath } from './raytrace'
import { computeReflectionPath } from './raytrace'
import type { Mirror, WallPosition } from './mirrors'
import { HomeRoomManager } from './home-room-manager'
import { TargetRoomManager } from './target-room-manager'
import { EntityManager } from './entities'
import { MirrorManager } from './mirrors'
import { traceRayInRoom, type RaySegment } from './simple-ray-tracer'

export class RayPathCalculator {
  constructor(
    private homeRoomManager: HomeRoomManager,
    private targetRoomManager: TargetRoomManager,
    private entityManager: EntityManager,
    private mirrorManager: MirrorManager
  ) {}
  
  // Calculate the mirror sequence needed to reach target room from home room
  private calculateMirrorSequence(): MirrorReflection[] {
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    const targetRoom = this.targetRoomManager.getCurrentTargetRoom()
    
    // If in the same room, no mirrors needed
    if (homeRoom.row === targetRoom.row && homeRoom.col === targetRoom.col) {
      return []
    }
    
    // Get active mirrors in home room
    const activeMirrors = this.mirrorManager.getActiveHomeMirrors()
    
    // If no active mirrors, return empty sequence
    if (activeMirrors.length === 0) {
      return []
    }
    
    // For now, return all active mirrors in the home room
    // The ray tracing algorithm will determine which ones are actually used
    return activeMirrors.map(m => ({
      room: m.room,
      wall: m.wall
    }))
  }
  
  // Calculate the current ray path from object to receptor
  calculateRayPath(): RayPath | null {
    const entities = this.entityManager.getEntities()
    const object = entities.find(e => e.constructor.name === 'ObjectEntity')
    const receptor = entities.find(e => e.constructor.name === 'ReceptorEntity')
    
    if (!object || !receptor) {
      return null
    }
    
    // Get home room and its active mirrors
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    const homeMirrors = this.mirrorManager.getMirrors().filter(m =>
      m.room.row === homeRoom.row && m.room.col === homeRoom.col
    )
    
    // Get entity positions in their local room coordinates
    // (already in the correct space for ray tracing)
    const objectLocalPos = object.position
    const receptorLocalPos = receptor.position
    
    // Get room flipping flags
    const flipX = isRoomFlippedX(homeRoom.col)
    const flipY = isRoomFlippedY(homeRoom.row)
    
    // Trace ray within the room
    const segments = traceRayInRoom(objectLocalPos, receptorLocalPos, homeMirrors, 5, flipX, flipY)
    
    // Convert to canvas coordinates for rendering
    const homeRoomMirrored = getMirroredRoomPoint(homeRoom, { x: 0, y: 0 })
    const canvasSegments = segments.map(segment => {
      // Apply mirroring to match rendered positions
      const mirroredStart = getMirroredRoomPoint(homeRoom, segment.start)
      const mirroredEnd = getMirroredRoomPoint(homeRoom, segment.end)
      
      return {
        start: roomToCanvas(homeRoom, mirroredStart),
        end: roomToCanvas(homeRoom, mirroredEnd)
      }
    })
    
    // Create a simplified ray path result
    const virtualTarget = roomToCanvas(homeRoom, getMirroredRoomPoint(homeRoom, receptorLocalPos))
    
    return {
      segments: canvasSegments,
      virtualTarget,
      valid: segments.length > 0
    }
  }
  
  // Get the virtual object position in the target room
  getVirtualObjectPosition(): Point2D | null {
    const rayPath = this.calculateRayPath()
    if (!rayPath || !rayPath.valid) {
      return null
    }
    
    const entities = this.entityManager.getEntities()
    const object = entities.find(e => e.constructor.name === 'ObjectEntity')
    if (!object) {
      return null
    }
    
    // The virtual object position is calculated by reflecting the object
    // position through the same mirrors (not the virtual target which is the receptor)
    const homeRoom = this.homeRoomManager.getCurrentHomeRoom()
    const targetRoom = this.targetRoomManager.getCurrentTargetRoom()
    const objectCanvasPos = roomToCanvas(homeRoom, object.position)
    
    // For visualization, we need the object position in the target room
    // This is simply the object's local position rendered in the target room
    const virtualObjectCanvasPos = roomToCanvas(targetRoom, object.position)
    
    return virtualObjectCanvasPos
  }
}