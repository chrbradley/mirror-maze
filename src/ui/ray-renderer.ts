// ABOUTME: Renders ray paths showing light traveling from object to receptor
// ABOUTME: Visualizes both actual light path and line of sight to virtual image

import p5 from 'p5';
import type { RayPath } from '../core/raytrace';
import type { Point2D } from '../core/coordinates';
import { EntityManager, ObjectEntity, ReceptorEntity } from '../core/entities';
import { roomToCanvas, getMirroredRoomPoint } from '../core/coordinates';
import { TargetRoomManager } from '../core/target-room-manager';

export interface LineOfSightPoints {
  origin: Point2D;
  wallIntersection: Point2D | null;
  termination: Point2D;
}

export class RayRenderer {
  private lineOfSightPoints: LineOfSightPoints | null = null;
  private lightBouncePath: Point2D[] = [];

  constructor(
    private entityManager: EntityManager,
    private targetRoomManager: TargetRoomManager
  ) {}


  // Check if two points are in the same room
  private isInSameRoom(point1: Point2D, point2: Point2D): boolean {
    const GRID_OFFSET_X = 40;
    const GRID_OFFSET_Y = 60;
    const ROOM_WIDTH = 240;
    const ROOM_HEIGHT = 240;
    const homeRoomX = GRID_OFFSET_X + 1 * ROOM_WIDTH;
    const homeRoomY = GRID_OFFSET_Y + 0 * ROOM_HEIGHT;
    
    // Check if both points are within the home room
    const inHomeRoom = (p: Point2D) => 
      p.x >= homeRoomX && p.x <= homeRoomX + ROOM_WIDTH &&
      p.y >= homeRoomY && p.y <= homeRoomY + ROOM_HEIGHT;
    
    return inHomeRoom(point1) && inHomeRoom(point2);
  }


  // Find the closest wall intersection along a ray
  private findClosestWallIntersection(
    start: Point2D,
    end: Point2D,
    walls: Array<{ type: string; x?: number; y?: number }>
  ): { point: Point2D; wallType: string } | null {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    let closestIntersection: { point: Point2D; wallType: string } | null = null;
    let minT = Infinity;
    
    // Debug: log what we're checking
    const shouldLog = (this.constructor as any).lastDebugLogKey !== undefined;
    if (shouldLog) {
      console.log('    🔍 findClosestWallIntersection:');
      console.log('      start:', start);
      console.log('      end:', end);
      console.log('      ray vector:', {dx, dy});
    }

    for (const wall of walls) {
      let t = -1;
      let intersectionPoint: Point2D | null = null;

      if (wall.type === 'E' || wall.type === 'W') {
        // Vertical wall
        if (Math.abs(dx) > 0.001) {
          t = (wall.x! - start.x) / dx;
          if (t > 0.001) {
            const y = start.y + t * dy;
            // Check if intersection is within wall bounds
            if (y >= walls[2].y! && y <= walls[3].y!) {
              intersectionPoint = { x: wall.x!, y };
              if (shouldLog) {
                console.log(`      Wall ${wall.type} at x=${wall.x}: t=${t.toFixed(3)}, y=${y.toFixed(1)}, within bounds: true`);
              }
            } else {
              if (shouldLog) {
                console.log(`      Wall ${wall.type} at x=${wall.x}: t=${t.toFixed(3)}, y=${y.toFixed(1)}, within bounds: false (y range: ${walls[2].y}-${walls[3].y})`);
              }
            }
          } else {
            if (shouldLog) {
              console.log(`      Wall ${wall.type} at x=${wall.x}: t=${t.toFixed(3)}, behind ray`);
            }
          }
        }
      } else {
        // Horizontal wall
        if (Math.abs(dy) > 0.001) {
          t = (wall.y! - start.y) / dy;
          if (t > 0.001) {
            const x = start.x + t * dx;
            // Check if intersection is within wall bounds
            if (x >= walls[1].x! && x <= walls[0].x!) {
              intersectionPoint = { x, y: wall.y! };
              if (shouldLog) {
                console.log(`      Wall ${wall.type} at y=${wall.y}: t=${t.toFixed(3)}, x=${x.toFixed(1)}, within bounds: true`);
              }
            } else {
              if (shouldLog) {
                console.log(`      Wall ${wall.type} at y=${wall.y}: t=${t.toFixed(3)}, x=${x.toFixed(1)}, within bounds: false (x range: ${walls[1].x}-${walls[0].x})`);
              }
            }
          } else {
            if (shouldLog) {
              console.log(`      Wall ${wall.type} at y=${wall.y}: t=${t.toFixed(3)}, behind ray`);
            }
          }
        }
      }

      if (intersectionPoint && t < minT) {
        minT = t;
        closestIntersection = { point: intersectionPoint, wallType: wall.type };
      }
    }

    if (shouldLog) {
      console.log('      closest intersection:', closestIntersection);
    }

    return closestIntersection;
  }

