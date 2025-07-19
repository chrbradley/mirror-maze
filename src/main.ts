// ABOUTME: Entry point for the Mirror Maze application
// ABOUTME: Sets up p5.js instance mode and renders the room grid

import './style.css';
import p5 from 'p5';
import { COLORS } from './ui/theme';
import {
  drawGrid,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TOTAL_HEIGHT,
} from './core/grid';
import { EntityManager, ObjectEntity, ReceptorEntity } from './core/entities';
import { DragManager } from './core/drag-manager';
import { MirrorManager } from './core/mirrors';
import { Controls, type GameMode } from './ui/controls';
import { HomeRoomManager } from './core/home-room-manager';
import { HomeRoomSelector } from './ui/home-room-selector';
import { TargetRoomManager } from './core/target-room-manager';
import { TargetRoomSelector } from './ui/target-room-selector';
import { RayPathCalculator } from './core/ray-path-calculator';
import { RayRenderer } from './ui/ray-renderer';
import { calculateMinimumBounces } from './core/mirror-sequence-calculator';

const sketch = (p: p5) => {
  // Create managers and entities
  const entityManager = new EntityManager();
  const homeRoomManager = new HomeRoomManager(entityManager);
  const targetRoomManager = new TargetRoomManager();
  const dragManager = new DragManager(homeRoomManager);
  const mirrorManager = new MirrorManager(homeRoomManager, targetRoomManager);
  const homeRoomSelector = new HomeRoomSelector(homeRoomManager);
  const targetRoomSelector = new TargetRoomSelector(targetRoomManager);
  const rayPathCalculator = new RayPathCalculator(
    homeRoomManager,
    targetRoomManager,
    entityManager,
    mirrorManager
  );
  const rayRenderer = new RayRenderer(entityManager, targetRoomManager);
  let controls: Controls;

  // Create an object on the upper-left of room (0,1)
  const object = new ObjectEntity({ row: 0, col: 1 }, { x: 80, y: 80 });
  entityManager.addEntity(object);

  // Create a receptor on the lower-right of room (0,1)
  const receptor = new ReceptorEntity({ row: 0, col: 1 }, { x: 160, y: 160 });
  entityManager.addEntity(receptor);

  // Function to update bounce count based on target room
  const updateBounceCount = () => {
    const homeRoom = homeRoomManager.getCurrentHomeRoom();
    const targetRoom = targetRoomManager.getCurrentTargetRoom();
    const minBounces = calculateMinimumBounces(homeRoom, targetRoom);
    controls?.setBounceCount(minBounces);
  };

  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_WIDTH, TOTAL_HEIGHT);
    canvas.parent('canvas-container');

    // Initialize controls
    controls = new Controls(p, CANVAS_HEIGHT);

    // Set up control callbacks
    controls.setOnModeChange((mode: GameMode) => {
      console.log('Mode changed to:', mode);
    });

    controls.setOnBounceChange((bounces: number) => {
      // console.log('Bounce count changed to:', bounces)
    });

    controls.setOnFire(() => {
      console.log('Fire button clicked!');
      // TODO: Implement ray tracing in future steps
    });

    // Add listeners for room changes to update bounce count
    homeRoomManager.addListener(() => {
      updateBounceCount();
    });

    targetRoomManager.addListener(() => {
      updateBounceCount();
    });

    // Set initial bounce count
    updateBounceCount();
  };

  p.draw = () => {
    p.background(COLORS.BACKGROUND);

    // Create clipping region for the grid area
    p.push();
    p.drawingContext.save();
    p.drawingContext.beginPath();
    p.drawingContext.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.drawingContext.clip();

    // Get current home and target rooms for styling
    const currentHomeRoom = homeRoomManager.getCurrentHomeRoom();
    const currentTargetRoom = targetRoomManager.getCurrentTargetRoom();

    // Draw the room grid with dimmed inactive rooms
    drawGrid(p, currentHomeRoom, currentTargetRoom);

    // Draw mirrors
    mirrorManager.drawMirrors(p);

    // Draw all entities with dimmed inactive rooms
    entityManager.drawAll(p, currentHomeRoom, currentTargetRoom);

    // Calculate and draw ray paths
    const rayPath = rayPathCalculator.calculateRayPath();
    rayRenderer.drawRayPath(p, rayPath);

    // Draw home room selector radio buttons
    homeRoomSelector.drawRadioButtons(p);

    // Draw target room selector radio buttons
    targetRoomSelector.drawRadioButtons(p);

    // Draw hover highlights
    dragManager.drawHoverHighlight(entityManager.getEntities(), p);
    mirrorManager.drawHoverHighlight(p);

    p.drawingContext.restore();
    p.pop();

    // Draw controls (outside clipping region)
    controls.draw();
  };

  // Mouse interactions
  p.mousePressed = () => {
    // Try controls first
    const controlsHandled = controls.handleMousePressed(p.mouseX, p.mouseY);

    if (!controlsHandled) {
      // Try home room selector
      const homeRadioClicked = homeRoomSelector.handleMouseClick(
        p.mouseX,
        p.mouseY
      );

      if (!homeRadioClicked) {
        // Try target room selector
        const targetRadioClicked = targetRoomSelector.handleMouseClick(
          p.mouseX,
          p.mouseY
        );

        if (!targetRadioClicked) {
          // Try mirror click
          const mirrorClicked = mirrorManager.handleClick(p);

          // If no mirror clicked, try entity drag
          if (!mirrorClicked) {
            dragManager.handleMousePressed(entityManager.getEntities(), p);
          }
        }
      }
    }
  };

  p.mouseDragged = () => {
    // Try controls first
    const controlsHandled = controls.handleMouseDragged(p.mouseX, p.mouseY);

    if (!controlsHandled) {
      dragManager.handleMouseDragged(p);
    }
  };

  p.mouseReleased = () => {
    dragManager.handleMouseReleased();
  };
};

new p5(sketch);
