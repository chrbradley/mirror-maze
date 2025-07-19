// ABOUTME: UI control system for the Mirror Maze application
// ABOUTME: Manages bounce count slider, mode switcher, and fire button

import p5 from 'p5';
import { COLORS, STROKE_WEIGHTS } from './theme';

export type GameMode = 'sandbox' | 'challenge';

export class Controls {
  private p: p5;
  private mode: GameMode = 'sandbox';
  private bounceCount: number = 0;
  private maxBounces: number = 5;

  // Control positions
  private controlsY: number;
  private sliderX: number;
  private sliderY: number;
  private sliderWidth: number = 200;

  private modeButtonX: number;
  private modeButtonY: number;
  private modeButtonWidth: number = 180;
  private modeButtonHeight: number = 40;

  private fireButtonX: number;
  private fireButtonY: number;
  private fireButtonWidth: number = 100;
  private fireButtonHeight: number = 40;

  // Callbacks
  private onModeChange?: (mode: GameMode) => void;
  private onBounceChange?: (bounces: number) => void;
  private onFire?: () => void;

  constructor(p: p5, canvasHeight: number) {
    this.p = p;
    this.controlsY = canvasHeight + 20;

    // Position controls
    const centerX = p.width / 2;

    // Slider centered
    this.sliderX = centerX - this.sliderWidth / 2;
    this.sliderY = this.controlsY;

    // Mode button on the left
    this.modeButtonX = 50;
    this.modeButtonY = this.controlsY + 60;

    // Fire button on the right
    this.fireButtonX = p.width - 150;
    this.fireButtonY = this.controlsY + 60;
  }

  setOnModeChange(callback: (mode: GameMode) => void) {
    this.onModeChange = callback;
  }

  setOnBounceChange(callback: (bounces: number) => void) {
    this.onBounceChange = callback;
  }

  setOnFire(callback: () => void) {
    this.onFire = callback;
  }

  getMode(): GameMode {
    return this.mode;
  }

  getBounceCount(): number {
    return this.bounceCount;
  }

  draw() {
    this.p.push();

    // Draw bounce count slider
    this.drawSlider();

    // Draw mode button
    this.drawModeButton();

    // Draw fire button
    this.drawFireButton();

    this.p.pop();
  }

  private drawSlider() {
    const { p } = this;
    const isDisabled = this.mode === 'sandbox';

    // Slider track
    if (isDisabled) {
      p.stroke(0, 255, 255, 100); // Cyan with alpha for disabled state
    } else {
      p.stroke(COLORS.CYAN);
    }
    p.strokeWeight(STROKE_WEIGHTS.MEDIUM);
    p.noFill();
    p.line(
      this.sliderX,
      this.sliderY + 20,
      this.sliderX + this.sliderWidth,
      this.sliderY + 20
    );

    // Tick marks
    for (let i = 0; i <= this.maxBounces; i++) {
      const x = this.sliderX + (i / this.maxBounces) * this.sliderWidth;
      p.line(x, this.sliderY + 15, x, this.sliderY + 25);
    }

    // Slider handle
    const handleX =
      this.sliderX + (this.bounceCount / this.maxBounces) * this.sliderWidth;
    if (isDisabled) {
      p.fill(0, 255, 255, 100); // Cyan with alpha for disabled state
    } else {
      p.fill(COLORS.CYAN);
    }
    p.noStroke();
    p.circle(handleX, this.sliderY + 20, 16);

    // Value display
    if (isDisabled) {
      p.fill(0, 255, 255, 100); // Cyan with alpha for disabled state
    } else {
      p.fill(COLORS.CYAN);
    }
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(
      `Bounces: ${this.bounceCount}`,
      this.sliderX + this.sliderWidth / 2,
      this.sliderY - 5
    );
  }

