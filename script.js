// Global Scope Canvas Game Declarations (Moved to top to prevent initialization reference crashes)
const canvas = document.getElementById('arcade-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Audio Asset Hooks
const audioFling = new Audio('fling.mp3');
const audioDestroy = new Audio('destroy.mp3');
const audioVictory = new Audio('victory.mp3');

audioFling.preload = 'auto';
audioDestroy.preload = 'auto';
audioVictory.preload = 'auto';

let projectiles = [];
let particles = [];
let gameOver = false; 
let hasPlayed = false; 

// Handle canvas resizing automatically based on current relative viewport parent
function resizeCanvas() {
  if (!canvas) return;
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

// Small interactions: set year and mobile menu
document.addEventListener('DOMContentLoaded', () => {
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year'); 
  if (yearEl) yearEl.textContent = y;

  // MINIMALIST / RGB COLOR STYLE THEME TOGGLE SWITCH ENGINE
  // Locate this block inside the DOMContentLoaded handler in script.js and update it:
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('minimal-mode');
      
      // Smoothly hide and dismantle the helper bubble once a click has occurred
      const hintBubble = themeToggle.querySelector('.click-hint-bubble');
      if (hintBubble) {
        hintBubble.style.opacity = '0';
        hintBubble.style.pointerEvents = 'none';
      }
    });
  }

  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.nav nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const isShown = getComputedStyle(nav).display !== 'none';
      nav.style.display = isShown ? 'none' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.gap = '10px';
    });
  }

  // REFACTORED: 3D tilt applied directly to your Flowchart Category Cards
  const categories = document.querySelectorAll('.category');
  categories.forEach(cat => {
    cat.addEventListener('mousemove', e => {
      if(document.body.classList.contains('minimal-mode')) {
        cat.style.transform = 'none';
        return;
      }
      const r = cat.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const rx = (-dy / r.height) * 8; 
      const ry = (dx / r.width) * 8;
      
      cat.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
      cat.style.zIndex = "10"; 
    });

    cat.addEventListener('mouseleave', () => {
      cat.style.transform = 'translateY(0) rotateX(0) rotateY(0) translateZ(0)';
      cat.style.zIndex = "auto";
    });
  });

  // Hologram & pointer follower: create inner structure and mouse interactions
  const holo = document.getElementById('holo');
  if (holo) {
    if (!holo.querySelector('.holo-inner')) {
      const inner = document.createElement('div'); inner.className = 'holo-inner'; holo.appendChild(inner);
      const count = 1000; 
      for (let i = 0; i < count; i++) {
        const s = document.createElement('div'); s.className = 'star';
        const cx = Math.random() * 100;
        const cy = Math.random() * 100;
        const size = Math.round((Math.random() * 2) + 1); 
        s.style.width = `${size}px`; s.style.height = `${size}px`;
        s.style.left = `${cx}%`;
        s.style.top = `${cy}%`;
        s.dataset.depth = (Math.random() * 0.8 + 0.2).toFixed(2); 
        s.style.opacity = (Math.random() * 0.6 + 0.4).toFixed(2);
        inner.appendChild(s);
      }
    }

    let pf = document.querySelector('.pointer-follower');
    if (!pf) { pf = document.createElement('div'); pf.className = 'pointer-follower'; document.body.appendChild(pf); }

    document.addEventListener('mousemove', (e) => {
      const rect = holo.getBoundingClientRect();
      const hx = rect.left + rect.width/2;
      const hy = rect.top + rect.height/2;
      const nx = (e.clientX - hx) / (rect.width/2); 
      const ny = (e.clientY - hy) / (rect.height/2);

      const stars = holo.querySelectorAll('.star');
      stars.forEach(s=>{
        const depth = parseFloat(s.dataset.depth);
        const tx = (-nx * 25 * depth).toFixed(2);
        const ty = (-ny * 20 * depth).toFixed(2);
        s.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      pf.style.left = `${e.clientX}px`;
      pf.style.top = `${e.clientY}px`;
      pf.style.opacity = document.body.classList.contains('minimal-mode') ? '0' : '1';
    });
  }

  if (canvas) {
    resizeCanvas();
  }
});

