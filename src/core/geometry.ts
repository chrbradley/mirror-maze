// ABOUTME: Geometric types and intersection algorithms for ray tracing
// ABOUTME: Handles ray-line intersections and wall segment calculations

import type { Point2D, RoomCoord } from './coordinates';
import type { Mirror } from './mirrors';
import { ROOM_WIDTH, ROOM_HEIGHT, getGridOffset } from './grid';

// Ray type with origin point and normalized direction vector
export interface Ray {
  origin: Point2D;
  direction: Point2D; // Should be normalized
}

// Line segment defined by two endpoints
export interface LineSegment {
  p1: Point2D;
  p2: Point2D;
}

// Result of ray-line intersection
export interface IntersectionResult {
  hit: boolean;
  point?: Point2D;
  t?: number; // Parameter along the ray where intersection occurs
}

// Normalize a vector to unit length
export function normalize(v: Point2D): Point2D {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: v.x / length, y: v.y / length };
}

// Calculate ray-line intersection using parametric form
export function rayLineIntersection(ray: Ray, segment: LineSegment): IntersectionResult {
  // Ray: P = origin + t * direction
  // Line: Q = p1 + s * (p2 - p1)
  // Solve: origin + t * direction = p1 + s * (p2 - p1)
  
  const dx = segment.p2.x - segment.p1.x;
  const dy = segment.p2.y - segment.p1.y;
  const det = dx * ray.direction.y - dy * ray.direction.x;
  
  // Check if ray and line are parallel
  if (Math.abs(det) < 1e-10) {
    return { hit: false };
  }
  
  const dx1 = segment.p1.x - ray.origin.x;
  const dy1 = segment.p1.y - ray.origin.y;
  
  const t = (dx * dy1 - dy * dx1) / det;
  const s = (ray.direction.x * dy1 - ray.direction.y * dx1) / det;
  
  // Check if intersection is along the ray (t >= 0) and within line segment (0 <= s <= 1)
  if (t >= -1e-10 && s >= -1e-10 && s <= 1 + 1e-10) {
    const point = {
      x: ray.origin.x + t * ray.direction.x,
      y: ray.origin.y + t * ray.direction.y
    };
    return { hit: true, point, t };
  }
  
  return { hit: false };
}

// Get wall segments for a room based on active mirrors
export function getRoomWallSegments(roomCoord: RoomCoord, mirrors: Mirror[]): LineSegment[] {
  const segments: LineSegment[] = [];
  const gridOffset = getGridOffset();
  
  // Calculate room boundaries in canvas coordinates
  const roomX = gridOffset.x + roomCoord.col * ROOM_WIDTH;
  const roomY = gridOffset.y + roomCoord.row * ROOM_HEIGHT;
  
  // Check each wall
  const walls = [
    { wall: 'N', p1: { x: roomX, y: roomY }, p2: { x: roomX + ROOM_WIDTH, y: roomY } },
    { wall: 'S', p1: { x: roomX, y: roomY + ROOM_HEIGHT }, p2: { x: roomX + ROOM_WIDTH, y: roomY + ROOM_HEIGHT } },
    { wall: 'E', p1: { x: roomX + ROOM_WIDTH, y: roomY }, p2: { x: roomX + ROOM_WIDTH, y: roomY + ROOM_HEIGHT } },
    { wall: 'W', p1: { x: roomX, y: roomY }, p2: { x: roomX, y: roomY + ROOM_HEIGHT } }
  ];
  
  for (const { wall, p1, p2 } of walls) {
    // Find mirror for this wall
    const mirror = mirrors.find(m => 
      m.room.row === roomCoord.row && 
      m.room.col === roomCoord.col && 
      m.wall === wall
    );
    
    // Add segment if mirror exists and is in 'on' state
    if (mirror && mirror.state === 'on') {
      segments.push({ p1, p2 });
    }
  }
  
  return segments;
}

// Get all active wall segments across all rooms
export function getAllActiveWallSegments(mirrors: Mirror[]): LineSegment[] {
  const segments: LineSegment[] = [];
  const processedRooms = new Set<string>();
  
  for (const mirror of mirrors) {
    if (mirror.state === 'on') {
      const roomKey = `${mirror.room.row},${mirror.room.col}`;
      
      // Get segments for this room if not already processed
      if (!processedRooms.has(roomKey)) {
        const roomSegments = getRoomWallSegments(mirror.room, mirrors);
        segments.push(...roomSegments);
        processedRooms.add(roomKey);
      }
    }
  }
  
  return segments;
}

// Find the closest intersection of a ray with any wall segment
export function findClosestIntersection(ray: Ray, segments: LineSegment[]): IntersectionResult {
  let closestResult: IntersectionResult = { hit: false };
  let minT = Infinity;
  
  for (const segment of segments) {
    const result = rayLineIntersection(ray, segment);
    if (result.hit && result.t !== undefined && result.t < minT) {
      minT = result.t;
      closestResult = result;
    }
  }
  
  return closestResult;
}