  // Draw the complete ray visualization
  drawRayPath(p: p5, rayPath: RayPath | null) {
    // Draw the line of sight from receptor to virtual object (dotted line)
    // This also calculates the line of sight points
    this.drawLineOfSight(p);
    
    // Calculate and draw the light bounce path within home room
    this.calculateLightBouncePath();
    this.drawLightBouncePath(p);
  }


  // Get closest point on circle to another point
  private getClosestPointOnCircle(
    circleCenter: Point2D,
    circleRadius: number,
    targetPoint: Point2D
  ): Point2D {
    const dx = targetPoint.x - circleCenter.x;
    const dy = targetPoint.y - circleCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return circleCenter;

    // Normalize and scale by radius
    return {
      x: circleCenter.x + (dx / dist) * circleRadius,
      y: circleCenter.y + (dy / dist) * circleRadius,
    };
  }

  // Get closest point on triangle to another point
  private getClosestPointOnTriangle(
    triangleCenter: Point2D,
    size: number,
    targetPoint: Point2D
  ): Point2D {
    // Triangle vertices (pointing up)
    const vertices = [
      { x: triangleCenter.x, y: triangleCenter.y - size }, // Top vertex
      { x: triangleCenter.x - size * 0.866, y: triangleCenter.y + size * 0.5 }, // Bottom left
      { x: triangleCenter.x + size * 0.866, y: triangleCenter.y + size * 0.5 }, // Bottom right
    ];

    // Check distance to each vertex
    let closestPoint = vertices[0];
    let minDist = Math.sqrt(
      Math.pow(vertices[0].x - targetPoint.x, 2) +
        Math.pow(vertices[0].y - targetPoint.y, 2)
    );

    for (let i = 1; i < vertices.length; i++) {
      const dist = Math.sqrt(
        Math.pow(vertices[i].x - targetPoint.x, 2) +
          Math.pow(vertices[i].y - targetPoint.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closestPoint = vertices[i];
      }
    }

    // Also check closest points on edges
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];

      // Project target point onto edge
      const edge = { x: v2.x - v1.x, y: v2.y - v1.y };
      const toTarget = { x: targetPoint.x - v1.x, y: targetPoint.y - v1.y };

      const edgeLengthSq = edge.x * edge.x + edge.y * edge.y;
      if (edgeLengthSq > 0) {
        const t = Math.max(
          0,
          Math.min(
            1,
            (toTarget.x * edge.x + toTarget.y * edge.y) / edgeLengthSq
          )
        );
        const projection = {
          x: v1.x + t * edge.x,
          y: v1.y + t * edge.y,
        };

        const dist = Math.sqrt(
          Math.pow(projection.x - targetPoint.x, 2) +
            Math.pow(projection.y - targetPoint.y, 2)
        );

        if (dist < minDist) {
          minDist = dist;
          closestPoint = projection;
        }
      }
    }

