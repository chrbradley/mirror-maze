// ABOUTME: Method of Images algorithm for computing ray reflection paths
// ABOUTME: Handles virtual target calculation and multi-bounce ray tracing

import type { Point2D, RoomCoord } from './coordinates';
import type { Mirror, WallPosition } from './mirrors';
import type { Ray, LineSegment } from './geometry';
import { normalize, findClosestIntersection, getAllActiveWallSegments } from './geometry';
import { ROOM_WIDTH, ROOM_HEIGHT, getGridOffset } from './grid';

// Represents a mirror used in a reflection path
export interface MirrorReflection {
  room: RoomCoord;
  wall: WallPosition;
}

// Represents a segment of the ray path
export interface PathSegment {
  start: Point2D;
  end: Point2D;
}

// Complete ray path result
export interface RayPath {
  segments: PathSegment[];
  virtualTarget: Point2D;
  valid: boolean;
}

// Reflect a point across a wall
function reflectPointAcrossWall(point: Point2D, room: RoomCoord, wall: WallPosition): Point2D {
  const gridOffset = getGridOffset();
  const roomX = gridOffset.x + room.col * ROOM_WIDTH;
  const roomY = gridOffset.y + room.row * ROOM_HEIGHT;
  
  switch (wall) {
    case 'N':
      // Reflect across y = roomY
      return { x: point.x, y: 2 * roomY - point.y };
    case 'S':
      // Reflect across y = roomY + ROOM_HEIGHT
      return { x: point.x, y: 2 * (roomY + ROOM_HEIGHT) - point.y };
    case 'E':
      // Reflect across x = roomX + ROOM_WIDTH
      return { x: 2 * (roomX + ROOM_WIDTH) - point.x, y: point.y };
    case 'W':
      // Reflect across x = roomX
      return { x: 2 * roomX - point.x, y: point.y };
  }
}

// Compute the virtual target position by reflecting the receptor through mirrors
export function computeVirtualTarget(
  receptorPos: Point2D,
  mirrorSequence: MirrorReflection[],
  bounceCount: number
): Point2D {
  let virtualPos = { ...receptorPos };
  
  // Apply reflections in reverse order (from last bounce to first)
  for (let i = bounceCount - 1; i >= 0; i--) {
    if (i < mirrorSequence.length) {
      const mirror = mirrorSequence[i];
      virtualPos = reflectPointAcrossWall(virtualPos, mirror.room, mirror.wall);
    }
  }
  
  return virtualPos;
}

// Get the wall segment for a specific mirror
function getWallSegment(room: RoomCoord, wall: WallPosition): LineSegment {
  const gridOffset = getGridOffset();
  const roomX = gridOffset.x + room.col * ROOM_WIDTH;
  const roomY = gridOffset.y + room.row * ROOM_HEIGHT;
  
  switch (wall) {
    case 'N':
      return { 
        p1: { x: roomX, y: roomY }, 
        p2: { x: roomX + ROOM_WIDTH, y: roomY } 
      };
    case 'S':
      return { 
        p1: { x: roomX, y: roomY + ROOM_HEIGHT }, 
        p2: { x: roomX + ROOM_WIDTH, y: roomY + ROOM_HEIGHT } 
      };
    case 'E':
      return { 
        p1: { x: roomX + ROOM_WIDTH, y: roomY }, 
        p2: { x: roomX + ROOM_WIDTH, y: roomY + ROOM_HEIGHT } 
      };
    case 'W':
      return { 
        p1: { x: roomX, y: roomY }, 
        p2: { x: roomX, y: roomY + ROOM_HEIGHT } 
      };
  }
}

