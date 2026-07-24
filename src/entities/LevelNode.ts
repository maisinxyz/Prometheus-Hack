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

    // Event listener
    this.el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.config.state !== NodeState.LOCKED) {
        // Add a satisfying little pop animation on click
        this.el.style.transform = 'translate(-50%, -100%) scale(0.9)';
        setTimeout(() => {
          this.el.style.transform = 'translate(-50%, -100%) scale(1)';
          this.config.onClick(this.config.venueId);
        }, 100);
      }
    });
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
    this.el.appendChild(badge);

    // Current Marker bobbing arrow
    if (isCurrent) {
      const arrow = document.createElement('div');
      arrow.textContent = '▼';
      arrow.style.color = '#FCD34D'; // bright yellow
      arrow.style.fontSize = '32px';
      arrow.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
      arrow.style.position = 'absolute';
      arrow.style.top = '-40px';
      arrow.style.left = '50%';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.zIndex = '4';
      
      arrow.animate([
        { top: '-40px' },
        { top: '-50px' },
        { top: '-40px' }
      ], {
        duration: 1000,
        iterations: Infinity,
        easing: 'ease-in-out'
      });
      
      this.el.appendChild(arrow);
    }
  }
}
