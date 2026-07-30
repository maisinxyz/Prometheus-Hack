export class CursorManager {
  private birdEl: HTMLElement;
  private shaftEl: HTMLElement;
  private isInitialized = false;
  private mode: 'bird' | 'grabber' = 'bird';
  private hidden = false;

  constructor() {
    this.birdEl = document.createElement('div');
    this.birdEl.id = 'bird-cursor';
    this.birdEl.textContent = '🦅';
    this.birdEl.style.fontSize = '36px';
    this.birdEl.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))';

    this.shaftEl = document.createElement('div');
    this.shaftEl.id = 'grabber-shaft';
    this.shaftEl.style.position = 'fixed';
    this.shaftEl.style.pointerEvents = 'none';
    this.shaftEl.style.zIndex = '99998'; // Just below birdEl
    this.shaftEl.style.display = 'none';
    this.shaftEl.style.background = 'linear-gradient(to right, #0f172a 0%, #475569 50%, #94a3b8 100%)';
    this.shaftEl.style.height = '14px';
    this.shaftEl.style.borderRadius = '7px';
    this.shaftEl.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
    this.shaftEl.style.transformOrigin = 'left center'; 
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    document.body.appendChild(this.shaftEl);
    document.body.appendChild(this.birdEl);

    let lastX = 0;
    
    window.addEventListener('mousemove', (e) => {
      if (this.hidden) {
        document.body.classList.add('show-native-cursor');
        this.birdEl.style.display = 'none';
        if (this.shaftEl) this.shaftEl.style.display = 'none';
        return;
      }

      const x = e.clientX;
      const y = e.clientY;
      
      const target = e.target as HTMLElement | null;
      let isPointer = false;
      
      if (target) {
        const inlineCursor = target.style?.cursor;
        if (inlineCursor === 'pointer') {
          isPointer = true;
        }
        
        const tag = target.tagName?.toLowerCase();
        if (tag && ['button', 'input', 'a', 'select', 'textarea'].includes(tag)) {
          isPointer = true;
        }
        
        if (typeof target.closest === 'function' && target.closest('.venue-annotation')) {
          isPointer = true;
        }
      }

      this.birdEl.style.left = `${x}px`;
      this.birdEl.style.top = `${y}px`;

      if (isPointer && this.mode === 'bird') {
        document.body.classList.add('show-native-cursor');
        this.birdEl.style.display = 'none';
        if (this.shaftEl) this.shaftEl.style.display = 'none';
      } else {
        document.body.classList.remove('show-native-cursor');
        this.birdEl.style.display = 'block';
        
        let angle = 0;
        let flip = 'scaleX(1)';
        
        if (this.mode === 'bird') {
          if (this.shaftEl) this.shaftEl.style.display = 'none';
          this.birdEl.textContent = '🦅';
          flip = x < lastX ? 'scaleX(1)' : 'scaleX(-1)';
          this.birdEl.style.marginLeft = `0px`;
          this.birdEl.style.marginTop = `0px`;
          this.birdEl.style.transformOrigin = `center`;
          this.birdEl.style.transform = `translate(-50%, -50%) ${flip}`;
        } else if (this.mode === 'grabber') {
          if (this.shaftEl) {
            this.shaftEl.style.display = 'block';
            
            // Pivot point at the bottom center (first-person view)
            const pivotX = window.innerWidth / 2;
            const pivotY = window.innerHeight + 150; 
            
            const dx = x - pivotX;
            const dy = y - pivotY;
            const dist = Math.hypot(dx, dy);
            angle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Shaft styling and positioning
            this.shaftEl.style.left = `${pivotX}px`;
            this.shaftEl.style.top = `${pivotY}px`;
            this.shaftEl.style.width = `${Math.max(0, dist - 100)}px`; // stops at the grabber base
            this.shaftEl.style.transform = `translateY(-50%) rotate(${angle}deg)`;
          }

          this.birdEl.style.marginLeft = `-114px`; // Align the SVG's pinch point (114, 64) to the cursor
          this.birdEl.style.marginTop = `-64px`;
          this.birdEl.style.transformOrigin = `114px 64px`;
          this.birdEl.style.transform = `rotate(${angle}deg)`;
        }
      }

      // 10% chance to spawn a wind particle when moving (only if bird)
      if (this.mode === 'bird' && !isPointer && Math.random() < 0.15) {
        this.spawnWindParticle(x, y, x < lastX);
      }
    });

    // Handle grabber claw interactions
    window.addEventListener('mousedown', () => {
      if (this.mode === 'grabber') {
        const leftClaw = document.getElementById('claw-left');
        const rightClaw = document.getElementById('claw-right');
        if (leftClaw && rightClaw) {
          leftClaw.style.transform = 'rotate(35deg)';
          rightClaw.style.transform = 'rotate(-35deg)';
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.mode === 'grabber') {
        const leftClaw = document.getElementById('claw-left');
        const rightClaw = document.getElementById('claw-right');
        if (leftClaw && rightClaw) {
          leftClaw.style.transform = 'rotate(0deg)';
          rightClaw.style.transform = 'rotate(0deg)';
        }
      }
    });
  }

  public setVisible(visible: boolean) {
    this.hidden = !visible;
    if (this.hidden) {
      document.body.classList.add('show-native-cursor');
      this.birdEl.style.display = 'none';
      if (this.shaftEl) this.shaftEl.style.display = 'none';
    } else {
      document.body.classList.remove('show-native-cursor');
      this.birdEl.style.display = 'block';
    }
  }

  public setMode(mode: 'bird' | 'grabber') {
    if (this.mode === mode) return;
    this.mode = mode;
    
    if (this.mode === 'bird') {
      this.birdEl.innerHTML = '';
      this.birdEl.textContent = '🦅';
      this.birdEl.style.fontSize = '36px';
    } else {
      this.birdEl.textContent = '';
      this.birdEl.innerHTML = `
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="3" dy="5" stdDeviation="4" flood-opacity="0.6"/>
            </filter>
            <!-- Metallic gradient for the base -->
            <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#4b5563"/>
              <stop offset="50%" stop-color="#9ca3af"/>
              <stop offset="100%" stop-color="#1f2937"/>
            </linearGradient>
          </defs>
          <g filter="url(#shadow)">
            <!-- Grabber Neck/Base -->
            <path d="M 0 58 L 24 58 C 38 58, 46 50, 52 46 L 52 82 C 46 78, 38 70, 24 70 L 0 70 Z" fill="url(#metal)" />
            <path d="M 0 60 L 24 60 C 34 60, 42 54, 48 50 L 48 78 C 42 74, 34 68, 24 68 L 0 68 Z" fill="#1f2937" />
            
            <!-- Top Claw (Pivots at 48, 48) -->
            <g id="claw-left" style="transform-origin: 48px 48px; transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); transform: rotate(0deg);">
              <!-- Black Plastic Outer -->
              <path d="M 46 48 L 72 22 C 88 6, 110 12, 116 22" fill="none" stroke="#111827" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Red Rubber Grip Inner -->
              <path d="M 52 50 L 73 28 C 88 14, 108 19, 113 26" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Grip Teeth -->
              <path d="M 75 28 L 79 32 L 83 26 L 87 31 L 91 25 L 95 30 L 99 24 L 103 29" fill="none" stroke="#991b1b" stroke-width="2" stroke-linejoin="round"/>
            </g>
            
            <!-- Bottom Claw (Pivots at 48, 80) -->
            <g id="claw-right" style="transform-origin: 48px 80px; transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); transform: rotate(0deg);">
              <!-- Black Plastic Outer -->
              <path d="M 46 80 L 72 106 C 88 122, 110 116, 116 106" fill="none" stroke="#111827" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Red Rubber Grip Inner -->
              <path d="M 52 78 L 73 100 C 88 114, 108 109, 113 102" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Grip Teeth -->
              <path d="M 75 100 L 79 96 L 83 102 L 87 97 L 91 103 L 95 98 L 99 104 L 103 99" fill="none" stroke="#991b1b" stroke-width="2" stroke-linejoin="round"/>
            </g>

            <!-- Silver Hinge Rivets -->
            <circle cx="48" cy="48" r="4" fill="#111827" />
            <circle cx="48" cy="48" r="2.5" fill="#e5e7eb" />
            <circle cx="48" cy="80" r="4" fill="#111827" />
            <circle cx="48" cy="80" r="2.5" fill="#e5e7eb" />
          </g>
        </svg>
      `;
    }
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
