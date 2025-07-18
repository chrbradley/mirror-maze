# Mirror Maze Implementation Plan

**Generated from:** spec.md  
**Date:** 2025-07-18

## Overview

This plan breaks down the Interactive Optics Sandbox & Challenge project into small, iterative chunks that build upon each other. Each step is designed to be implemented with TDD principles, ensuring robust testing at every stage.

## Implementation Phases

### Phase 1: Foundation Setup (Steps 1-3)
Establish project structure and basic rendering capabilities.

### Phase 2: Core Room System (Steps 4-6)
Build the room grid and coordinate transformation system.

### Phase 3: Interactive Elements (Steps 7-9)
Add draggable entities and mirror controls.

### Phase 4: Ray Tracing (Steps 10-12)
Implement the method of images algorithm and ray visualization.

### Phase 5: Challenge Mode (Steps 13-15)
Add puzzle system and win/loss conditions.

### Phase 6: Polish (Steps 16-17)
Final UI improvements and accessibility.

---

## Detailed Step-by-Step Prompts

### Step 1: Project Initialization and Basic p5.js Setup ✅

```text
Create a TypeScript project using Vite with p5.js for an optics learning tool. Set up:

1. Initialize a new Vite + TypeScript project with pnpm
2. Install p5.js and @types/p5
3. Create a basic index.html with a canvas container
4. Set up main.ts with p5.js instance mode 
5. Configure tsconfig.json for ES6 modules
6. Create a simple p5 sketch that draws a black background (600x600px)
7. Add npm scripts for dev and build

Test: The dev server should run and display a black canvas.
```

### Step 2: Retro Vector Theme System ✅

```text
Create a theme system for the retro vector monitor aesthetic. Build:

1. Create src/ui/theme.ts with color constants:
   - Background: black (#000000)
   - Cyan for UI elements (#00FFFF)
   - Neon green for rays (#00FF00)
   - Red for errors (#FF0000)
2. Define stroke weight constants (thin: 1, medium: 2, thick: 4)
3. Add a pixel/monospace font loader
4. Create helper functions for styled drawing (e.g., drawCyanOutline, drawNeonLine)
5. Update main.ts to use theme colors

Test: Canvas should have proper colors and a function to draw a cyan triangle should work.
```

### Step 3: Basic Grid Rendering ✅

```text
Implement the room grid visualization system. Create:

1. Define constants: ROOM_WIDTH = 120, ROOM_HEIGHT = 120, GRID_COLS = 5, GRID_ROWS = 2
2. Create src/core/grid.ts with a function to draw grid lines
3. Draw a 2x5 grid of rooms with cyan borders
4. Add room indices (0,0) to (1,4) in small text in each room corner
5. Center the grid on the canvas with appropriate padding

Test: Should see a 2x5 grid with labeled rooms on black background.
```

### Step 4: Room Coordinate System ✅

```text
Build the room transformation system for mirrored rooms. Implement:

1. Create RoomCoord type {row: number, col: number}
2. Create Point2D type {x: number, y: number}
3. Implement isRoomFlippedX(col): even cols = false, odd = true
4. Implement isRoomFlippedY(row): first row = false, second = true  
5. Create roomToCanvas(roomCoord, localPoint) function
6. Create canvasToRoom(canvasPoint) function returning room + local coords
7. Draw test dots in each room center to verify transforms

Test: Dots should appear at exact center of each room. Click detection should return correct room.
```

### Step 5: Mirror Point Transformation ✅

```text
Implement the core mirroring logic for the method of images. Create:

1. Add mirrorPoint(point, flipX, flipY) function as specified
2. Create getMirroredRoomPoint(roomCoord, localPoint) that:
   - Determines if room should be flipped
   - Applies mirrorPoint transformation
   - Returns transformed point
3. Add visual test: draw an 'F' shape in room (0,0) and verify it mirrors correctly in adjacent rooms
4. Test all room combinations for correct mirroring

Test: 'F' should appear correctly oriented/flipped in each room based on position.
```

### Step 6: Entity Base Classes ✅

```text
Create the base entity system for objects and receptors. Build:

1. Create src/core/entities.ts
2. Define Entity base class with position (room + local coords)
3. Create ObjectEntity (cyan triangle) with draw method
4. Create ReceptorEntity (cyan circle) with draw method  
5. Add entity manager to track all entities
6. Place one object at (0,0) room center, one receptor at (0,1) room center
7. Render entities with proper mirroring in all rooms

Test: Object and receptor should appear in all rooms with correct mirroring.
```

### Step 7: Dragging System for Sandbox ✅

```text
Implement drag and drop for the sandbox mode. Create:

1. Add isDraggable flag to Entity base class
2. Create DragManager class to handle mouse interactions
3. Implement mousePressed detection for entities in home room (0,0) only
4. Add mouseDragged to update entity position (constrained to home room)
5. Update mouseReleased to end drag
6. Add hover highlight when mouse is over draggable entity
7. Ensure dragging is smooth and constrained to room bounds

Test: Should be able to drag object and receptor within room (0,0) only.
```

### Step 8: Mirror Wall System ✅

```text
Build the mirror toggle system. Implement:

1. Create Mirror class with wall position (N/S/E/W) and state (disabled/off/on)
2. For each room, determine eligible walls:
   - Top row: N, E, W walls
   - Bottom row: S, E, W walls  
3. Create MirrorManager to track all mirrors
4. Draw walls with appropriate stroke weight based on state
5. Add mouse click detection for wall segments
6. Implement state cycling: disabled → off → on → disabled
7. Add hover highlight for clickable walls

Test: Clicking walls should cycle through three visual states with different thicknesses.
```

