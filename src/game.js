// Основной игровой движок тестового полигона Survival Game Test
// Чистая 3D-графика, динамические тени солнца, переключатель качества, 4 реалистичных постройки, зомби правильного роста

(function () {
  'use strict';

  // ==========================================
  // 1. ПРОФИЛИ КАЧЕСТВА (Quality Profiles)
  // ==========================================
  const QUALITY_PROFILES = [
    { name: '⚡ УЛЬТРА (3.3x)', dpr: 3.3, shadows: true, shadowRes: 2048, pcfSoft: true, label: 'Ультра (3.3x)' },
    { name: '⚡ ВЫСОКОЕ (2.0x)', dpr: 2.0, shadows: true, shadowRes: 1024, pcfSoft: true, label: 'Высокое (2.0x)' },
    { name: '⚡ СРЕДНЕЕ (1.5x)', dpr: 1.5, shadows: true, shadowRes: 512, pcfSoft: false, label: 'Среднее (1.5x)' },
    { name: '⚡ ЭКОНОМ (1.0x)', dpr: 1.0, shadows: false, shadowRes: 256, pcfSoft: false, label: 'Эконом (1.0x)' }
  ];
  let curQualityIdx = 0;

  // ==========================================
  // 2. ИНИЦИАЛИЗАЦИЯ THREE.JS СЦЕНЫ
  // ==========================================
  const canvas = document.getElementById('canvas3d');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Камера: изометрический ракурс 47° сверху
  const CAMERA_ANGLE = 47 * Math.PI / 180;
  const CAMERA_DIST = 22;
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.5, 200);

  function updateCameraPosition(targetX, targetZ) {
    const camY = Math.sin(CAMERA_ANGLE) * CAMERA_DIST;
    const camZ = Math.cos(CAMERA_ANGLE) * CAMERA_DIST;
    camera.position.set(targetX, camY, targetZ + camZ);
    camera.lookAt(targetX, 1.0, targetZ);
  }

  // Применение настроек качества
  function applyQuality(idx) {
    curQualityIdx = (idx + QUALITY_PROFILES.length) % QUALITY_PROFILES.length;
    const p = QUALITY_PROFILES[curQualityIdx];

    const maxDevDpr = window.devicePixelRatio || 1;
    const targetDpr = Math.min(maxDevDpr, p.dpr);
    renderer.setPixelRatio(targetDpr);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = p.shadows;
    renderer.shadowMap.type = p.pcfSoft ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;

    if (sunLight) {
      sunLight.castShadow = p.shadows;
      sunLight.shadow.mapSize.width = p.shadowRes;
      sunLight.shadow.mapSize.height = p.shadowRes;
      if (sunLight.shadow.map) sunLight.shadow.map.dispose();
    }

    scene.traverse((obj) => {
      if (obj.material) obj.material.needsUpdate = true;
    });

    const btn = document.getElementById('quality-btn');
    if (btn) btn.textContent = p.name;
    const tag = document.getElementById('quality-tag');
    if (tag) tag.textContent = p.label;
  }

  // ==========================================
  // 3. ОСВЕЩЕНИЕ И ДИНАМИЧЕСКИЕ ТЕНИ СОЛНЦА
  // ==========================================
  // Никаких статичных чёрных пятен! Тени зависят только от положения солнца на небе!
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3d4a36, 0.6);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
  sunLight.castShadow = true;
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 140;
  sunLight.shadow.camera.left = -38;
  sunLight.shadow.camera.right = 38;
  sunLight.shadow.camera.top = 38;
  sunLight.shadow.camera.bottom = -38;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  let timeOfDay = 12.0; // Часы: 0..24
  let autoSun = true;

  function updateSun(hours) {
    timeOfDay = hours;
    // Угол солнца по кругу 360° (полдень = 12:00, солнце сверху на юге)
    const sunProgress = (timeOfDay - 6) / 12; // 0 в 6:00, 0.5 в 12:00, 1.0 в 18:00
    const sunAngle = sunProgress * Math.PI;

    const isDay = timeOfDay >= 5.5 && timeOfDay <= 19.5;
    const elev = Math.sin(sunAngle); // высота солнца над горизонтом
    const azim = Math.cos(sunAngle); // направление восток-запад

    const dist = 60;
    const sunY = Math.max(elev * dist, -15);
    const sunX = azim * dist;
    const sunZ = 25; // солнце светит с юга под углом

    // Позиционируем источник света относительно игрока
    const px = player ? player.x : 0;
    const pz = player ? player.z : 0;
    sunLight.position.set(px + sunX, Math.max(sunY, 8), pz + sunZ);
    sunLight.target.position.set(px, 0, pz);
    sunLight.target.updateMatrixWorld();

    // Цвета неба, тумана и интенсивность света
    if (timeOfDay >= 6.5 && timeOfDay <= 17.5) {
      // ДЕНЬ: Яркое солнце, ясное небо, короткие четкие тени
      sunLight.color.setHex(0xfffaee);
      sunLight.intensity = 1.35;
      hemiLight.color.setHex(0xebf4ff);
      hemiLight.groundColor.setHex(0x35402c);
      hemiLight.intensity = 0.65;
      scene.background.setHex(0x76b6e4);
      scene.fog.color.setHex(0x76b6e4);
    } else if ((timeOfDay >= 5.0 && timeOfDay < 6.5) || (timeOfDay > 17.5 && timeOfDay <= 19.5)) {
      // ЗАКАТ / РАССВЕТ: Золотисто-красный свет, очень длинные драматичные тени
      sunLight.color.setHex(0xff8c42);
      sunLight.intensity = 1.2;
      hemiLight.color.setHex(0xffaa77);
      hemiLight.groundColor.setHex(0x221a14);
      hemiLight.intensity = 0.45;
      scene.background.setHex(0xcc6644);
      scene.fog.color.setHex(0xcc6644);
    } else {
      // НОЧЬ: Холодный лунный свет, глубокое синее ночное небо
      sunLight.color.setHex(0x7899cc);
      sunLight.intensity = 0.35;
      hemiLight.color.setHex(0x1a2638);
      hemiLight.groundColor.setHex(0x0a1015);
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

  // ==========================================
  // 4. ТЕРРЕЙН (Реалистичная земля Poly Haven)
  // ==========================================
  function createTerrain() {
    const size = 160;
    const segments = 80;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    // Плавный рельеф с пологими холмами и полянкой в центре
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.hypot(x, z);

      // В центре (зона осмотра построек r < 28) площадка ровная
      let y = 0;
      if (distFromCenter > 22) {
        const factor = Math.min((distFromCenter - 22) / 30, 1.0);
        y = (Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.8 + Math.sin(x * 0.03 + z * 0.02) * 2.2) * factor;
      }
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    // Создаём реалистичную бесшовную текстуру лесной почвы
    const tc = document.createElement('canvas');
    tc.width = 1024;
    tc.height = 1024;
    const ctx = tc.getContext('2d');

    // Базовый цвет хвои и земли
    ctx.fillStyle = '#3a2d21';
    ctx.fillRect(0, 0, 1024, 1024);

    // Пятна мха и лесной травы
    const mossColors = ['#44522f', '#364025', '#4d5930', '#2d381e'];
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = mossColors[i % mossColors.length];
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * 1024, Math.random() * 1024,
        15 + Math.random() * 45, 12 + Math.random() * 35,
        Math.random() * Math.PI, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Хвойные иголки и мелкие сучки
    ctx.strokeStyle = '#5a3d28';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const a = Math.random() * Math.PI * 2;
      const l = 4 + Math.random() * 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }

    // Мелкие камушки
    ctx.fillStyle = '#7a766f';
    for (let i = 0; i < 500; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 1024, Math.random() * 1024, 1.5 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const groundTex = new THREE.CanvasTexture(tc);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(16, 16);

    const mat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.92,
      metalness: 0.05
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    scene.add(terrain);
    return terrain;
  }

  // ==========================================
  // 5. ДЕРЕВЬЯ И КАМНИ ПО ПЕРИМЕТРУ
  // ==========================================
  function createNature() {
    const woodTex = Textures.createLogBark();
    const trunkMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x243b22, roughness: 0.75 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6e6e66, roughness: 0.9 });

    // Окружаем площадку соснами (на расстоянии r > 28м от центра)
    const numTrees = 70;
    for (let i = 0; i < numTrees; i++) {
      const a = (i / numTrees) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const r = 30 + Math.random() * 45;
      const tx = Math.cos(a) * r;
      const tz = Math.sin(a) * r;

      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      // Ствол сосны (высота 7м)
      const trunkH = 4.5 + Math.random() * 2.5;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, trunkH, 8), trunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // Хвойные ярусы кроны (пирамида)
      const tiers = 4;
      for (let t = 0; t < tiers; t++) {
        const ty = trunkH * 0.55 + t * 1.3;
        const tr = 2.4 - t * 0.45;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(tr, 2.0, 7), pineMat);
        cone.position.y = ty;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      }
      scene.add(tree);
    }

    // Крупные лесные валуны
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 18 + Math.random() * 40;
      const rx = Math.cos(a) * r;
      const rz = Math.sin(a) * r;

      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8 + Math.random() * 1.4, 1),
        rockMat
      );
      rock.position.set(rx, 0.4 + Math.random() * 0.4, rz);
      rock.scale.set(1.0 + Math.random() * 0.5, 0.7 + Math.random() * 0.4, 1.0 + Math.random() * 0.5);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }
  }

  // ==========================================
  // 6. ИГРОК (Боец в камуфляже с автоматом)
  // ==========================================
  let player = null;

  function createSoldier() {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    const camoTex = Textures.createCamoTarp();
    const camoMat = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.75 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x2d3a28, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc49e7a, roughness: 0.6 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1a, roughness: 0.9 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x222524, roughness: 0.4, metalness: 0.8 });

    // Тело (рост 1.8м)
    // Ноги
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.8, 8), camoMat);
    legL.position.set(-0.16, 0.45, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.8, 8), camoMat);
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

    // Торс и бронежилет
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.26), camoMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.3), vestMat);
    vest.position.set(0, 1.2, 0);
    vest.castShadow = true;
    group.add(vest);

    // Голова и тактический шлем
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    group.add(head);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), vestMat);
    helmet.position.y = 1.66;
    helmet.castShadow = true;
    group.add(helmet);

    // Руки с автоматом
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8), camoMat);
    armL.position.set(-0.28, 1.25, 0.15);
    armL.rotation.x = Math.PI / 3;
    group.add(armL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8), camoMat);
    armR.position.set(0.28, 1.25, 0.15);
    armR.rotation.x = Math.PI / 3;
    group.add(armR);

    // 3D-Автомат в руках
    const rifle = new THREE.Group();
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.45), gunMat);
    rifle.add(receiver);
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

    // Точка вылета пули (дуло)
    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0, 0.56);
    rifle.add(muzzle);

    scene.add(group);

    return {
      group,
      rifle,
      muzzle,
      legL,
      legR,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      angle: 0,
      aimAngle: 0,
      speed: 7.2, // м/с
      walkCycle: 0
    };
  }

  // ==========================================
  // 7. СИСТЕМА ОРУЖИЯ И ВЫСТРЕЛОВ
  // ==========================================
  const bullets = [];
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffea77 });
  const bulletGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6);
  bulletGeo.rotateX(Math.PI / 2);

  let isFiring = false;
  let autoFire = false;
  let fireCooldown = 0;
  const FIRE_RATE = 0.11; // ~550 выстр/мин

  function shoot() {
    if (!player) return;
    fireCooldown = FIRE_RATE;

    // Мировая позиция дула автомата
    const muzzlePos = new THREE.Vector3();
    player.muzzle.getWorldPosition(muzzlePos);

    // Направление выстрела по направлению прицела
    const a = player.aimAngle;
    const spread = (Math.random() - 0.5) * 0.04;
    const dir = new THREE.Vector3(Math.sin(a + spread), 0, Math.cos(a + spread)).normalize();

    const mesh = new THREE.Mesh(bulletGeo, bulletMat);
    mesh.position.copy(muzzlePos);
    mesh.rotation.y = a + spread;
    scene.add(mesh);

    bullets.push({
      mesh,
      dir,
      life: 1.2,
      speed: 80.0
    });

    // Дульная вспышка
    const flash = new THREE.PointLight(0xffaa33, 3.5, 5.0);
    flash.position.copy(muzzlePos);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 40);
  }

  // ==========================================
  // 8. СИСТЕМА ЗОМБИ (Правильный масштаб!)
  // ==========================================
  const zombies = [];

  function spawnZombie() {
    if (!player) return;

    // Спавним на границе поляны (18-24м от игрока)
    const angle = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * 8;
    const zx = player.x + Math.sin(angle) * dist;
    const zz = player.z + Math.cos(angle) * dist;

    const group = new THREE.Group();
    group.position.set(zx, 0, zz);

    // Человеческий рост ~1.82м
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x5a7554, roughness: 0.85 }); // бледно-зеленая гнилая кожа
    const ragsMat = new THREE.MeshStandardMaterial({ color: 0x3d352e, roughness: 0.95 }); // рваная одежда

    // Ноги
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 8), ragsMat);
    legL.position.set(-0.15, 0.45, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 8), ragsMat);
    legR.position.set(0.15, 0.45, 0);
    legR.castShadow = true;
    group.add(legR);

    // Торс
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.24), ragsMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    // Голова
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), skinMat);
    head.position.set(0, 1.6, 0.06);
    head.rotation.x = 0.25; // голова наклонена вперед
    head.castShadow = true;
    group.add(head);

    // Руки вытянуты вперед (классическая походка зомби)
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
      maxHp: 120,
      dead: false,
      speed: 2.4 + Math.random() * 1.2,
      walkCycle: Math.random() * Math.PI * 2
    });
  }

  // ==========================================
  // 9. СЕНСОРНОЕ УПРАВЛЕНИЕ (RedMagic 10 Pro)
  // ==========================================
  const joystick = {
    active: false,
    touchId: null,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
    maxDist: 48
  };

  const fireJoy = {
    active: false,
    touchId: null,
    startX: 0,
    startY: 0
  };

  const walkStickEl = document.getElementById('walk-stick');
  const walkKnobEl = document.getElementById('walk-knob');
  const fireBtnEl = document.getElementById('fire-btn');
  const fireKnobEl = document.getElementById('fire-knob');

  function isUI(target) {
    if (!target || !target.closest) return false;
    return !!(
      target.closest('#top-bar') ||
      target.closest('#teleport-bar') ||
      target.closest('#zombie-btn') ||
      target.closest('#auto-btn') ||
      target.closest('#rot-btn')
    );
  }

  window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (isUI(t.target)) continue;

      // Левая половина экрана — Ходьба
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
        continue;
      }

      // Правая половина экрана — Плавающий огонь и прицел
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
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];

      // Левый стик (ходьба)
      if (joystick.active && t.identifier === joystick.touchId) {
        const diffX = t.clientX - joystick.startX;
        const diffY = t.clientY - joystick.startY;
        const dist = Math.hypot(diffX, diffY);
        const angle = Math.atan2(diffY, diffX);
        const clamped = Math.min(dist, joystick.maxDist);

        if (dist > 8) {
          const factor = (clamped - 8) / (joystick.maxDist - 8);
          joystick.dx = Math.cos(angle) * factor;
          joystick.dy = Math.sin(angle) * factor;
        } else {
          joystick.dx = 0;
          joystick.dy = 0;
        }

        if (walkKnobEl) {
          walkKnobEl.style.transform = `translate(${Math.cos(angle) * clamped}px, ${Math.sin(angle) * clamped}px)`;
        }
        continue;
      }

      // Правый стик (прицел и огонь)
      if (fireJoy.active && t.identifier === fireJoy.touchId) {
        const diffX = t.clientX - fireJoy.startX;
        const diffY = t.clientY - fireJoy.startY;
        const dist = Math.hypot(diffX, diffY);
        isFiring = true;

        if (dist > 6 && player) {
          player.aimAngle = Math.atan2(diffX, diffY);
        }

        if (fireKnobEl) {
          const k = Math.min(dist, 40) / (dist || 1);
          fireKnobEl.style.transform = `translate(${diffX * k}px, ${diffY * k}px)`;
        }
      }
    }
  }, { passive: false });

  function stopTouch(id) {
    if (joystick.active && joystick.touchId === id) {
      joystick.active = false;
      joystick.touchId = null;
      joystick.dx = 0;
      joystick.dy = 0;
      if (walkStickEl) walkStickEl.classList.remove('active');
    }
    if (fireJoy.active && fireJoy.touchId === id) {
      fireJoy.active = false;
      fireJoy.touchId = null;
      isFiring = autoFire;
      if (fireBtnEl) fireBtnEl.classList.remove('active');
    }
  }

  window.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) stopTouch(e.changedTouches[i].identifier);
  });
  window.addEventListener('touchcancel', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) stopTouch(e.changedTouches[i].identifier);
  });

  // Управление с клавиатуры и мыши (для ПК тестов)
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyQ') applyQuality(curQualityIdx + 1);
    if (e.code === 'KeyZ') spawnZombie();
    if (e.code === 'Digit1') teleportTo(-14, -14);
    if (e.code === 'Digit2') teleportTo(16, -14);
    if (e.code === 'Digit3') teleportTo(-15, 16);
    if (e.code === 'Digit4') teleportTo(15, 16);
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('mousedown', (e) => { if (!isUI(e.target)) isFiring = true; });
  window.addEventListener('mouseup', () => { isFiring = autoFire; });
  window.addEventListener('mousemove', (e) => {
    if (!player) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    player.aimAngle = Math.atan2(e.clientX - cx, e.clientY - cy);
  });

  // ==========================================
  // 10. ТЕЛЕПОРТАЦИЯ К ПОСТРОЙКАМ
  // ==========================================
  function teleportTo(x, z) {
    if (!player) return;
    player.x = x;
    player.z = z + 6.0; // встать чуть перед входом
    player.group.position.set(player.x, 0, player.z);
    updateCameraPosition(player.x, player.z);
  }

  // ==========================================
  // 11. ИГРОВОЙ ЦИКЛ (Game Loop)
  // ==========================================
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = 0;

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // FPS счетчик
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      const fps = Math.round(frameCount / fpsTimer);
      const fpsEl = document.getElementById('info-fps');
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
      frameCount = 0;
      fpsTimer = 0;
    }

    // Автоматическое движение солнца (если включено)
    if (autoSun) {
      // 15-минутный суточный цикл
      timeOfDay = (timeOfDay + (dt / 900) * 24) % 24;
      updateSun(timeOfDay);
    }

    if (player) {
      // Расчет вектора движения
      let mx = 0, mz = 0;
      if (joystick.active) {
        mx = joystick.dx;
        mz = joystick.dy;
      }
      if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

      const len = Math.hypot(mx, mz);
      const isMoving = len > 0.05;

      if (isMoving) {
        const nx = mx / (len > 1 ? len : 1);
        const nz = mz / (len > 1 ? len : 1);

        const newX = player.x + nx * player.speed * dt;
        const newZ = player.z + nz * player.speed * dt;

        // Проверка коллизий со стенами построек
        if (!Buildings.checkCollision(newX, player.z, 0.45)) player.x = newX;
        if (!Buildings.checkCollision(player.x, newZ, 0.45)) player.z = newZ;

        player.angle = Math.atan2(nx, nz);
        player.walkCycle += dt * 14.0;
      }

      // Анимация ног при ходьбе
      const legSwing = isMoving ? Math.sin(player.walkCycle) * 0.45 : 0;
      player.legL.rotation.x = legSwing;
      player.legR.rotation.x = -legSwing;

      // Поворот бойца (к прицелу если стреляет, или по ходу движения)
      const targetAngle = (isFiring || fireJoy.active) ? player.aimAngle : player.angle;
      player.group.rotation.y = targetAngle;
      player.group.position.set(player.x, 0, player.z);

      // Обновление камеры (следит за игроком)
      updateCameraPosition(player.x, player.z);

      // Стрельба
      if (fireCooldown > 0) fireCooldown -= dt;
      if ((isFiring || autoFire) && fireCooldown <= 0) {
        shoot();
      }

      // Координаты на HUD
      const coordsEl = document.getElementById('info-coords');
      if (coordsEl) coordsEl.textContent = `X: ${player.x.toFixed(1)}, Z: ${player.z.toFixed(1)}`;
    }

    // Обновление пуль
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.mesh.position.addScaledVector(b.dir, b.speed * dt);
      b.life -= dt;

      // Попадание в зомби
      let hit = false;
      for (const z of zombies) {
        if (!z.dead && Math.hypot(b.mesh.position.x - z.x, b.mesh.position.z - z.z) < 0.65) {
          z.hp -= 35;
          hit = true;
          // Вспышка урона зомби
          z.group.position.y += 0.08;
          setTimeout(() => { if (!z.dead) z.group.position.y = 0; }, 80);

          if (z.hp <= 0) {
            z.dead = true;
            z.group.rotation.x = -Math.PI / 2; // падает на землю
            z.group.position.y = 0.15;
          }
          break;
        }
      }

      // Столкновение со стенами построек
      if (!hit && Buildings.checkCollision(b.mesh.position.x, b.mesh.position.z, 0.15)) {
        hit = true;
      }

      if (hit || b.life <= 0) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }

    // Обновление зомби
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      if (z.dead) continue;

      if (player) {
        const dx = player.x - z.x;
        const dz = player.z - z.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.8) {
          const moveDist = z.speed * dt;
          const nx = (dx / dist);
          const nz = (dz / dist);

          const nzx = z.x + nx * moveDist;
          const nzz = z.z + nz * moveDist;

          if (!Buildings.checkCollision(nzx, z.z, 0.4)) z.x = nzx;
          if (!Buildings.checkCollision(z.x, nzz, 0.4)) z.z = nzz;

          z.group.rotation.y = Math.atan2(nx, nz);
          z.group.position.set(z.x, 0, z.z);

          z.walkCycle += dt * 6.0;
          const legA = Math.sin(z.walkCycle) * 0.35;
          z.legL.rotation.x = legA;
          z.legR.rotation.x = -legA;
        }
      }
    }

    renderer.render(scene, camera);
  }

  // ==========================================
  // 12. СТАРТ И ПРИВЯЗКА UI
  // ==========================================
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const p = QUALITY_PROFILES[curQualityIdx];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, p.dpr));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Запуск мира
  createTerrain();
  createNature();

  // Создаем 4 реалистичных постройки
  Buildings.createLogCabin(-14, -14);       // 1. Бревенчатый сруб
  Buildings.createMilitaryPost(16, -14);     // 2. Военный блокпост с вышкой
  Buildings.createRuinedHouse(-15, 16);     // 3. Заброшенный дом
  Buildings.createBunker(15, 16);           // 4. Бункер выживших

  player = createSoldier();
  updateCameraPosition(0, 0);

  // Настройка кнопок UI
  const qBtn = document.getElementById('quality-btn');
  if (qBtn) qBtn.addEventListener('click', () => applyQuality(curQualityIdx + 1));

  const zb = document.getElementById('zombie-btn');
  if (zb) zb.addEventListener('click', () => spawnZombie());

  const ab = document.getElementById('auto-btn');
  if (ab) ab.addEventListener('click', () => {
    autoFire = !autoFire;
    isFiring = autoFire;
    ab.classList.toggle('active', autoFire);
  });

  // Кнопки времени суток
  const tBtns = document.querySelectorAll('.time-btn');
  tBtns.forEach((b) => {
    b.addEventListener('click', () => {
      tBtns.forEach((o) => o.classList.remove('active'));
      b.classList.add('active');
      const timeVal = b.dataset.time;
      if (timeVal === 'auto') {
        autoSun = true;
      } else {
        autoSun = false;
        updateSun(parseFloat(timeVal));
      }
    });
  });

  // Кнопки телепортации к зданиям
  document.getElementById('tp-cabin')?.addEventListener('click', () => teleportTo(-14, -14));
  document.getElementById('tp-post')?.addEventListener('click', () => teleportTo(16, -14));
  document.getElementById('tp-ruin')?.addEventListener('click', () => teleportTo(-15, 16));
  document.getElementById('tp-bunker')?.addEventListener('click', () => teleportTo(15, 16));

  // Поворот экрана
  document.getElementById('rot-btn')?.addEventListener('click', () => {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    Promise.resolve(req ? req.call(el) : null)
      .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
      .catch(() => {});
  });

  // Применяем профиль УЛЬТРА (для RedMagic 10 Pro)
  applyQuality(0);
  updateSun(12.0);

  requestAnimationFrame(animate);
})();
