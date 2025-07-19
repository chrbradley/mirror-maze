# Mirror Maze

An interactive web-based visualization demonstrating the physics of light reflection and the Method of Images. Users can explore how light travels between objects and receptors through mirror reflections in a 2D grid-based environment.

## Overview

Mirror Maze is an educational tool that visualizes:
- **Light ray reflection** following the law of reflection (angle of incidence = angle of reflection)
- **Virtual image formation** using the Method of Images principle
- **Ray path calculation** showing how light bounces off mirrors to reach its destination
- **Interactive mirror controls** to experiment with different reflection configurations

The application features a retro sci-fi aesthetic with glowing ray effects and real-time physics simulation.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd mirror-maze

# Install dependencies
npm install
```

### Development
```bash
# Run development server
npm run dev

# The application will be available at http://localhost:5173
```

## How It Works

### Ray Folding Algorithm
The core innovation is the ray folding algorithm that converts a straight line-of-sight path into a series of bouncing ray segments within the home room. The algorithm:
1. Calculates the total distance from receptor to virtual target
2. Travels that exact distance using ray bounces
3. Automatically terminates at the correct position

### Coordinate Transformation Pipeline
The system manages three coordinate spaces:
1. **Local coordinates** - Position within a room (0,0 to 240,240)
2. **Mirrored coordinates** - Accounts for room flipping based on grid position
3. **Canvas coordinates** - Final screen rendering position

### Method of Images
Virtual images are calculated by reflecting positions across mirror planes. This principle from optics allows us to:
- Predict where objects appear to be when viewed through mirrors
- Calculate ray paths using straight lines to virtual positions
- Demonstrate that virtual images appear as far behind mirrors as objects are in front

## Project Reflection

### 1. Different Features to Prioritize

This project was authored under the pretext of being a Prof of Concept. Consequently multiple production grade work process were intentionally ignored in order to get to a working interactive demonstration. For instance I deliberately chose not to use a UI framework or state management library opting instead for a lightweight vanilla front end. This means that I didn't bother to leverage reusable components or design abstract functions for reusability. These decisions would be revisited and refactored should this application be promoted to a production learning interactive.

With those caveats, now that I've implemented the working Mirror Maze POC, I would prioritize these features differently in production:

- **Build coordinate transformation pipeline robustly upfront** - A well-tested coordinate system would provide a pedagogically correct contract between functions and consumers ensuring that domain experts have an ability to craft variant setups using natural language.
- **Start with the ray folding algorithm first** - This was the core technical challenge. Building it early would have revealed coordinate system complexities sooner and established a clear contract between the function and consumers. This would have had a positive influence on other downstream design decisions.
- **Implement visual debugging tools earlier** - I grounded this simulation heavily in examples from the project debrief, including the choice of representational shapes: a triangle for the viewed geo object and a circle for the light receptor. After encountering some annoying bugs when extending the light bounce and virtual visualization from one reflected room, to multiple rooms, I realized the the mirroring function was only flipping the shape positionally over the mirrored axis and not inverting their geometry too. This was an obvious error, but not visually intuitive because I used symmetrical geometry. To remedy this, I added a single dot to the geometry edges and added a slight random rotation on initialization.  The dots on shapes were invaluable for understanding mirroring issues.

### 2. Extensions for More Optics Concepts

The interactive could be extended to demonstrate additional optics principles:

- **Refraction and Snell's Law** - Add materials with different refractive indices between rooms, showing how light bends when entering different media
- **Diffraction patterns** - Show wave behavior when light passes through narrow slits in the walls
- **Polarization** - Add polarizing filters to walls and show how light intensity changes based on filter orientation
- **Interference** - Allow multiple light sources to demonstrate constructive/destructive interference patterns
- **Curved mirrors** - Replace flat mirrors with parabolic or spherical surfaces to show focusing/diverging effects
- **Total internal reflection** - Add critical angle demonstrations for fiber optic principles
- **Dispersion** - Show white light splitting into spectrum components through prisms

### 3. Applications to Other STEM Areas

The Mirror Maze's core concepts transfer to several STEM domains:

**Physics - Sound and Acoustics**
- The ray tracing algorithm directly applies to sound wave propagation in rooms
- Could model echo patterns, acoustic treatment placement, and concert hall design
- The Method of Images works identically for sound reflections

**Computer Graphics and Game Development**
- The ray folding algorithm is fundamental to rendering reflections in games
- The coordinate transformation pipeline teaches essential 3D graphics concepts
- Virtual image calculation is used in portal rendering systems

**Telecommunications and Networking**
- The multi-hop ray paths model signal propagation in wireless networks
- Could visualize WiFi coverage, cellular tower placement, or satellite communications
- Path loss calculations follow similar distance-based principles

**Mathematics - Geometry and Linear Algebra**
- The reflection transformations demonstrate matrix operations visually
- Coordinate system transformations provide concrete examples of basis changes
- The Method of Images illustrates geometric symmetry principles

### 4. Use of AI in Development

I utilized AI assistance throughout the development process:

**Project Ideation and Planning**
- AI helped me brainstorm the interactive demonstration and refine the idea down into a manageable development plan that could be implemented within the time constraints.

**Initial Implementation**
- AI helped translate the conceptual ray-folding algorithm into working TypeScript code
- Provided p5.js-specific rendering techniques for the visualization layer
- Suggested the coordinate transformation pipeline architecture

**Code Architecture**
- Suggested the manager pattern for coordinating room and entity state
- Provided TypeScript type definitions for better code maintainability

**Visual Design**
- AI contributed the retro/sci-fi aesthetic with glow effects
- Implemented the CSS Grid layout for responsive design

**Deployment Preparation**
- AI identified and resolved TypeScript strict mode issues
- Cleaned up unused imports and variables for production build
- Configured build settings for optimal bundle size

The AI served as a useful pair programmer helping me iterate much faster and get farther under the time constraints. It's definitely a force multiplier.

## Technical Architecture

### Core Modules

- **`src/core/`** - Core physics and logic
  - `entities.ts` - Objects, receptors, and their rendering with mirroring support
  - `ray-path-calculator.ts` - Calculates ray paths between rooms
  - `mirrors.ts` - Mirror state management and interaction
  - `coordinates.ts` - Coordinate transformation utilities
  - `grid.ts` - Room grid rendering and management

- **`src/ui/`** - User interface and visualization
  - `ray-renderer.ts` - Ray path visualization with glow effects
  - `controls.ts` - UI controls for mode switching
  - `theme.ts` - Visual styling constants

- **`src/main.ts`** - Application entry point and p5.js sketch setup

### Key Design Patterns

1. **Manager Pattern** - Separate managers handle home rooms, target rooms, entities, and mirrors
2. **Observer Pattern** - Components listen for changes in room selection and mirror state
3. **Transformation Pipeline** - Consistent coordinate transformation through the rendering stack
4. **Modular Ray Tracing** - Separation between ray calculation and visual rendering

### Time Accounting

- Planning: 1 hour
- Implementation: 4 hours ( strict )
- Write up: 0.5 hours

## License

This project is provided as-is for educational purposes.