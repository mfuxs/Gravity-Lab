import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputHandler } from './InputHandler';

describe('InputHandler', () => {
  let canvas;
  let callbacks;
  let inputHandler;
  let state;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    state = { view: { x: 0, y: 0, zoom: 1 }, tool: 'planet', keys: {} };
    callbacks = {
      getState: vi.fn(() => state),
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

  it('should keep persistent drag on quick move-tool tap', () => {
    state.tool = 'move';
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    const startEvent = new MouseEvent('mousedown', { button: 0 });
    Object.defineProperty(startEvent, 'offsetX', { value: 5 });
    Object.defineProperty(startEvent, 'offsetY', { value: 5 });
    canvas.dispatchEvent(startEvent);

    Date.now.mockReturnValue(1100); // 100ms later
    const endEvent = new MouseEvent('mouseup');
    window.dispatchEvent(endEvent);

    expect(inputHandler.drag.isPersistent).toBe(true);
    expect(inputHandler.drag.isDragging).toBe(true);
    Date.now.mockRestore();
  });

  it('should throttle wheel events and update zoom', () => {
    const rectSpy = vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100 });
    const nowSpy = vi.spyOn(performance, 'now');

    const buildEvent = (ts) => {
      nowSpy.mockReturnValue(ts);
      return {
        deltaY: -100,
        clientX: 50,
        clientY: 50,
        preventDefault: vi.fn(),
      };
    };

    inputHandler.handleWheel(buildEvent(0));
    inputHandler.handleWheel(buildEvent(5));
    expect(callbacks.updateView).toHaveBeenCalledTimes(1);

    inputHandler.handleWheel(buildEvent(30));
    expect(callbacks.updateView).toHaveBeenCalledTimes(2);

    rectSpy.mockRestore();
    nowSpy.mockRestore();
  });

  it('should update keys on key events', () => {
    const keyDown = new KeyboardEvent('keydown', { key: 'w' });
    window.dispatchEvent(keyDown);
    expect(callbacks.updateKeys).toHaveBeenCalledWith(expect.objectContaining({ w: true }));

    const keyUp = new KeyboardEvent('keyup', { key: 'w' });
    window.dispatchEvent(keyUp);
    expect(callbacks.updateKeys).toHaveBeenCalledWith(expect.objectContaining({ w: false }));
  });

  it('should detach event listeners', () => {
    inputHandler.detach();
    
    // Try to start drag after detach
    const event = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 });
    Object.defineProperty(event, 'offsetX', { value: 100 });
    Object.defineProperty(event, 'offsetY', { value: 100 });
    
    canvas.dispatchEvent(event);
    
    expect(inputHandler.drag.isDragging).toBe(false);
    expect(callbacks.updateDrag).not.toHaveBeenCalled();
  });
});