### Step 9: UI Controls ✅

```text
Create the control panel UI. Build:

1. Create src/ui/controls.ts
2. Add bounce count slider (0-5) below the grid
3. Style slider with retro theme
4. Add visual indicator showing current bounce value
5. Create sections for Sandbox and Challenges
6. Add mode switcher between Sandbox and Challenge
7. Implement "Fire!" button (disabled in sandbox mode)

Test: Slider should update value display. Mode switch should toggle UI elements.
```

### Step 10: Ray-Line Intersection ✅

```text
Implement geometric intersection for ray tracing. Create:

1. Create src/core/geometry.ts
2. Define Ray type with origin and direction
3. Define LineSegment type for walls
4. Implement rayLineIntersection(ray, segment) returning intersection point and t value
5. Create function to get wall segments for a room's active mirrors
6. Test with various ray angles against axis-aligned segments
7. Handle edge cases (parallel rays, rays starting on walls)

Test: Intersection math should correctly find where rays hit walls.
```

### Step 11: Method of Images Algorithm ✅

```text
Build the core reflection algorithm. Implement:

1. Create src/core/raytrace.ts
2. Implement computeVirtualTarget(receptor, mirrors, bounceCount):
   - Start with receptor position
   - For each bounce (in reverse order)
   - Reflect position across the corresponding mirror
3. Create computeReflectionPath(object, receptor, mirrors, bounceCount):
   - Get virtual target from above
   - Trace ray from object to virtual target
   - Clip ray at each wall intersection
   - Return array of path segments
4. Add path validation to ensure it uses exactly the specified mirrors

Test: Path should correctly show multi-bounce trajectories matching physics.
```

### Step 12: Ray Visualization

```text
Implement the ray path rendering. Create:

1. Add drawRayPath function using neon green color
2. Draw solid lines for ray segments in home room
3. Draw dashed line from receptor to final virtual image
4. Add subtle glow effect for neon appearance
5. Implement real-time preview in sandbox mode
6. Optimize rendering to maintain 60fps during dragging

Test: Dragging entities should show smooth real-time ray preview updates.
```

### Step 13: Challenge Mode Structure

```text
Build the challenge system infrastructure. Create:

1. Create src/puzzles.ts with Challenge type
2. Define three challenges with preset positions:
   - Low: 1-2 room horizontal, 0-2 bounces
   - Medium: includes vertical, 1-3 bounces  
   - Hard: 3-4 rooms away, 3-5 bounces
3. Create ChallengeManager to load and track current challenge
4. Lock object/receptor positions in challenge mode
5. Add challenge selection UI
6. Reset mirrors when switching challenges

Test: Switching challenges should load correct preset configurations.
```

### Step 14: Fire and Hit Detection

```text
Implement the challenge verification system. Create:

1. Add "Fire!" button handler for challenge mode
2. Implement ray path verification:
   - Compute actual path with selected mirrors
   - Check if ray reaches receptor in target room
   - Verify exact bounce count matches
3. Add success animation (green pulse and checkmark)
4. Add failure animation (red X fade)
5. Store completion state for each challenge
6. Add path animation showing ray travel

Test: Correct solutions should show success, wrong solutions should show failure.
```

### Step 15: Animations and Feedback

```text
Polish the visual feedback system. Implement:

1. Create animation manager for timed sequences
2. Add ray travel animation for "Fire!" (100ms per segment)
3. Implement pulse effect for successful hit
4. Add fade effect for missed shots
5. Create smooth transitions between modes
6. Add subtle particle effects at reflection points
7. Implement screen shake for failures

Test: All animations should run smoothly without blocking interaction.
```

### Step 16: Accessibility and Polish

```text
Add accessibility features and final polish. Implement:

1. Add ARIA labels to all controls
2. Implement keyboard navigation:
   - Tab through controls
   - Arrow keys for slider
   - Space/Enter for buttons and mirrors
3. Add keyboard shortcuts for mode switching
4. Ensure sufficient color contrast
5. Add visual focus indicators
6. Create help tooltips for first-time users

Test: Full keyboard navigation should work. Screen reader should announce all controls.
```

### Step 17: Final Integration and Optimization

```text
Complete the project with final integration. Implement:

1. Combine all challenge levels in scrollable view
2. Add section headers with instructions
3. Optimize rendering performance:
   - Cache static elements
   - Use dirty rectangles for updates
   - Limit redraw to 60fps
4. Add loading screen
5. Create README with run instructions
6. Bundle for deployment
7. Ensure total size < 500KB gzipped

Test: Complete app should run smoothly, all features integrated, deployed successfully.
```

---

## Testing Strategy

Each step includes specific test requirements. The implementation should follow this pattern:

1. Write failing test for the feature
2. Implement minimal code to pass
3. Refactor for clarity
4. Verify all previous tests still pass
5. Commit working state before moving to next step

## Key Implementation Notes

- Always test coordinate transforms thoroughly - they're the foundation
- Keep ray tracing math separate from rendering for easier testing  
- Use TypeScript types to catch errors early
- Profile performance after each major feature
- Keep animations cancelable to maintain responsiveness

## Success Metrics

- All acceptance criteria (A1-A8) met
- Runs at 60fps on mid-tier hardware
- No console errors or warnings
- Passes accessibility audit
- Total implementation time ≤ 4 hours