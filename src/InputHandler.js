export class InputHandler {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.keys = {};
    this.drag = { isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0, dragType: null };
    
    // Bind methods
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  attach() {
    this.canvas.addEventListener('mousedown', (e) => this.handleStart(e.offsetX, e.offsetY, e.button === 2));
    this.canvas.addEventListener('mousemove', (e) => this.handleMove(e.offsetX, e.offsetY));
    this.canvas.addEventListener('mouseup', this.handleEnd);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  detach() {
    this.canvas.removeEventListener('mousedown', (e) => this.handleStart(e.offsetX, e.offsetY, e.button === 2));
    this.canvas.removeEventListener('mousemove', (e) => this.handleMove(e.offsetX, e.offsetY));
    this.canvas.removeEventListener('mouseup', this.handleEnd);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  handleContextMenu(e) {
    e.preventDefault();
  }

  handleStart(x, y, isRightClick) {
    const { tool, view, bodies } = this.callbacks.getState();
    
    if (isRightClick) {
      this.drag = { isDragging: true, startX: x, startY: y, currentX: x, currentY: y, dragType: 'pan' };
    } else {
      // Check for clickable objects first (like planets in mission planner)
      // But for now, we just start a 'create' drag or 'pan' depending on tool
      // Actually, existing logic uses 'create' for most tools
      this.drag = { isDragging: true, startX: x, startY: y, currentX: x, currentY: y, dragType: 'create' };
    }
    this.callbacks.updateDrag(this.drag);
  }

  handleMove(x, y) {
    if (!this.drag.isDragging) {
      // Just update current mouse position for hover effects
      this.drag.currentX = x;
      this.drag.currentY = y;
      this.callbacks.updateDrag({ ...this.drag }); // Update ref without full state update if possible? 
      // Actually GravitySim uses a ref for drag, so we can just mutate it?
      // But we need to trigger re-renders for some things.
      // The original code updated dragRef.current directly.
      return;
    }

    const { view } = this.callbacks.getState();

    if (this.drag.dragType === 'pan') {
      const dx = x - this.drag.currentX;
      const dy = y - this.drag.currentY;
      this.callbacks.updateView({ x: view.x + dx, y: view.y + dy, zoom: view.zoom });
      this.drag.currentX = x;
      this.drag.currentY = y;
    } else {
      this.drag.currentX = x;
      this.drag.currentY = y;
    }
    this.callbacks.updateDrag(this.drag);
  }

  handleEnd() {
    if (!this.drag.isDragging) return;
    
    const { tool, view, bodies, missionState, missionConfig } = this.callbacks.getState();
    const { startX, startY, currentX, currentY } = this.drag;
    const { x: panX, y: panY, zoom } = view;

    if (this.drag.dragType === 'create') {
      // Delegate creation logic to callback to keep InputHandler generic?
      // Or keep it here? The plan said "InputHandler class... handleStart... handleEnd".
      // To keep it clean, let's pass the drag data to a "onDragEnd" callback.
      this.callbacks.onDragEnd(this.drag);
    }

    this.drag.isDragging = false;
    this.callbacks.updateDrag(this.drag);
  }

  handleWheel(e) {
    e.preventDefault();
    const { view } = this.callbacks.getState();
    const zoomSensitivity = 0.001;
    const newZoom = Math.max(0.01, Math.min(5, view.zoom - e.deltaY * zoomSensitivity));
    
    // Zoom towards mouse pointer
    // worldX = (mouseX - panX) / zoom
    // newPanX = mouseX - worldX * newZoom
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - view.x) / view.zoom;
    const worldY = (mouseY - view.y) / view.zoom;
    
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    this.callbacks.updateView({ x: newPanX, y: newPanY, zoom: newZoom });
  }

  handleKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
    this.callbacks.updateKeys(this.keys);
    
    // Handle special keys like Space for Pause?
    // if (e.code === 'Space') { ... }
  }

  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
    this.callbacks.updateKeys(this.keys);
  }
}
