import Phaser from 'phaser';

export class ObjectiveOverlay extends Phaser.Scene {
  private htmlContainer!: HTMLDivElement;

  constructor() {
    super({ key: 'ObjectiveOverlay' });
  }

  create(): void {
    this.htmlContainer = document.createElement('div');
    this.htmlContainer.style.position = 'absolute';
    this.htmlContainer.style.top = '0';
    this.htmlContainer.style.left = '0';
    this.htmlContainer.style.width = '100vw';
    this.htmlContainer.style.height = '100vh';
    this.htmlContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
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
    panel.style.background = 'linear-gradient(135deg, #064e3b, #022c22)';
    panel.style.borderRadius = '16px';
    panel.style.border = '2px solid #10b981';
    panel.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)';
    panel.style.padding = '40px';
    panel.style.color = '#ffffff';
    panel.style.position = 'relative';

    const title = document.createElement('h1');
    title.innerText = 'WHY IT MATTERS';
    title.style.fontSize = '36px';
    title.style.fontWeight = '900';
    title.style.textAlign = 'center';
    title.style.margin = '0 0 30px 0';
    title.style.letterSpacing = '2px';
    title.style.color = '#34d399';
    panel.appendChild(title);

    const textStyle = 'font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #a7f3d0;';
    const boldStyle = 'font-weight: bold; color: #ecfdf5; font-size: 18px; margin-bottom: 8px;';

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="${boldStyle}">🌍 WHY UNDERSTANDING ENVIRONMENTAL IMPACT IS IMPORTANT</div>
      <div style="${textStyle}">Every action we take affects the ecosystem around us. Understanding our environmental impact helps us make informed decisions that protect natural resources, sustain wildlife, and ensure a healthy planet for future generations. It empowers communities to build resilience against climate change.</div>
      
      <div style="${boldStyle}">⚠️ HOW IT HURTS</div>
      <div style="${textStyle}">Improper waste disposal leads to severe consequences. Plastic pollution contaminates oceans, harms marine life, and enters our food chain. Landfills release methane—a potent greenhouse gas—while hazardous chemicals from e-waste can leach into soil and groundwater, causing long-term ecological and health crises.</div>
      
      <div style="${boldStyle}">🛡️ HOW TO PREVENT IT</div>
      <ul style="${textStyle} margin-left: 20px; padding-left: 0;">
        <li style="margin-bottom: 8px;"><strong style="color: #6ee7b7;">Sort Correctly:</strong> Always separate recyclables, compost, and hazardous waste from general landfill trash.</li>
        <li style="margin-bottom: 8px;"><strong style="color: #6ee7b7;">Reduce & Reuse:</strong> Minimize single-use plastics and opt for reusable alternatives whenever possible.</li>
        <li style="margin-bottom: 8px;"><strong style="color: #6ee7b7;">Educate:</strong> Share knowledge with your community (just like this game does!) to multiply positive impact.</li>
      </ul>

      <div style="${boldStyle}">💡 IMPORTANT INFORMATION</div>
      <div style="${textStyle}">A single piece of recycled aluminum saves enough energy to run a television for three hours. Small, consistent daily habits create massive collective shifts. The City Health Index (CHI) in this game represents real-world community health—when we work together to manage waste, our environment thrives and weather extremes are mitigated.</div>
    `;
    panel.appendChild(content);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'CLOSE';
    closeBtn.style.display = 'block';
    closeBtn.style.margin = '30px auto 0 auto';
    closeBtn.style.padding = '12px 40px';
    closeBtn.style.background = 'linear-gradient(to bottom, #10b981, #059669)';
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
