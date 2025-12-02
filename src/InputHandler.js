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
    window.addEventListener('mouseup', this.handleEnd);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  detach() {
    this.canvas.removeEventListener('mousedown', (e) => this.handleStart(e.offsetX, e.offsetY, e.button === 2));
    this.canvas.removeEventListener('mousemove', (e) => this.handleMove(e.offsetX, e.offsetY));
    window.removeEventListener('mouseup', this.handleEnd);
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
    
    // Check if we are currently in a persistent drag (Move tool only)
    if (tool === 'move' && this.drag.isDragging) {
        this.drag.isDragging = false;
        this.drag.isPersistent = false;
        this.callbacks.updateDrag(this.drag);
        return;
    }

    if (isRightClick || tool === 'move') {
      this.drag = { 
        isDragging: true, 
        startX: x, startY: y, 
        currentX: x, currentY: y, 
        dragType: 'pan',
        startTime: Date.now(),
        isPersistent: false
      };
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
      this.callbacks.updateDrag({ ...this.drag }); 
      return;
    }

    // console.log('handleMove dragging', { x, y }); // Too noisy

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
      this.callbacks.onDragEnd(this.drag);
    } else if (this.drag.dragType === 'pan') {
        const duration = Date.now() - this.drag.startTime;
        const dist = Math.hypot(this.drag.startX - this.drag.currentX, this.drag.startY - this.drag.currentY);
        
        // If it was a quick click (and we are in move tool), stay in drag mode (Persistent)
        // Thresholds: < 200ms and < 5px movement
        if (tool === 'move' && duration < 200 && dist < 5) {
            this.drag.isPersistent = true;
            // Do NOT set isDragging to false
            this.callbacks.updateDrag(this.drag);
            return; 
        }
    }

    this.drag.isDragging = false;
    this.drag.isPersistent = false;
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
