
# Interactive Optics Sandbox & Challenge — **Specification**

**Created:** 2025-07-18

---

## 1. Purpose & Scope
Design and implement a web‑based interactive that helps learners build geometric intuition for **flat‑mirror reflections**, culminating in an “infinite‑rooms” puzzle.  
The deliverable must be small enough to prototype in **≈ 4 focused hours** yet robust enough to demonstrate:

* a free‑play **Sandbox** for discovery, and  
* three escalating **Challenge** puzzles (Low / Medium / Hard).

---

## 2. Pedagogical Context

| Item                  | Detail |
| --------------------- | ------ |
| **Subject**           | Introductory optics – law of reflection & virtual images |
| **Pre‑req**           | Basic Euclidean geometry concepts (angles, symmetry) |
| **Target learner**    | Curious middle‑/high‑schooler or adult refreshing optics |
| **Lesson placement**  | After single‑mirror concept, before curved mirrors |
| **Key misconception** | “Light travels eye → object”; virtual images are vague “ghosts” |
| **Interactive goal**  | Make learners *predict* and *verify* exact image locations by manipulating mirror configuration / bounce count |

### Learning Objectives
Learners will be able to:

1. **Explain** why a flat mirror forms a virtual image the same distance behind the surface as the object is in front.  
2. **Trace** a light ray that undergoes up to five reflections between parallel mirrors.  
3. **Determine** the minimum number of bounces & wall choices required for a ray to reach a specified target in a mirrored grid.  

---

## 3. Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **Interactive simulation** | One HTML page (p5.js / TS) hosted on e.g. GitHub Pages; includes Sandbox + three challenges. |
| 2 | **Accompanying write‑up** | Answers 4 reflection questions (feature priorities, optics extension, cross‑STEM reuse, AI usage). |

> All source code **must** be shared and runnable without build steps beyond `npm install && npm run start` or an online editor link (CodePen, Glitch, etc.).

---

## 4. Functional Specifications

### 4.1 Room Grid & Coordinate System
* Grid: **2 rows × 5 columns** (index `[row][col]`).
* Rooms alternate as **mirror images** of their neighbor: even columns unflipped, odd columns flipped in **x**; second row flipped in **y** relative to first.
* Each room draws at `120 × 120 px` (configurable constant).

### 4.2 Entities
| Entity      | Glyph (retro vector) | Notes |
| ----------- | -------------------- | ----- |
| **Object**  | Cyan ▲ outline       | Draggable **only** in Sandbox |
| **Receptor**| Cyan ○ outline       | Draggable **only** in Sandbox |
| **Mirrors** | Cyan walls – disabled = thin, off = medium, **on = thick** |
| **Ray paths**| Neon‑green solid (reflection segments in home room); neon‑green **dashed** line of sight from receptor to mirrored object |
| **Miss**    | Red “X” over receptor |
| **Hit**     | Pulsing neon‑green straight line receptor → virtual image |

### 4.3 Modes

| Mode | Interaction | Success Criteria |
|------|-------------|------------------|
| **Sandbox** | • Drag object / receptor inside home room<br>• Toggle three eligible mirrors (N/E/W or S/E/W)<br>• Slide “Bounce” (0–5) in real‑time | Always visible → previews update instantly |
| **Challenges** | • Fixed object & receptor positions<br>• Toggle mirrors<br>• Set exact bounce count<br>• Press **Fire!** | Ray reaches receptor **in target room** using *exact* bounce count |

#### Challenge Difficulty Matrix

| Difficulty | Δx (rooms) | Δy (rooms) | Min bounces |
| ---------- | ---------- | ---------- | ----------- |
| Low        | 1 – 2      | 0          | 0–2         |
| Medium     | 1 – 2      | 1          | 1–3         |
| Hard       | 3 – 4      | 1          | 3–5         |

### 4.4 Controls & UI

* **Bounce slider**: integer 0‑5 (snap).  
* **Mirror toggles**: click on eligible wall segments (cursor highlight).  
* **Fire! button** (challenges only).  
* Vertical scroll order: _Sandbox_ → _Low_ → _Medium_ → _Hard_.  
* Retro “vector monitor” styling: black bg, cyan elements, neon‑green rays, pixel/monospace font.

### 4.5 Animation/Feedback

| Event   | Visual feedback |
| ------- | --------------- |
| Preview (Sandbox) | Dashed ray from object → virtual receptor (method‑of‑images) |
| “Fire!” hit | Draw segment sequence, flash ✔️, pulse line receptor→virtual image |
| “Fire!” miss | Draw attempted path, fade, overlay red ✖️ |

