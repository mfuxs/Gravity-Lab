export class Quadtree {
  constructor(x, y, width, height) {
    this.bounds = { x, y, width, height };
    this.body = null;
    this.mass = 0;
    this.comX = 0;
    this.comY = 0;
    this.children = null; // [NW, NE, SW, SE]
  }

  insert(body) {
    // If the body is outside the bounds, we can't insert it (or we should have sized the tree better)
    // For this implementation, we assume the tree is large enough.
    
    // 1. If node is empty (no body, no children)
    if (!this.body && !this.children) {
      this.body = body;
      this.mass = body.mass;
      this.comX = body.x;
      this.comY = body.y;
      return;
    }

    // 2. If node is a leaf (has body, no children)
    if (this.children === null) {
      // We need to split.
      this._subdivide();
      
      // Move existing body to child
      // Note: We don't update COM here because we'll do it cleanly in step 3
      // But wait, if we are converting from leaf to branch, we need to re-insert the old body
      // into the children, and then insert the new body.
      // The COM/Mass of THIS node is already set to the old body.
      // We will update it when we add the new body.
      
      const oldBody = this.body;
      this.body = null;
      this._insertIntoChild(oldBody);
    }

    // 3. Node is internal (has children)
    // Update Center of Mass and Total Mass
    const totalMass = this.mass + body.mass;
    this.comX = (this.comX * this.mass + body.x * body.mass) / totalMass;
    this.comY = (this.comY * this.mass + body.y * body.mass) / totalMass;
    this.mass = totalMass;

    this._insertIntoChild(body);
  }

  _subdivide() {
    const { x, y, width, height } = this.bounds;
    const w2 = width / 2;
    const h2 = height / 2;

    this.children = [
      new Quadtree(x, y, w2, h2),           // NW
      new Quadtree(x + w2, y, w2, h2),      // NE
      new Quadtree(x, y + h2, w2, h2),      // SW
      new Quadtree(x + w2, y + h2, w2, h2)  // SE
    ];
  }

  _insertIntoChild(body) {
    // Find which child covers the body
    // This assumes bodies don't overlap boundaries in a way that matters for point-insertion
    const { x, y, width, height } = this.bounds;
    const midX = x + width / 2;
    const midY = y + height / 2;

    const isRight = body.x >= midX;
    const isBottom = body.y >= midY;

    let index = 0;
    if (isRight) index += 1;
    if (isBottom) index += 2;

    this.children[index].insert(body);
  }

  calculateForce(body, theta, G, softening) {
    // 1. Empty node
    if (this.mass === 0) return { fx: 0, fy: 0 };

    const dx = this.comX - body.x;
    const dy = this.comY - body.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    // 2. Leaf node
    if (!this.children) {
      if (this.body === body || dist < 0.001) return { fx: 0, fy: 0 }; // Self or too close
      const f = (G * body.mass * this.mass) / (distSq + softening);
      return { fx: f * (dx / dist), fy: f * (dy / dist) };
    }

    // 3. Internal node
    // Barnes-Hut criterion: s / d < theta
    const s = this.bounds.width;
    if (s / dist < theta) {
      // Treat as single body
      const f = (G * body.mass * this.mass) / (distSq + softening);
      return { fx: f * (dx / dist), fy: f * (dy / dist) };
    } else {
      // Recurse
      let fx = 0, fy = 0;
      for (const child of this.children) {
        const f = child.calculateForce(body, theta, G, softening);
        fx += f.fx;
        fy += f.fy;
      }
      return { fx, fy };
    }
  }
}
