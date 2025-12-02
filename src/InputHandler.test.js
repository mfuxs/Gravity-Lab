import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputHandler } from './InputHandler';

describe('InputHandler', () => {
  let canvas;
  let callbacks;
  let inputHandler;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    callbacks = {
      getState: vi.fn().mockReturnValue({ view: { x: 0, y: 0, zoom: 1 }, tool: 'planet' }),
      updateDrag: vi.fn(),
      updateView: vi.fn(),
      updateKeys: vi.fn(),
      onDragEnd: vi.fn(),
    };
    inputHandler = new InputHandler(canvas, callbacks);
    inputHandler.attach();
  });

  it('should handle mouse down (start drag)', () => {
    const event = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 });
    // Mock offsetX/Y since jsdom MouseEvent doesn't have them
    Object.defineProperty(event, 'offsetX', { value: 100 });
    Object.defineProperty(event, 'offsetY', { value: 100 });
    
    canvas.dispatchEvent(event);
    
    expect(inputHandler.drag.isDragging).toBe(true);
    expect(inputHandler.drag.startX).toBe(100);
    expect(callbacks.updateDrag).toHaveBeenCalled();
  });

  it('should handle mouse move (pan)', () => {
    // Start pan
    const startEvent = new MouseEvent('mousedown', { button: 2, clientX: 0, clientY: 0 });
    Object.defineProperty(startEvent, 'offsetX', { value: 0 });
    Object.defineProperty(startEvent, 'offsetY', { value: 0 });
    canvas.dispatchEvent(startEvent);
    
    // Move
    const moveEvent = new MouseEvent('mousemove', { clientX: 10, clientY: 10 });
    Object.defineProperty(moveEvent, 'offsetX', { value: 10 });
    Object.defineProperty(moveEvent, 'offsetY', { value: 10 });
    canvas.dispatchEvent(moveEvent);
    
    expect(callbacks.updateView).toHaveBeenCalledWith({ x: 10, y: 10, zoom: 1 });
  });
});
