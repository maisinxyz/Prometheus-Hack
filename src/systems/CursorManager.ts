export class CursorManager {
  private birdEl: HTMLElement;
  private isInitialized = false;

  constructor() {
    this.birdEl = document.createElement('div');
    this.birdEl.id = 'bird-cursor';
    // Realistic flying bird SVG
    this.birdEl.textContent = '🦅';
    this.birdEl.style.fontSize = '36px';
    this.birdEl.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))';
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    document.body.appendChild(this.birdEl);

    let lastX = 0;
    
    window.addEventListener('mousemove', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      
      const target = e.target as HTMLElement;
      let hideBird = false;
      const compCursor = window.getComputedStyle(target).cursor;

      if (compCursor === 'pointer') {
        hideBird = true;
      }
      const tag = target.tagName.toLowerCase();
      if (['button', 'input', 'a', 'select', 'textarea'].includes(tag)) {
        hideBird = true;
      }
      if (target.closest('.venue-annotation')) hideBird = true;

      if (hideBird) {
        this.birdEl.style.display = 'none';
        if (compCursor === 'none') {
          target.style.cursor = 'default';
        }
      } else {
        this.birdEl.style.display = 'block';
      }

      // Face bird in direction of movement
      const flip = x < lastX ? 'scaleX(1)' : 'scaleX(-1)';
      lastX = x;

      this.birdEl.style.left = `${x}px`;
      this.birdEl.style.top = `${y}px`;
      this.birdEl.style.transform = `translate(-50%, -50%) ${flip}`;

      // 10% chance to spawn a wind particle when moving
      if (Math.random() < 0.15) {
        this.spawnWindParticle(x, y, x < lastX);
      }
    });
  }

  private spawnWindParticle(x: number, y: number, movingLeft: boolean) {
    const p = document.createElement('div');
    p.className = 'wind-particle';
    // Offset slightly from center
    const offsetX = (Math.random() - 0.5) * 30;
    const offsetY = (Math.random() - 0.5) * 30;
    
    p.style.left = `${x + offsetX}px`;
    p.style.top = `${y + offsetY}px`;
    p.style.opacity = '1';
    
    document.body.appendChild(p);

    // Force reflow
    void p.offsetWidth;

    // Wind moves in the opposite direction of the bird
    const driftX = movingLeft ? 40 + Math.random() * 20 : -40 - Math.random() * 20;
    const driftY = (Math.random() - 0.5) * 20;

    // Animate it fading out and drifting
    p.style.transform = `translate(${driftX}px, ${driftY}px) scale(0.1)`;
    p.style.opacity = '0';

    setTimeout(() => {
      p.remove();
    }, 500);
  }
}
