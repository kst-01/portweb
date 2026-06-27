// small interactions: set year and mobile menu
document.addEventListener('DOMContentLoaded', () => {
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year'); 
  if (yearEl) yearEl.textContent = y;

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
      const r = cat.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      
      // Calculate tilt limits based on mouse position relative to card dimensions
      const rx = (-dy / r.height) * 8; 
      const ry = (dx / r.width) * 8;
      
      // Smooth 3D matrix warp on hover
      cat.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
      cat.style.zIndex = "10"; // Ensures the active column hovers clean over connecting flowchart lines
    });

    cat.addEventListener('mouseleave', () => {
      cat.style.transform = 'translateY(0) rotateX(0) rotateY(0) translateZ(0)';
      cat.style.zIndex = "auto";
    });
  });

  // copy email button
  const copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = 'kst15490@gmail.com';
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied';
        setTimeout(() => copyBtn.textContent = 'Copy', 1500);
      } catch (e) {
        // Fallback approach for legacy engines
        const inp = document.createElement('input'); 
        inp.value = email; 
        document.body.appendChild(inp); 
        inp.select(); 
        document.execCommand('copy'); 
        document.body.removeChild(inp);
        copyBtn.textContent = 'Copied'; 
        setTimeout(() => copyBtn.textContent = 'Copy', 1500);
      }
    });
  }

  // Hologram & pointer follower: create inner structure and mouse interactions
  const holo = document.getElementById('holo');
  if (holo) {
    // build star field inside holo if missing
    if (!holo.querySelector('.holo-inner')) {
      const inner = document.createElement('div'); inner.className = 'holo-inner'; holo.appendChild(inner);
      const count = 150; // number of stars
      for (let i = 0; i < count; i++) {
        const s = document.createElement('div'); s.className = 'star';
        // Distribute stars evenly across the expanded flat background area
        const cx = Math.random() * 100;
        const cy = Math.random() * 100;
        const size = Math.round((Math.random() * 2) + 1); // 1-3 px
        s.style.width = `${size}px`; s.style.height = `${size}px`;
        s.style.left = `${cx}%`;
        s.style.top = `${cy}%`;
        s.dataset.depth = (Math.random() * 0.8 + 0.2).toFixed(2); // depth parallax factor
        s.style.opacity = (Math.random() * 0.6 + 0.4).toFixed(2);
        inner.appendChild(s);
      }
    }

    // pointer follower element (created on first use)
    let pf = document.querySelector('.pointer-follower');
    if (!pf) { pf = document.createElement('div'); pf.className = 'pointer-follower'; document.body.appendChild(pf); }

    // movement handling: transform holo and parallax stars
    document.addEventListener('mousemove', (e) => {
      const rect = holo.getBoundingClientRect();
      const hx = rect.left + rect.width/2;
      const hy = rect.top + rect.height/2;
      const nx = (e.clientX - hx) / (rect.width/2); // -1..1
      const ny = (e.clientY - hy) / (rect.height/2);

      // parallax stars
      const stars = holo.querySelectorAll('.star');
      stars.forEach(s=>{
        const depth = parseFloat(s.dataset.depth);
        const tx = (-nx * 25 * depth).toFixed(2);
        const ty = (-ny * 20 * depth).toFixed(2);
        s.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      // pointer follower position
      pf.style.left = `${e.clientX}px`;
      pf.style.top = `${e.clientY}px`;
      pf.style.opacity = '1';
      pf.style.transform = 'translate(-50%,-50%) scale(1)';
    });

    document.addEventListener('mouseleave', ()=>{ if (pf) pf.style.opacity='0'; });
  }

  // Ensure canvas sizes up properly once the DOM layout positions finish parsing
  if (canvas) {
    resizeCanvas();
  }
});

// ==========================================================================
// PORTFOLIO ARCADE MINI-GAME CONTEXT
// ==========================================================================
const canvas = document.getElementById('arcade-canvas');
const ctx = canvas.getContext('2d');

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

// Game Loops Update & Render Execution
function updateGameFrame() {
  if (!canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Process Projectiles flying up
  projectiles.forEach((p, index) => {
    p.y -= p.speed;
    
    // Draw kinetic missile indicator glow lines
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f6ff';
    ctx.fillStyle = 'rgba(0, 246, 255, 0.85)';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.fillText(p.text, p.x, p.y);
    ctx.shadowBlur = 0; // reset

    // Fetch dynamic real-time target bounding boundaries
    const targets = document.querySelectorAll('.vhs, .lead, .target-node');
    targets.forEach(target => {
      if (target.classList.contains('shattered-node')) return;

      const rect = target.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      
      // Calculate boundaries relative to the canvas container
      const tLeft = rect.left - canvasRect.left;
      const tRight = rect.right - canvasRect.left;
      const tTop = rect.top - canvasRect.top;
      const tBottom = rect.bottom - canvasRect.top;

      // Check for horizontal and vertical coordinate overlap
      if (p.x > tLeft && p.x < tRight && p.y > tTop && p.y < tBottom) {
        // Impact confirmed!
        target.classList.add('shattered-node');
        triggerExplosion(p.x, p.y);
        
        // Play explosion audio tracking clip
        audioDestroy.currentTime = 0;
        audioDestroy.play().catch(e => console.log("Audio play blocked."));

        // Remove missile entity from tracking stack
        projectiles.splice(index, 1);
      }
    });

    // Clean up tracking out of boundary heights
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
      audioVictory.play().catch(e => console.log("Audio play blocked until user interacts."));
      hasPlayed = true; 
    }
    // Find this exact block inside your updateGameFrame() function where totalTargets matches shatteredTargets:
    ctx.save(); 
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff2bd6';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // ✨ ADDED: Forces the canvas layer overlay logic to render on top of all DOM layers
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

// Particle system array generator on hit impacts
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

// Intercept clicks on rotating items to load them into the projectile pipeline
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
    audioFling.play().catch(e => console.log("Audio play muted until user interacts with document."));
  }
});