// Compute the reflection path from object to receptor using specified mirrors
export function computeReflectionPath(
  objectPos: Point2D,
  receptorPos: Point2D,
  mirrorSequence: MirrorReflection[],
  bounceCount: number,
  allMirrors: Mirror[]
): RayPath {
  // Get virtual target position
  const virtualTarget = computeVirtualTarget(receptorPos, mirrorSequence, bounceCount);
  
  // Start ray from object towards virtual target
  const direction = normalize({
    x: virtualTarget.x - objectPos.x,
    y: virtualTarget.y - objectPos.y
  });
  
  const segments: PathSegment[] = [];
  let currentPos = { ...objectPos };
  let currentDir = { ...direction };
  
  // Get all active wall segments
  const wallSegments = getAllActiveWallSegments(allMirrors);
  
  // Trace ray through reflections
  for (let i = 0; i < bounceCount; i++) {
    const ray: Ray = { origin: currentPos, direction: currentDir };
    
    // Find intersection with walls
    const intersection = findClosestIntersection(ray, wallSegments);
    
    if (!intersection.hit || !intersection.point) {
      // Ray doesn't hit any wall - path is invalid
      return { segments, virtualTarget, valid: false };
    }
    
    // Add segment from current position to intersection
    segments.push({
      start: currentPos,
      end: intersection.point
    });
    
    // Verify this intersection is with the expected mirror
    if (i < mirrorSequence.length) {
      const expectedMirror = mirrorSequence[i];
      const expectedSegment = getWallSegment(expectedMirror.room, expectedMirror.wall);
      
      // Check if intersection point lies on expected wall segment
      if (!isPointOnSegment(intersection.point, expectedSegment)) {
        return { segments, virtualTarget, valid: false };
      }
      
      // Calculate reflection direction
      currentDir = reflectDirection(currentDir, expectedMirror.wall);
      currentPos = intersection.point;
    }
  }
  
  // Final segment to receptor
  segments.push({
    start: currentPos,
    end: receptorPos
  });
  
  // Verify the final segment actually reaches the receptor
  const finalDir = normalize({
    x: receptorPos.x - currentPos.x,
    y: receptorPos.y - currentPos.y
  });
  
  const finalRay: Ray = { origin: currentPos, direction: finalDir };
  const finalIntersection = findClosestIntersection(finalRay, wallSegments);
  
  // Check if there's an obstruction before reaching the receptor
  if (finalIntersection.hit && finalIntersection.t !== undefined) {
    const distToWall = finalIntersection.t;
    const distToReceptor = Math.sqrt(
      Math.pow(receptorPos.x - currentPos.x, 2) + 
      Math.pow(receptorPos.y - currentPos.y, 2)
    );
    
    if (distToWall < distToReceptor - 1e-6) {
      // Wall blocks the path to receptor
      return { segments, virtualTarget, valid: false };
    }
  }
  
  return { segments, virtualTarget, valid: true };
}

// Reflect a direction vector based on wall orientation
function reflectDirection(dir: Point2D, wall: WallPosition): Point2D {
  switch (wall) {
    case 'N':
    case 'S':
      // Reflect across horizontal wall - flip y component
      return { x: dir.x, y: -dir.y };
    case 'E':
    case 'W':
      // Reflect across vertical wall - flip x component
      return { x: -dir.x, y: dir.y };
  }
}

// Check if a point lies on a line segment (with tolerance)
function isPointOnSegment(point: Point2D, segment: LineSegment): boolean {
  const tolerance = 1e-6;
  
  // Check if point is within bounding box of segment
  const minX = Math.min(segment.p1.x, segment.p2.x);
  const maxX = Math.max(segment.p1.x, segment.p2.x);
  const minY = Math.min(segment.p1.y, segment.p2.y);
  const maxY = Math.max(segment.p1.y, segment.p2.y);
  
  if (point.x < minX - tolerance || point.x > maxX + tolerance ||
      point.y < minY - tolerance || point.y > maxY + tolerance) {
    return false;
  }
  
  // Check if point is collinear with segment endpoints
  const cross = (point.y - segment.p1.y) * (segment.p2.x - segment.p1.x) - 
                (point.x - segment.p1.x) * (segment.p2.y - segment.p1.y);
  
  return Math.abs(cross) < tolerance;
}