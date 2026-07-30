import { LandmarkOverlayService } from '../services/LandmarkOverlayService';

export enum NodeState {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  CURRENT = 'CURRENT'
}

export interface LevelNodeConfig {
  venueId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  index: number;
  state: NodeState;
  onClick: (venueId: string) => void;
}

export class LevelNode {
  private marker: any = null;
  private el: HTMLElement;
  public config: LevelNodeConfig;

  constructor(map: any, config: LevelNodeConfig) {
    this.config = config;
    
    // Create the DOM element
    this.el = document.createElement('div');
    this.el.className = 'level-node-container';
    // Billboard styling to always face the camera reliably
    this.el.style.position = 'absolute';
    this.el.style.transform = 'translate(-50%, -100%)'; // Anchor at bottom center
    this.el.style.zIndex = '10'; // Above path, below UI
    this.el.style.pointerEvents = 'auto'; // allow clicking

    this.renderState();

    // MapLibre expects window.maplibregl
    const ml = (window as any).maplibregl;
    this.marker = new ml.Marker({ element: this.el, anchor: 'bottom' })
      .setLngLat([config.longitude, config.latitude])
      .addTo(map);
  }

  public updateState(newState: NodeState) {
    if (this.config.state === newState) return;
    this.config.state = newState;
    this.renderState();
  }

  public getDOMElement(): HTMLElement {
    return this.el;
  }

  public remove() {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
  }