### 4.6 Non‑functional Requirements

* **Performance:** ≤ 16 ms per frame for live previews on mid‑tier laptop.  
* **Accessibility:** Keyboard alternative for mirror toggles; screen‑reader labels for controls.  
* **File size:** Entire bundle < 500 kB gzipped (no images; pure vector).  
* **Browser support:** Latest two versions of Chrome, Firefox, Edge, Safari.

---

## 5. Technical Specifications

### 5.1 Stack
* **Language:** TypeScript (preferred) or ES6 JavaScript.
* **Runtime:** p5.js `^1.6`.  
  * Optional: p5.dom for UI or vanilla HTML inputs.
* **Build:** Vite + `tsconfig` (or plain `<script type=module>`).  
* **Math helper:** Use p5.Vector or import `victor` (tiny).

### 5.2 Key Algorithms

1. **Method of Images**  
   *Reflect receptor across selected mirrors exactly `N` times (reverse order) → gives a single virtual‑target point. Draw straight line obj→virtualTarget; derive bounce points by clipping to each reflecting wall.*

2. **Ray/Segment Intersection**  
   Standard line‑segment (`p + t·d`) vs. axis‑aligned wall segments; compute nearest valid `t`.

3. **Room Mirroring Transform**

```ts
function mirrorPoint(pt: Vec2, flipX: boolean, flipY: boolean): Vec2 {
  return createVector(
    flipX ? ROOM_W - pt.x : pt.x,
    flipY ? ROOM_H - pt.y : pt.y
  );
}
```

### 5.3 File/Module Layout
```
src/
 ├─ index.html
 ├─ main.ts
 ├─ ui/
 │   ├─ controls.ts     (slider, buttons)
 │   └─ theme.ts        (colors, stroke weights)
 ├─ core/
 │   ├─ geometry.ts     (intersection, mirrors)
 │   ├─ raytrace.ts     (computeReflectionPath)
 │   └─ grid.ts         (room transforms)
 └─ puzzles.ts          (preset configs)
```

---

## 6. Acceptance Criteria

| ID | Criteria |
|----|----------|
| A1 | Sandbox shows mirrored copies updating live as learner drags object or receptor. |
| A2 | Eligible mirrors toggle through three stroke weights (disabled/off/on). |
| A3 | Dashed preview updates instantly when bounce slider moves. |
| A4 | Low/Med/Hard challenge puzzles load deterministic presets matching difficulty table. |
| A5 | “Fire!” in each challenge animates full path and returns ✔️ or ✖️ correctly. |
| A6 | Source code is idiomatic TS/JS, < 500 lines excluding p5.js. |
| A7 | Project runs with `npm install && npm run dev` **or** single‑file CodePen. |
| A8 | Retro vector aesthetic matches spec (colors, fonts, line weights). |

---

## 7. Stretch Goals (time‑boxed, attempt **after** core is stable)

1. **Procedural Puzzle Generator** – button to create new solvable puzzle ≤ 5 bounces.  
2. **Corner‑angle mirrors** – allow adjusting mirror angle (≥ 60°) in Sandbox.  
3. **Share Link** – encode current puzzle as URL params.

---

## 8. Out‑of‑Scope

* Curved mirrors  
* More than five bounces  
* Mobile touch optimization (nice‑to‑have)  
* Full classroom analytics / logging

---

## 9. Project Timeline (4‑Hour Prototype)

| Time | Task |
|------|------|
| 0:00‑0:45 | Repo scaffold, draw static grid, retro theme |
| 0:45‑1:30 | Implement drag, mirror toggles, bounce slider |
| 1:30‑2:15 | Method‑of‑images preview path (sandbox) |
| 2:15‑3:00 | Challenge mode logic, hit/miss feedback |
| 3:00‑3:30 | Hard‑code three puzzles, difficulty scroll |
| 3:30‑4:00 | Polish line weights, ARIA labels, README |

---

## 10. Compliance with Brilliant Take‑Home Guidelines

* **Language & Libraries:** Idiomatic TS + p5.js; helper vector math only.  
* **AI Tooling:** Encouraged for boilerplate & math verification, not one‑shot.  
* **Sandbox‑first:** Matches “playground then objective” best‑practice.  
* **Clear API surface:** Functions (`mirrorPoint`, `computeReflectionPath`) align with SME mental model.  
* **Source + Hosted Demo:** GitHub repo + Pages link supplied.  

---