    return closestPoint;
  }

  // Draw the dotted line of sight from receptor to virtual object
  private drawLineOfSight(p: p5) {
    const entities = this.entityManager.getEntities();
    const object = entities.find((e) => e instanceof ObjectEntity);
    const receptor = entities.find(
      (e) => e instanceof ReceptorEntity
    );

    if (!object || !receptor) {
      return;
    }

    // Get receptor position in home room with mirroring applied
    const mirroredReceptorPos = getMirroredRoomPoint(
      receptor.homeRoom,
      receptor.position
    );
    const receptorCanvasPos = roomToCanvas(
      receptor.homeRoom,
      mirroredReceptorPos
    );

    // Get object position in target room (with mirroring applied)
    const targetRoom = this.targetRoomManager.getCurrentTargetRoom();
    const mirroredObjectPos = getMirroredRoomPoint(targetRoom, object.position);
    const virtualObjectCanvasPos = roomToCanvas(targetRoom, mirroredObjectPos);

    // Update receptor rotation to aim at virtual target
    (receptor as any).aimAt(virtualObjectCanvasPos);

    // Calculate line of sight points using centroids
    this.calculateLineOfSightPoints(receptorCanvasPos, virtualObjectCanvasPos);

    // Draw dotted line between centroids
    this.drawDottedLine(p, receptorCanvasPos, virtualObjectCanvasPos);
  }

  // Draw a dotted line between two points with glow effect
  private drawDottedLine(p: p5, start: Point2D, end: Point2D) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const dashLength = 10;
    const gapLength = 5;
    const totalLength = dashLength + gapLength;
    const numDashes = Math.floor(distance / totalLength);

    const stepX = dx / distance;
    const stepY = dy / distance;

    // Draw glow effect (multiple passes with decreasing opacity)
    const glowLayers = [
      { weight: 8, alpha: 20, r: 0, g: 255, b: 0 },     // Outer glow - pure green
      { weight: 6, alpha: 40, r: 64, g: 255, b: 64 },   // Light green
      { weight: 4, alpha: 60, r: 128, g: 255, b: 128 }, // Lighter green
      { weight: 2, alpha: 80, r: 192, g: 255, b: 192 }, // Very light green
      { weight: 1, alpha: 255, r: 240, g: 255, b: 240 } // Center - almost white
    ];

    for (const layer of glowLayers) {
      p.push();
      p.stroke(layer.r, layer.g, layer.b, layer.alpha);
      p.strokeWeight(layer.weight);

      for (let i = 0; i < numDashes; i++) {
        const startX = start.x + i * totalLength * stepX;
        const startY = start.y + i * totalLength * stepY;
        const endX = startX + dashLength * stepX;
        const endY = startY + dashLength * stepY;

        p.line(startX, startY, endX, endY);
      }

      // Draw any remaining segment
      const remaining = distance - numDashes * totalLength;
      if (remaining > 0) {
        const startX = start.x + numDashes * totalLength * stepX;
        const startY = start.y + numDashes * totalLength * stepY;
        const endX = startX + Math.min(remaining, dashLength) * stepX;
        const endY = startY + Math.min(remaining, dashLength) * stepY;

        p.line(startX, startY, endX, endY);
      }

      p.pop();
    }
  }


  // Calculate the three key points on the line of sight
  private calculateLineOfSightPoints(origin: Point2D, termination: Point2D) {
    // Get the proper grid constants
    const GRID_OFFSET_X = 40; // Based on centered grid
    const GRID_OFFSET_Y = 60;
    const ROOM_WIDTH = 240;
    const ROOM_HEIGHT = 240;

    // Calculate home room boundaries (room at col 1, row 0)
    const homeRoomX = GRID_OFFSET_X + 1 * ROOM_WIDTH; // x = 40 + 240 = 280
    const homeRoomY = GRID_OFFSET_Y + 0 * ROOM_HEIGHT; // y = 60 + 0 = 60

    // Define the four walls of the home room
    const walls = [
      { type: 'E', x: homeRoomX + ROOM_WIDTH }, // East wall at x=520
      { type: 'W', x: homeRoomX }, // West wall at x=280
      { type: 'N', y: homeRoomY }, // North wall at y=60
      { type: 'S', y: homeRoomY + ROOM_HEIGHT }, // South wall at y=300
    ];

    // Remove this log to prevent spam
    // console.log('Home room boundaries:', {
    //   left: walls.find(w => w.type === 'W')?.x,
    //   right: walls.find(w => w.type === 'E')?.x,
    //   top: walls.find(w => w.type === 'N')?.y,
    //   bottom: walls.find(w => w.type === 'S')?.y
    // })

    // Ray direction
    const dx = termination.x - origin.x;
    const dy = termination.y - origin.y;

    let closestIntersection: Point2D | null = null;
    let minT = Infinity;

    // Check vertical walls (E/W)
    if (Math.abs(dx) > 0.001) {
      // East wall
      const eastWall = walls.find((w) => w.type === 'E');
      if (eastWall && eastWall.x !== undefined) {
        const tE = (eastWall.x - origin.x) / dx;
        if (tE > 0) {
          const yE = origin.y + tE * dy;
          if (yE >= homeRoomY && yE <= homeRoomY + ROOM_HEIGHT) {
            if (tE < minT) {
              minT = tE;
              closestIntersection = { x: eastWall.x, y: yE };
            }
          }
        }
      }

      // West wall
      const westWall = walls.find((w) => w.type === 'W');
      if (westWall && westWall.x !== undefined) {
        const tW = (westWall.x - origin.x) / dx;
        if (tW > 0) {
          const yW = origin.y + tW * dy;
          if (yW >= homeRoomY && yW <= homeRoomY + ROOM_HEIGHT) {
            if (tW < minT) {
              minT = tW;
              closestIntersection = { x: westWall.x, y: yW };
            }
          }
        }
      }
    }

    // Check horizontal walls (N/S)
    if (Math.abs(dy) > 0.001) {
      // North wall
      const northWall = walls.find((w) => w.type === 'N');
      if (northWall && northWall.y !== undefined) {
        const tN = (northWall.y - origin.y) / dy;
        if (tN > 0) {
          const xN = origin.x + tN * dx;
          if (xN >= homeRoomX && xN <= homeRoomX + ROOM_WIDTH) {
            if (tN < minT) {
              minT = tN;
              closestIntersection = { x: xN, y: northWall.y };
            }
          }
        }
      }

      // South wall
      const southWall = walls.find((w) => w.type === 'S');
      if (southWall && southWall.y !== undefined) {
        const tS = (southWall.y - origin.y) / dy;
        if (tS > 0) {
          const xS = origin.x + tS * dx;
          if (xS >= homeRoomX && xS <= homeRoomX + ROOM_WIDTH) {
            if (tS < minT) {
              minT = tS;
              closestIntersection = { x: xS, y: southWall.y };
            }
          }
        }
      }
    }

    this.lineOfSightPoints = {
      origin: origin,
      wallIntersection: closestIntersection,
      termination: termination,
    };
  }

  // Calculate the light bounce path within the home room
  private calculateLightBouncePath() {
    const entities = this.entityManager.getEntities();
    const object = entities.find((e) => e instanceof ObjectEntity);
    const receptor = entities.find((e) => e instanceof ReceptorEntity);

    if (!object || !receptor) {
      this.lightBouncePath = [];
      return;
    }

    // Get positions in home room coordinates with proper mirroring
    const mirroredReceptorPos = getMirroredRoomPoint(receptor.homeRoom, receptor.position);
    const receptorCenterPos = roomToCanvas(receptor.homeRoom, mirroredReceptorPos);
    
    const mirroredObjectPos = getMirroredRoomPoint(object.homeRoom, object.position);
    const objectCenterPos = roomToCanvas(object.homeRoom, mirroredObjectPos);
    
    // Get virtual target position for direction and total distance
    const targetRoom = this.targetRoomManager.getCurrentTargetRoom();
    const mirroredTargetObjectPos = getMirroredRoomPoint(targetRoom, object.position);
    const virtualTargetCenterPos = roomToCanvas(targetRoom, mirroredTargetObjectPos);
    
    // Calculate direction and total distance using centroids for consistency
    const direction = {
      x: virtualTargetCenterPos.x - receptorCenterPos.x,
      y: virtualTargetCenterPos.y - receptorCenterPos.y
    };
    const totalDistance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const normalizedDirection = {
      x: direction.x / totalDistance,
      y: direction.y / totalDistance
    };

    // Home room boundaries - use actual home room position, not hardcoded
    const GRID_OFFSET_X = 40;
    const GRID_OFFSET_Y = 60;
    const ROOM_WIDTH = 240;
    const ROOM_HEIGHT = 240;
    const homeRoomX = GRID_OFFSET_X + receptor.homeRoom.col * ROOM_WIDTH;
    const homeRoomY = GRID_OFFSET_Y + receptor.homeRoom.row * ROOM_HEIGHT;

    const walls = [
      { id: 'E', x1: homeRoomX + ROOM_WIDTH, y1: homeRoomY, x2: homeRoomX + ROOM_WIDTH, y2: homeRoomY + ROOM_HEIGHT }, // East
      { id: 'W', x1: homeRoomX, y1: homeRoomY, x2: homeRoomX, y2: homeRoomY + ROOM_HEIGHT }, // West  
      { id: 'N', x1: homeRoomX, y1: homeRoomY, x2: homeRoomX + ROOM_WIDTH, y2: homeRoomY }, // North
      { id: 'S', x1: homeRoomX, y1: homeRoomY + ROOM_HEIGHT, x2: homeRoomX + ROOM_WIDTH, y2: homeRoomY + ROOM_HEIGHT }, // South
    ];

    // Fold the ray into the home room
    let currentPos = { ...receptorCenterPos };
    let currentDirection = { ...normalizedDirection };
    let remainingDistance = totalDistance;
    const path: Point2D[] = [currentPos];

    while (remainingDistance > 0.1) {
      // Find closest wall intersection
      let closestIntersection: { point: Point2D; wall: any; distance: number } | null = null;
      let minDistance = Infinity;

      for (const wall of walls) {
        const intersection = this.rayWallIntersection(currentPos, currentDirection, wall);
        if (intersection) {
          const distance = Math.sqrt(
            Math.pow(intersection.x - currentPos.x, 2) + 
            Math.pow(intersection.y - currentPos.y, 2)
          );
          if (distance > 0.1 && distance < minDistance) {
            minDistance = distance;
            closestIntersection = { point: intersection, wall, distance };
          }
        }
      }

      if (!closestIntersection) {
        // No wall intersection, travel remaining distance directly to object
        const finalPos = {
          x: currentPos.x + currentDirection.x * remainingDistance,
          y: currentPos.y + currentDirection.y * remainingDistance
        };
        path.push(finalPos);
        break;
      }

      if (closestIntersection.distance >= remainingDistance) {
        // Remaining distance reaches the object before hitting wall
        const finalPos = {
          x: currentPos.x + currentDirection.x * remainingDistance,
          y: currentPos.y + currentDirection.y * remainingDistance
        };
        path.push(finalPos);
        break;
      }

      // Hit wall before reaching end
      path.push(closestIntersection.point);
      remainingDistance -= closestIntersection.distance;

      // Reflect direction off the wall
      const wallNormal = this.getWallNormal(closestIntersection.wall);
      const dotProduct = currentDirection.x * wallNormal.x + currentDirection.y * wallNormal.y;
      currentDirection = {
        x: currentDirection.x - 2 * dotProduct * wallNormal.x,
        y: currentDirection.y - 2 * dotProduct * wallNormal.y
      };

      currentPos = { ...closestIntersection.point };
    }

    this.lightBouncePath = path;
  }

  // Calculate ray-wall intersection
  private rayWallIntersection(rayStart: Point2D, rayDirection: Point2D, wall: any): Point2D | null {
    const { x1, y1, x2, y2 } = wall;
    
    const wallDx = x2 - x1;
    const wallDy = y2 - y1;
    
    const denominator = rayDirection.x * wallDy - rayDirection.y * wallDx;
    if (Math.abs(denominator) < 0.0001) return null; // Parallel lines
    
    const t = ((x1 - rayStart.x) * wallDy - (y1 - rayStart.y) * wallDx) / denominator;
    const u = ((x1 - rayStart.x) * rayDirection.y - (y1 - rayStart.y) * rayDirection.x) / denominator;
    
    if (t > 0.001 && u >= 0 && u <= 1) {
      return {
        x: rayStart.x + t * rayDirection.x,
        y: rayStart.y + t * rayDirection.y
      };
    }
    
    return null;
  }

  // Get wall normal vector
  private getWallNormal(wall: any): Point2D {
    const { id } = wall;
    switch (id) {
      case 'E': return { x: -1, y: 0 }; // East wall normal points west
      case 'W': return { x: 1, y: 0 };  // West wall normal points east
      case 'N': return { x: 0, y: 1 };  // North wall normal points south
      case 'S': return { x: 0, y: -1 }; // South wall normal points north
      default: return { x: 0, y: 1 };
    }
  }

  // Draw the light bounce path as solid lines with enhanced glow effect
  private drawLightBouncePath(p: p5) {
    if (this.lightBouncePath.length < 2) return;

    // Enhanced glow effect (50% more glowy than line of sight)
    const glowLayers = [
      { weight: 12, alpha: 25, r: 0, g: 255, b: 0 },     // Outer glow - pure green
      { weight: 10, alpha: 45, r: 32, g: 255, b: 32 },   // Green
      { weight: 8, alpha: 65, r: 64, g: 255, b: 64 },    // Light green
      { weight: 6, alpha: 85, r: 128, g: 255, b: 128 },  // Lighter green
      { weight: 4, alpha: 120, r: 160, g: 255, b: 160 }, // Very light green
      { weight: 2, alpha: 180, r: 200, g: 255, b: 200 }, // Near white
      { weight: 1, alpha: 255, r: 240, g: 255, b: 240 }  // Center - almost white
    ];

    for (const layer of glowLayers) {
      p.push();
      p.stroke(layer.r, layer.g, layer.b, layer.alpha);
      p.strokeWeight(layer.weight);

      for (let i = 0; i < this.lightBouncePath.length - 1; i++) {
        const start = this.lightBouncePath[i];
        const end = this.lightBouncePath[i + 1];
        p.line(start.x, start.y, end.x, end.y);
      }

      p.pop();
    }
  }

}