  private drawModeButton() {
    const { p } = this;
    const isDisabled = true; // Always disabled until challenge mode is implemented

    // Button outline
    p.stroke(0, 255, 255, 60); // Very dim cyan with low alpha
    p.strokeWeight(STROKE_WEIGHTS.MEDIUM);
    p.noFill();
    p.rect(
      this.modeButtonX,
      this.modeButtonY,
      this.modeButtonWidth,
      this.modeButtonHeight
    );

    // Button text
    p.fill(0, 255, 255, 60); // Very dim cyan with low alpha
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16); // Smaller text to indicate disabled
    p.text(
      'Sandbox Mode',
      this.modeButtonX + this.modeButtonWidth / 2,
      this.modeButtonY + this.modeButtonHeight / 2
    );
  }

  private drawFireButton() {
    const { p } = this;
    const isDisabled = this.mode === 'sandbox';

    // Button outline
    if (isDisabled) {
      p.stroke(0, 255, 255, 100); // Cyan with alpha
    } else {
      p.stroke(COLORS.CYAN);
    }
    p.strokeWeight(STROKE_WEIGHTS.MEDIUM);
    p.noFill();
    p.rect(
      this.fireButtonX,
      this.fireButtonY,
      this.fireButtonWidth,
      this.fireButtonHeight
    );

    // Button text
    if (isDisabled) {
      p.fill(0, 255, 255, 100); // Cyan with alpha
    } else {
      p.fill(COLORS.CYAN);
    }
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(
      'FIRE!',
      this.fireButtonX + this.fireButtonWidth / 2,
      this.fireButtonY + this.fireButtonHeight / 2
    );
  }

  handleMousePressed(mouseX: number, mouseY: number) {
    // Check slider (only if not in sandbox mode)
    if (this.mode !== 'sandbox') {
      const handleX =
        this.sliderX + (this.bounceCount / this.maxBounces) * this.sliderWidth;
      const dist = Math.abs(mouseX - handleX);
      if (
        mouseY >= this.sliderY + 10 &&
        mouseY <= this.sliderY + 30 &&
        dist < 20
      ) {
        return true; // Will handle in drag
      }
    }

    // Check mode button (disabled for now)
    // TODO: Enable when challenge mode is implemented
    /*
    if (
      this.isInButton(
        mouseX,
        mouseY,
        this.modeButtonX,
        this.modeButtonY,
        this.modeButtonWidth,
        this.modeButtonHeight
      )
    ) {
      this.toggleMode();
      return true;
    }
    */

    // Check fire button
    if (
      this.mode === 'challenge' &&
      this.isInButton(
        mouseX,
        mouseY,
        this.fireButtonX,
        this.fireButtonY,
        this.fireButtonWidth,
        this.fireButtonHeight
      )
    ) {
      this.onFire?.();
      return true;
    }

    return false;
  }

  handleMouseDragged(mouseX: number, mouseY: number) {
    // Check if dragging slider (only if not in sandbox mode)
    if (
      this.mode !== 'sandbox' &&
      mouseY >= this.sliderY &&
      mouseY <= this.sliderY + 40
    ) {
      const newValue = Math.round(
        ((mouseX - this.sliderX) / this.sliderWidth) * this.maxBounces
      );
      const clampedValue = Math.max(0, Math.min(this.maxBounces, newValue));

      if (clampedValue !== this.bounceCount) {
        this.bounceCount = clampedValue;
        this.onBounceChange?.(this.bounceCount);
      }
      return true;
    }
    return false;
  }

  private isInButton(
    mouseX: number,
    mouseY: number,
    buttonX: number,
    buttonY: number,
    buttonWidth: number,
    buttonHeight: number
  ): boolean {
    return (
      mouseX >= buttonX &&
      mouseX <= buttonX + buttonWidth &&
      mouseY >= buttonY &&
      mouseY <= buttonY + buttonHeight
    );
  }

  private toggleMode() {
    this.mode = this.mode === 'sandbox' ? 'challenge' : 'sandbox';
    this.onModeChange?.(this.mode);
  }

  // Set the bounce count programmatically
  setBounceCount(count: number) {
    const clampedValue = Math.max(0, Math.min(this.maxBounces, count));
    if (clampedValue !== this.bounceCount) {
      this.bounceCount = clampedValue;
      this.onBounceChange?.(this.bounceCount);
    }
  }
}
