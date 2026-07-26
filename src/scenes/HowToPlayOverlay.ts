import { UI_THEME } from '../config/UITheme';

export class HowToPlayOverlay extends Phaser.Scene {
  private htmlContainer!: HTMLDivElement;

  constructor() {
    super({ key: 'HowToPlayOverlay' });
  }

  create(): void {
    this.htmlContainer = document.createElement('div');
    this.htmlContainer.style.position = 'absolute';
    this.htmlContainer.style.top = '0';
    this.htmlContainer.style.left = '0';
    this.htmlContainer.style.width = '100vw';
    this.htmlContainer.style.height = '100vh';
    this.htmlContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.htmlContainer.style.zIndex = '100'; // Above the map and ui elements
    this.htmlContainer.style.display = 'flex';
    this.htmlContainer.style.alignItems = 'center';
    this.htmlContainer.style.justifyContent = 'center';
    this.htmlContainer.style.fontFamily = "'Nunito', sans-serif";
    
    const panel = document.createElement('div');
    panel.style.width = '90%';
    panel.style.maxWidth = '800px';
    panel.style.maxHeight = '90vh';
    panel.style.overflowY = 'auto';
    panel.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)';
    panel.style.borderRadius = '16px';
    panel.style.border = '2px solid #3b82f6';
    panel.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)';
    panel.style.padding = '40px';
    panel.style.color = '#ffffff';
    panel.style.position = 'relative';

    const title = document.createElement('h1');
    title.innerText = 'HOW TO PLAY';
    title.style.fontSize = '36px';
    title.style.fontWeight = '900';
    title.style.textAlign = 'center';
    title.style.margin = '0 0 30px 0';
    title.style.letterSpacing = '2px';
    title.style.color = '#60a5fa';
    panel.appendChild(title);

    const textStyle = 'font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #cbd5e1;';
    const boldStyle = 'font-weight: bold; color: #f8fafc; font-size: 18px; margin-bottom: 8px;';

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="${boldStyle}">👉 BASICS</div>
      <div style="${textStyle}">Drag the trash items dropping onto the screen into the correct bins before the timer runs out! If you drop them in the wrong bin or run out of time, you lose CHI.</div>
      
      <div style="${boldStyle}">🗑️ THE BINS</div>
      <ul style="${textStyle} margin-left: 20px; padding-left: 0;">
        <li style="margin-bottom: 8px;"><strong style="color: #60a5fa;">Recycle (Blue):</strong> Glass, Plastic, Cans, Clean Paper</li>
        <li style="margin-bottom: 8px;"><strong style="color: #34d399;">Compost (Green):</strong> Food Scraps, Yard Waste, Soiled Paper</li>
        <li style="margin-bottom: 8px;"><strong style="color: #9ca3af;">Landfill (Black):</strong> Wrappers, Styrofoam, Non-recyclables</li>
        <li style="margin-bottom: 8px;"><strong style="color: #f87171;">Hazardous (Red):</strong> Batteries, E-Waste, Chemicals</li>
      </ul>

      <div style="${boldStyle}">✨ CHI (CITY HEALTH INDEX)</div>
      <div style="${textStyle}">Correct drops increase the city's CHI. Incorrect drops decrease it. Earning enough CHI will unlock new venues and trigger special Eco-Festivals! Watch out: if CHI drops too low, bad weather will strike.</div>

      <div style="${boldStyle}">🔥 PERFECT STREAK</div>
      <div style="${textStyle}">Score consecutive perfect rounds (100% accuracy) to build your Perfect Streak! Your streak adds flashy visual flair and fanfare to your game, proving your mastery.</div>
    `;
    panel.appendChild(content);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'CLOSE';
    closeBtn.style.display = 'block';
    closeBtn.style.margin = '30px auto 0 auto';
    closeBtn.style.padding = '12px 40px';
    closeBtn.style.background = 'linear-gradient(to bottom, #3b82f6, #2563eb)';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '30px';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    closeBtn.addEventListener('click', () => {
      this.closeOverlay();
    });
    panel.appendChild(closeBtn);

    this.htmlContainer.appendChild(panel);
    document.body.appendChild(this.htmlContainer);
  }

  private closeOverlay(): void {
    if (this.htmlContainer) {
      this.htmlContainer.remove();
    }
    const trayScene = this.scene.get('TrayScene') as any;
    if (trayScene && trayScene.sys.isActive() && trayScene.resumeTimer) {
      trayScene.resumeTimer();
    }
    this.scene.stop();
  }
}