  private renderState() {
    // Clear previous
    this.el.innerHTML = '';

    // Get color from LandmarkOverlayService or fallback
    const landmarks = LandmarkOverlayService.getLandmarks();
    const lm = landmarks.find(l => l.id === this.config.venueId);
    
    // Pick premium vibrant colors for venues without an explicit landmark color
    const defaultColors = [
      '#F59E0B', '#DC2626', '#2563EB', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'
    ];
    const color: string = lm && lm.color ? lm.color : (defaultColors[this.config.index % defaultColors.length] || '#3b82f6');

    const isLocked = this.config.state === NodeState.LOCKED;
    const isCurrent = this.config.state === NodeState.CURRENT;

    // Outer Badge
    const badge = document.createElement('div');
    badge.style.width = '70px';
    badge.style.height = '70px';
    badge.style.borderRadius = '50%';
    badge.style.background = isLocked ? '#555555' : color;
    badge.style.border = '4px solid #ffffff';
    badge.style.boxShadow = isLocked 
      ? '0 4px 6px rgba(0,0,0,0.5)' 
      : `0 0 20px ${color}, 0 6px 12px rgba(0,0,0,0.4)`;
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.position = 'relative';
    badge.style.transition = 'all 0.3s ease';
    badge.style.cursor = isLocked ? 'not-allowed' : 'pointer';

    if (isLocked) {
      badge.style.opacity = '0.5';
      badge.style.filter = 'grayscale(100%)';
    } else {
      badge.style.opacity = '1';
      badge.style.filter = 'none';
      
      // Idle pulsing glow for unlocked/current
      badge.animate([
        { transform: 'scale(1)', boxShadow: `0 0 10px ${color}, 0 4px 8px rgba(0,0,0,0.4)` },
        { transform: 'scale(1.05)', boxShadow: `0 0 25px ${color}, 0 8px 16px rgba(0,0,0,0.5)` },
        { transform: 'scale(1)', boxShadow: `0 0 10px ${color}, 0 4px 8px rgba(0,0,0,0.4)` }
      ], {
        duration: 2000,
        iterations: Infinity,
        easing: 'ease-in-out'
      });
    }

    const badgeWrapper = document.createElement('div');
    badgeWrapper.style.transition = 'transform 0.2s ease, filter 0.2s ease';
    badgeWrapper.style.transformOrigin = 'center';
    
    badgeWrapper.addEventListener('pointerenter', () => {
      if (!isLocked) {
        badgeWrapper.style.transform = 'scale(1.15)';
        badgeWrapper.style.filter = 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))';
        this.el.style.zIndex = '100'; // Bring to front when hovering
      }
    });

    badgeWrapper.addEventListener('pointerleave', () => {
      if (!isLocked) {
        badgeWrapper.style.transform = 'scale(1)';
        badgeWrapper.style.filter = 'none';
        this.el.style.zIndex = '10';
      }
    });

    badgeWrapper.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (!isLocked) {
        badgeWrapper.style.transform = 'scale(0.9)';
        setTimeout(() => {
          badgeWrapper.style.transform = 'scale(1.15)';
          this.config.onClick(this.config.venueId);
        }, 100);
      } else {
        // Locked level feedback
        badgeWrapper.classList.remove('rattle-flash');
        void badgeWrapper.offsetWidth; // trigger reflow
        badgeWrapper.classList.add('rattle-flash');
      }
    });

    // Number label
    const num = document.createElement('div');
    num.style.position = 'absolute';
    num.style.top = '-10px';
    num.style.left = '-10px';
    num.style.background = '#ffffff';
    num.style.color = '#000000';
    num.style.fontWeight = 'bold';
    num.style.fontFamily = 'Arial, sans-serif';
    num.style.width = '28px';
    num.style.height = '28px';
    num.style.borderRadius = '50%';
    num.style.display = 'flex';
    num.style.alignItems = 'center';
    num.style.justifyContent = 'center';
    num.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    num.style.zIndex = '2';
    num.textContent = (this.config.index + 1).toString();
    badge.appendChild(num);

    // Landmark Icon (Task 2.4)
    const iconUrl = `/assets/sprites/ui/venues/${this.config.venueId}.png`;
    const icon = document.createElement('img');
    icon.src = iconUrl;
    icon.style.width = '44px';
    icon.style.height = '44px';
    icon.style.objectFit = 'contain';
    icon.style.zIndex = '1';
    
    // If the image fails to load, fallback to text
    icon.onerror = () => {
      badge.removeChild(icon);
      const fallback = document.createElement('div');
      fallback.textContent = this.config.displayName.charAt(0);
      fallback.style.fontSize = '32px';
      fallback.style.fontWeight = 'bold';
      fallback.style.color = '#fff';
      fallback.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
      badge.appendChild(fallback);
    };

    if (isLocked) {
      // Padlock overlay
      const pad = document.createElement('div');
      pad.textContent = '🔒';
      pad.style.fontSize = '32px';
      pad.style.position = 'absolute';
      pad.style.zIndex = '3';
      badge.appendChild(pad);
      icon.style.opacity = '0.3';
    }

    badge.appendChild(icon);
    badgeWrapper.appendChild(badge);
    
    // Name label underneath the badge (attached to wrapper to scale on hover)
    const nameLabel = document.createElement('div');
    nameLabel.textContent = this.config.displayName;
    nameLabel.style.position = 'absolute';
    nameLabel.style.top = '75px';
    nameLabel.style.left = '35px'; // 35px is the center of the 70px badge
    nameLabel.style.transform = 'translateX(-50%)';
    nameLabel.style.whiteSpace = 'nowrap';
    nameLabel.style.color = isLocked ? '#aaaaaa' : '#ffffff';
    nameLabel.style.fontFamily = '"Nunito", sans-serif';
    nameLabel.style.fontSize = '16px';
    nameLabel.style.fontWeight = '900';
    nameLabel.style.textShadow = '0px 2px 4px rgba(0,0,0,0.8), 0px 0px 3px rgba(0,0,0,1)';
    nameLabel.style.pointerEvents = 'none';
    nameLabel.style.textAlign = 'center';
    nameLabel.style.zIndex = '5';
    badgeWrapper.appendChild(nameLabel);
    
    this.el.appendChild(badgeWrapper);

    if (isCurrent) {
      // Animate the entire node jumping to highlight it is ready
      badgeWrapper.animate([
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-15px)' },
        { transform: 'translateY(0px)' }
      ], {
        duration: 1000,
        iterations: Infinity,
        easing: 'ease-in-out'
      });
    }
  }
}