// Game Loops Update & Render Execution
function updateGameFrame() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Process Projectiles flying up
  projectiles.forEach((p, index) => {
    p.y -= p.speed;
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f6ff';
    ctx.fillStyle = 'rgba(0, 246, 255, 0.85)';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.fillText(p.text, p.x, p.y);
    ctx.shadowBlur = 0; 

    const targets = document.querySelectorAll('.vhs, .lead, .target-node');
    targets.forEach(target => {
      if (target.classList.contains('shattered-node')) return;

      const rect = target.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      
      const tLeft = rect.left - canvasRect.left;
      const tRight = rect.right - canvasRect.left;
      const tTop = rect.top - canvasRect.top;
      const tBottom = rect.bottom - canvasRect.top;

      if (p.x > tLeft && p.x < tRight && p.y > tTop && p.y < tBottom) {
        target.classList.add('shattered-node');
        triggerExplosion(p.x, p.y);
        
        audioDestroy.currentTime = 0;
        audioDestroy.play().catch(e => console.log("Audio layout block."));
        projectiles.splice(index, 1);
      }
    });

    if (p.y < 0) projectiles.splice(index, 1);
  });

  // 2. Process Shrapnel Debris Physics
  particles.forEach((part, index) => {
    part.x += part.vx;
    part.y += part.vy;
    part.vy += 0.2; 
    part.alpha -= 0.015;

    ctx.fillStyle = `rgba(${part.color}, ${part.alpha})`;
    ctx.fillRect(part.x, part.y, part.size, part.size);

    if (part.alpha <= 0) particles.splice(index, 1);
  });

  // 3. SAFE WIN STATE EVALUATION
  const totalTargets = document.querySelectorAll('.vhs, .lead, .target-node');
  const shatteredTargets = document.querySelectorAll('.shattered-node');

  if (totalTargets.length > 0 && shatteredTargets.length === totalTargets.length) {
    gameOver = true;
    projectiles = []; 
    
    if (!hasPlayed) {
      audioVictory.currentTime = 0;
      audioVictory.play().catch(e => console.log("Audio play blocked."));
      hasPlayed = true; 
    }

    ctx.save(); 
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff2bd6';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    ctx.globalCompositeOperation = 'source-over'; 
    
    ctx.font = 'bold 36px Orbitron, sans-serif';
    ctx.fillText('YOU WON!', canvas.width / 2, canvas.height / 3);
    
    ctx.shadowColor = '#00f6ff';
    ctx.font = '600 15px Orbitron, sans-serif';
    ctx.fillStyle = '#9aa0b4';
    ctx.fillText('Please restart the page', canvas.width / 2, (canvas.height / 3) + 45);
    ctx.restore(); 
  }

  requestAnimationFrame(updateGameFrame);
}

// Start frame engine loop
requestAnimationFrame(updateGameFrame);

function triggerExplosion(x, y) {
  const particleColors = ['255, 43, 214', '0, 246, 255', '255, 255, 255'];
  for (let i = 0; i < 35; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      size: Math.random() * 4 + 2,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      alpha: 1
    });
  }
}

document.addEventListener('click', (e) => {
  if (gameOver) return; 

  if (e.target.classList.contains('ammo')) {
    const rect = e.target.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const spawnX = rect.left - canvasRect.left + (rect.width / 2);
    const spawnY = rect.top - canvasRect.top;

    projectiles.push({
      x: spawnX,
      y: spawnY,
      text: e.target.textContent,
      speed: 12 
    });

    audioFling.currentTime = 0;
    audioFling.play().catch(e => console.log("Audio play blocked."));
  }
});