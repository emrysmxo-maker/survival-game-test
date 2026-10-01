// Движок тестового полигона моделей (Полигон 3D)
// 4 реалистичные 3D-постройки для стиля выживания, чистая почва без лишней графики, честные тени солнца
(function () {
  'use strict';

  // 1. Профили качества
  const QUALITY_PROFILES = [
    { name: '⚡ УЛЬТРА (3.3x)', dpr: 3.3, shadows: true, shadowRes: 2048, pcfSoft: true, label: 'Ультра 3.3x' },
    { name: '⚡ ВЫСОКОЕ (2.0x)', dpr: 2.0, shadows: true, shadowRes: 1024, pcfSoft: true, label: 'Высокое 2.0x' },
    { name: '⚡ СРЕДНЕЕ (1.5x)', dpr: 1.5, shadows: true, shadowRes: 512, pcfSoft: false, label: 'Среднее 1.5x' },
    { name: '⚡ ЭКОНОМ (1.0x)', dpr: 1.0, shadows: false, shadowRes: 256, pcfSoft: false, label: 'Эконом 1.0x' }
  ];
  let curQualityIdx = 0;

  // 2. Инициализация Three.js
  const canvas = document.getElementById('canvas3d');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6ca6cd);
  scene.fog = new THREE.FogExp2(0x6ca6cd, 0.01);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Изометрическая камера
  const CAMERA_ANGLE = 45 * Math.PI / 180;
  const CAMERA_DIST = 18;
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 200);

  function updateCamera(tx, tz) {
    const cy = Math.sin(CAMERA_ANGLE) * CAMERA_DIST;
    const cz = Math.cos(CAMERA_ANGLE) * CAMERA_DIST;
    camera.position.set(tx, cy, tz + cz);
    camera.lookAt(tx, 0.9, tz);
  }

  function applyQuality(idx) {
    curQualityIdx = (idx + QUALITY_PROFILES.length) % QUALITY_PROFILES.length;
    const p = QUALITY_PROFILES[curQualityIdx];
    const devDpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(Math.min(devDpr, p.dpr));
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = p.shadows;
    renderer.shadowMap.type = p.pcfSoft ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;

    if (sunLight) {
      sunLight.castShadow = p.shadows;
      sunLight.shadow.mapSize.width = p.shadowRes;
      sunLight.shadow.mapSize.height = p.shadowRes;
      if (sunLight.shadow.map) sunLight.shadow.map.dispose();
    }

    const btn = document.getElementById('quality-btn');
    if (btn) btn.textContent = p.name;
    const tag = document.getElementById('quality-tag');
    if (tag) tag.textContent = p.label;
  }

  // 3. Солнце и чистые динамические тени
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3d382e, 0.65);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
  sunLight.castShadow = true;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -25;
  sunLight.shadow.camera.right = 25;
  sunLight.shadow.camera.top = 25;
  sunLight.shadow.camera.bottom = -25;
  sunLight.shadow.bias = -0.0006;
  scene.add(sunLight);

  let timeOfDay = 12.0;
  let autoSun = false;

  function updateSun(hours) {
    timeOfDay = hours;
    const sunProgress = (timeOfDay - 6) / 12;
    const sunAngle = sunProgress * Math.PI;

    const elev = Math.sin(sunAngle);
    const azim = Math.cos(sunAngle);

    const dist = 50;
    const sunY = Math.max(elev * dist, -8);
    const sunX = azim * dist;
    const sunZ = 22;

    const px = player ? player.x : 0;
    const pz = player ? player.z : 0;
    sunLight.position.set(px + sunX, Math.max(sunY, 8), pz + sunZ);
    sunLight.target.position.set(px, 0, pz);
    sunLight.target.updateMatrixWorld();

    if (timeOfDay >= 6.5 && timeOfDay <= 17.5) {
      // День
      sunLight.color.setHex(0xfffaee);
      sunLight.intensity = 1.35;
      hemiLight.intensity = 0.65;
      scene.background.setHex(0x6ca6cd);
      scene.fog.color.setHex(0x6ca6cd);
    } else if ((timeOfDay >= 5.0 && timeOfDay < 6.5) || (timeOfDay > 17.5 && timeOfDay <= 19.5)) {
      // Закат (очень длинные тени)
      sunLight.color.setHex(0xff8c42);
      sunLight.intensity = 1.25;
      hemiLight.intensity = 0.45;
      scene.background.setHex(0xd97757);
      scene.fog.color.setHex(0xd97757);
    } else {
      // Ночь
      sunLight.color.setHex(0x6b8ecc);
      sunLight.intensity = 0.35;
      hemiLight.intensity = 0.25;
      scene.background.setHex(0x0a111a);
      scene.fog.color.setHex(0x0a111a);
    }

    const timeTag = document.getElementById('time-tag');
    if (timeTag) {
      const h = Math.floor(timeOfDay);
      const m = Math.floor((timeOfDay % 1) * 60);
      timeTag.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  // 4. Чистая, спокойная почва полигона (без странных зеленых кругов)
  function createCleanGround() {
    const size = 100;
    const geo = new THREE.PlaneGeometry(size, size);
    geo.rotateX(-Math.PI / 2);

    const tc = document.createElement('canvas');
    tc.width = 512;
    tc.height = 512;
    const ctx = tc.getContext('2d');

    // Натуральный цвет сухой лесной почвы
    ctx.fillStyle = '#3a342a';
    ctx.fillRect(0, 0, 512, 512);

    // Легкая мягкая зернистость без пятен
    for (let i = 0; i < 3000; i++) {
      const v = (Math.random() - 0.5) * 14;
      ctx.fillStyle = `rgb(${58 + v}, ${52 + v}, ${42 + v})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    const groundTex = new THREE.CanvasTexture(tc);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(10, 10);

    const mat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.92,
      metalness: 0.05
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Разметка секторов
    const grid = new THREE.GridHelper(50, 10, 0x6e634e, 0x484032);
    grid.position.y = 0.02;
    scene.add(grid);
  }

  // Текстовая табличка над постройкой
  function makeLabel(text, x, y, z) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(16, 28, 18, 0.85)';
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const tex = new THREE.CanvasTexture(c);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(4.0, 1.0, 1.0);
    scene.add(sprite);
  }

  // 5. Создание и явное добавление 4 построек на сцену
  function createBuildings() {
    if (typeof window.Buildings === 'undefined') {
      console.error("Buildings module not loaded!");
      return;
    }

    // 1. Охотничья изба (сруб)
    const cabin = window.Buildings.createLogCabin(-8, -8);
    scene.add(cabin);
    makeLabel("🏕️ Сруб", -8, 4.6, -8);

    // 2. Военный блокпост с наблюдательной вышкой
    const post = window.Buildings.createMilitaryPost(8, -8);
    scene.add(post);
    makeLabel("🎖️ Блокпост", 8, 7.8, -8);

    // 3. Заброшенный дом с обрушенной крышей
    const ruin = window.Buildings.createRuinedHouse(-8, 8);
    scene.add(ruin);
    makeLabel("🏚️ Руины", -8, 4.2, 8);

    // 4. Укреплённый бункер выживших
    const bunker = window.Buildings.createBunker(8, 8);
    scene.add(bunker);
    makeLabel("🚪 Бункер", 8, 4.8, 8);

    console.log("All 4 buildings successfully added to scene!");
  }

  // 6. Игрок
  let player = null;

  function createPlayer() {
    const group = new THREE.Group();
    // Начинаем прямо перед Срубом!
    group.position.set(-8, 0, -3.5);

    const camoMat = new THREE.MeshStandardMaterial({ color: 0x3d4a36, roughness: 0.8 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x222a20, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc49e7a, roughness: 0.6 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1a, roughness: 0.9 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x181a18, roughness: 0.4, metalness: 0.8 });

    // Ноги
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.8, 8), camoMat);
    legL.position.set(-0.16, 0.45, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.8, 8), camoMat);
    legR.position.set(0.16, 0.45, 0);
    legR.castShadow = true;
    group.add(legR);

    // Берцы
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.28), bootMat);
    bootL.position.set(-0.16, 0.08, 0.05);
    bootL.castShadow = true;
    group.add(bootL);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.28), bootMat);
    bootR.position.set(0.16, 0.08, 0.05);
    bootR.castShadow = true;
    group.add(bootR);

    // Торс и разгрузка
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.26), camoMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.3), vestMat);
    vest.position.set(0, 1.2, 0);
    vest.castShadow = true;
    group.add(vest);

    // Голова и шлем
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    group.add(head);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), vestMat);
    helmet.position.y = 1.66;
    helmet.castShadow = true;
    group.add(helmet);

    // Руки
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8), camoMat);
    armL.position.set(-0.28, 1.25, 0.15);
    armL.rotation.x = Math.PI / 3;
    group.add(armL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8), camoMat);
    armR.position.set(0.28, 1.25, 0.15);
    armR.rotation.x = Math.PI / 3;
    group.add(armR);

    // Автомат
    const rifle = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.45), gunMat);
    rifle.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.35, 8), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.38);
    rifle.add(barrel);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.1), gunMat);
    mag.position.set(0, -0.12, 0.1);
    mag.rotation.x = -0.2;
    rifle.add(mag);

    rifle.position.set(0.12, 1.15, 0.42);
    rifle.castShadow = true;
    group.add(rifle);

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0, 0.56);
    rifle.add(muzzle);

    scene.add(group);

    return {
      group,
      muzzle,
      legL,
      legR,
      x: -8,
      z: -3.5,
      speed: 6.8,
      angle: -Math.PI / 2,
      aimAngle: -Math.PI / 2,
      walkCycle: 0
    };
  }

  // 7. Стрельба
  const bullets = [];
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffea55 });
  const bulletGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6);
  bulletGeo.rotateX(Math.PI / 2);

  let isFiring = false;
  let autoFire = false;
  let fireCooldown = 0;

  function shoot() {
    if (!player) return;
    fireCooldown = 0.11;

    const mPos = new THREE.Vector3();
    player.muzzle.getWorldPosition(mPos);

    const a = player.aimAngle;
    const spread = (Math.random() - 0.5) * 0.03;
    const dir = new THREE.Vector3(Math.sin(a + spread), 0, Math.cos(a + spread)).normalize();

    const mesh = new THREE.Mesh(bulletGeo, bulletMat);
    mesh.position.copy(mPos);
    mesh.rotation.y = a + spread;
    scene.add(mesh);

    bullets.push({ mesh, dir, life: 1.0, speed: 75 });

    const flash = new THREE.PointLight(0xff9922, 3.0, 4.0);
    flash.position.copy(mPos);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 35);
  }

  // 8. Зомби (~1.82м)
  const zombies = [];

  function spawnZombie() {
    if (!player) return;
    const a = Math.random() * Math.PI * 2;
    const dist = 14 + Math.random() * 6;
    const zx = player.x + Math.sin(a) * dist;
    const zz = player.z + Math.cos(a) * dist;

    const group = new THREE.Group();
    group.position.set(zx, 0, zz);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x556e52, roughness: 0.85 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: 0x36302a, roughness: 0.9 });

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 8), clothesMat);
    legL.position.set(-0.15, 0.45, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 8), clothesMat);
    legR.position.set(0.15, 0.45, 0);
    legR.castShadow = true;
    group.add(legR);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.24), clothesMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), skinMat);
    head.position.set(0, 1.6, 0.06);
    head.castShadow = true;
    group.add(head);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6, 8), skinMat);
    armL.position.set(-0.26, 1.25, 0.28);
    armL.rotation.x = Math.PI / 2.2;
    armL.castShadow = true;
    group.add(armL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6, 8), skinMat);
    armR.position.set(0.26, 1.25, 0.28);
    armR.rotation.x = Math.PI / 2.1;
    armR.castShadow = true;
    group.add(armR);

    scene.add(group);

    zombies.push({
      group,
      legL,
      legR,
      x: zx,
      z: zz,
      hp: 120,
      dead: false,
      speed: 2.8,
      walkCycle: 0
    });
  }

  // 9. Сенсорное управление
  const joystick = { active: false, touchId: null, startX: 0, startY: 0, dx: 0, dy: 0, maxDist: 48 };
  const fireJoy = { active: false, touchId: null, startX: 0, startY: 0 };

  const walkStickEl = document.getElementById('walk-stick');
  const walkKnobEl = document.getElementById('walk-knob');
  const fireBtnEl = document.getElementById('fire-btn');
  const fireKnobEl = document.getElementById('fire-knob');

  function isUI(t) {
    return t && t.closest && !!(
      t.closest('#top-bar') ||
      t.closest('#teleport-bar') ||
      t.closest('#zombie-btn') ||
      t.closest('#auto-btn') ||
      t.closest('#rot-btn')
    );
  }

  window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (isUI(t.target)) continue;

      if (t.clientX < window.innerWidth * 0.5) {
        if (!joystick.active) {
          joystick.active = true;
          joystick.touchId = t.identifier;
          joystick.startX = t.clientX;
          joystick.startY = t.clientY;
          joystick.dx = 0;
          joystick.dy = 0;
          if (walkStickEl) {
            walkStickEl.style.left = t.clientX + 'px';
            walkStickEl.style.top = t.clientY + 'px';
            walkStickEl.classList.add('active');
          }
          if (walkKnobEl) walkKnobEl.style.transform = '';
        }
      } else {
        if (!fireJoy.active) {
          fireJoy.active = true;
          fireJoy.touchId = t.identifier;
          fireJoy.startX = t.clientX;
          fireJoy.startY = t.clientY;
          isFiring = true;
          if (fireBtnEl) {
            fireBtnEl.style.left = t.clientX + 'px';
            fireBtnEl.style.top = t.clientY + 'px';
            fireBtnEl.classList.add('active');
          }
          if (fireKnobEl) fireKnobEl.style.transform = '';
        }
      }
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (joystick.active && t.identifier === joystick.touchId) {
        const diffX = t.clientX - joystick.startX;
        const diffY = t.clientY - joystick.startY;
        const dist = Math.hypot(diffX, diffY);
        const a = Math.atan2(diffY, diffX);
        const cl = Math.min(dist, joystick.maxDist);
        if (dist > 8) {
          const factor = (cl - 8) / (joystick.maxDist - 8);
          joystick.dx = Math.cos(a) * factor;
          joystick.dy = Math.sin(a) * factor;
        } else {
          joystick.dx = 0; joystick.dy = 0;
        }
        if (walkKnobEl) walkKnobEl.style.transform = `translate(${Math.cos(a)*cl}px, ${Math.sin(a)*cl}px)`;
      } else if (fireJoy.active && t.identifier === fireJoy.touchId) {
        const diffX = t.clientX - fireJoy.startX;
        const diffY = t.clientY - fireJoy.startY;
        const dist = Math.hypot(diffX, diffY);
        isFiring = true;
        if (dist > 6 && player) {
          player.aimAngle = Math.atan2(diffX, diffY);
        }
        if (fireKnobEl) {
          const k = Math.min(dist, 40) / (dist || 1);
          fireKnobEl.style.transform = `translate(${diffX*k}px, ${diffY*k}px)`;
        }
      }
    }
  }, { passive: false });

  function endTouch(id) {
    if (joystick.active && joystick.touchId === id) {
      joystick.active = false; joystick.touchId = null; joystick.dx = 0; joystick.dy = 0;
      if (walkStickEl) walkStickEl.classList.remove('active');
    }
    if (fireJoy.active && fireJoy.touchId === id) {
      fireJoy.active = false; fireJoy.touchId = null; isFiring = autoFire;
      if (fireBtnEl) fireBtnEl.classList.remove('active');
    }
  }
  window.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) endTouch(e.changedTouches[i].identifier);
  });
  window.addEventListener('touchcancel', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) endTouch(e.changedTouches[i].identifier);
  });

  // Управление с ПК
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyQ') applyQuality(curQualityIdx + 1);
    if (e.code === 'KeyZ') spawnZombie();
    if (e.code === 'Digit1') teleportTo(-8, -8);
    if (e.code === 'Digit2') teleportTo(8, -8);
    if (e.code === 'Digit3') teleportTo(-8, 8);
    if (e.code === 'Digit4') teleportTo(8, 8);
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('mousedown', (e) => { if (!isUI(e.target)) isFiring = true; });
  window.addEventListener('mouseup', () => { isFiring = autoFire; });
  window.addEventListener('mousemove', (e) => {
    if (!player) return;
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    player.aimAngle = Math.atan2(e.clientX - cx, e.clientY - cy);
  });

  // Телепортация
  function teleportTo(x, z) {
    if (!player) return;
    player.x = x;
    player.z = z + 4.8; // встать точно перед входом
    player.group.position.set(player.x, 0, player.z);
    player.aimAngle = -Math.PI / 2;
    player.group.rotation.y = -Math.PI / 2;
    updateCamera(player.x, player.z);
  }

  // 10. Игровой цикл
  let lastTime = performance.now();
  let frames = 0, fpsTimer = 0;

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    frames++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      const fps = Math.round(frames / fpsTimer);
      const el = document.getElementById('info-fps');
      if (el) el.textContent = `${fps} FPS`;
      frames = 0; fpsTimer = 0;
    }

    if (autoSun) {
      timeOfDay = (timeOfDay + (dt / 900) * 24) % 24;
      updateSun(timeOfDay);
    }

    if (player) {
      let mx = joystick.active ? joystick.dx : 0;
      let mz = joystick.active ? joystick.dy : 0;
      if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

      const len = Math.hypot(mx, mz);
      const moving = len > 0.05;

      if (moving) {
        const nx = mx / (len > 1 ? len : 1);
        const nz = mz / (len > 1 ? len : 1);
        const newX = player.x + nx * player.speed * dt;
        const newZ = player.z + nz * player.speed * dt;

        if (window.Buildings && !window.Buildings.checkCollision(newX, player.z, 0.45)) player.x = newX;
        if (window.Buildings && !window.Buildings.checkCollision(player.x, newZ, 0.45)) player.z = newZ;

        player.angle = Math.atan2(nx, nz);
        player.walkCycle += dt * 14;
      }

      const legSwing = moving ? Math.sin(player.walkCycle) * 0.45 : 0;
      player.legL.rotation.x = legSwing;
      player.legR.rotation.x = -legSwing;

      const targetA = (isFiring || fireJoy.active) ? player.aimAngle : player.angle;
      player.group.rotation.y = targetA;
      player.group.position.set(player.x, 0, player.z);

      updateCamera(player.x, player.z);

      if (fireCooldown > 0) fireCooldown -= dt;
      if ((isFiring || autoFire) && fireCooldown <= 0) shoot();

      const cEl = document.getElementById('info-coords');
      if (cEl) cEl.textContent = `X: ${player.x.toFixed(1)}, Z: ${player.z.toFixed(1)}`;
    }

    // Пули
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.mesh.position.addScaledVector(b.dir, b.speed * dt);
      b.life -= dt;

      let hit = false;
      for (const z of zombies) {
        if (!z.dead && Math.hypot(b.mesh.position.x - z.x, b.mesh.position.z - z.z) < 0.65) {
          z.hp -= 35;
          hit = true;
          if (z.hp <= 0) {
            z.dead = true;
            z.group.rotation.x = -Math.PI / 2;
            z.group.position.y = 0.15;
          }
          break;
        }
      }

      if (!hit && window.Buildings && window.Buildings.checkCollision(b.mesh.position.x, b.mesh.position.z, 0.15)) hit = true;

      if (hit || b.life <= 0) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }

    // Зомби
    for (const z of zombies) {
      if (z.dead || !player) continue;
      const dx = player.x - z.x, dz = player.z - z.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.8) {
        const nx = dx / dist, nz = dz / dist;
        const nzx = z.x + nx * z.speed * dt;
        const nzz = z.z + nz * z.speed * dt;
        if (window.Buildings && !window.Buildings.checkCollision(nzx, z.z, 0.4)) z.x = nzx;
        if (window.Buildings && !window.Buildings.checkCollision(z.x, nzz, 0.4)) z.z = nzz;
        z.group.rotation.y = Math.atan2(nx, nz);
        z.group.position.set(z.x, 0, z.z);
        z.walkCycle += dt * 6.0;
        z.legL.rotation.x = Math.sin(z.walkCycle) * 0.35;
        z.legR.rotation.x = -Math.sin(z.walkCycle) * 0.35;
      }
    }

    renderer.render(scene, camera);
  }

  // 11. Запуск мира
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const p = QUALITY_PROFILES[curQualityIdx];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, p.dpr));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  createCleanGround();
  createBuildings();
  player = createPlayer();
  updateCamera(player.x, player.z);

  // Кнопки интерфейса
  document.getElementById('quality-btn')?.addEventListener('click', () => applyQuality(curQualityIdx + 1));
  document.getElementById('zombie-btn')?.addEventListener('click', spawnZombie);
  document.getElementById('auto-btn')?.addEventListener('click', () => {
    autoFire = !autoFire;
    isFiring = autoFire;
    document.getElementById('auto-btn').classList.toggle('active', autoFire);
  });

  document.querySelectorAll('.time-btn').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach((o) => o.classList.remove('active'));
      b.classList.add('active');
      const tv = b.dataset.time;
      if (tv === 'auto') { autoSun = true; }
      else { autoSun = false; updateSun(parseFloat(tv)); }
    });
  });

  document.getElementById('tp-cabin')?.addEventListener('click', () => teleportTo(-8, -8));
  document.getElementById('tp-post')?.addEventListener('click', () => teleportTo(8, -8));
  document.getElementById('tp-ruin')?.addEventListener('click', () => teleportTo(-8, 8));
  document.getElementById('tp-bunker')?.addEventListener('click', () => teleportTo(8, 8));

  applyQuality(0);
  updateSun(12.0);

  requestAnimationFrame(animate);
})();
