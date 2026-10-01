// Главный контроллер тестового полигона моделей (Survival Game Test Sandbox)
// Запускает 3D-сцену Three.js, честное солнце с динамическими тенями,
// чистую почву, 4 постройки укрытий, персонажа, зомби и интерфейс

(function () {
  'use strict';

  // 1. Инициализация сцены Three.js
  const canvas = document.getElementById('canvas3d');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Небесно-голубой фон
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

  // 2. Рендерер
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 3. Камера 360° со сферическими координатами и зумом
  let cameraYaw = 0;             // Горизонтальный угол (0..360°)
  let cameraPitch = 0.42;        // Вертикальный наклон (~24° к горизонту)
  let cameraDistance = 9.5;      // Стартовое приближение (плотный осмотр в упор)
  let isAutoOrbit = false;       // Режим авто-вращения 360° вокруг постройки
  let focusOnPlayer = false;     // Следить за бойцом или за постройкой

  // Точка фокуса камеры (плавно перемещается между объектами)
  const currentCamTarget = new THREE.Vector3(-8, 1.5, -8); // Стартуем с фокуса на Срубе
  const desiredCamTarget = new THREE.Vector3(-8, 1.5, -8);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.2, 300);

  function updateZoomBadge() {
    const el = document.getElementById('info-zoom');
    if (el) el.textContent = `${cameraDistance.toFixed(1)}м`;
  }

  function zoomCamera(delta) {
    cameraDistance = Math.max(1.8, Math.min(45.0, cameraDistance + delta));
    updateZoomBadge();
  }

  // 4. Профили качества графики (RedMagic 10 Pro: 1116x2480 нативно)
  const QUALITY_PROFILES = [
    { name: 'Ультра (3.3x)', dprMul: 1.0, shadowRes: 2048, shadows: true },
    { name: 'Высокое (2.0x)', dprMul: 0.65, shadowRes: 1024, shadows: true },
    { name: 'Среднее (1.5x)', dprMul: 0.5, shadowRes: 512, shadows: true },
    { name: 'Эконом (1.0x)', dprMul: 0.35, shadowRes: 256, shadows: false }
  ];
  let curQualityIdx = 0;

  function applyQuality(idx) {
    curQualityIdx = (idx + QUALITY_PROFILES.length) % QUALITY_PROFILES.length;
    const p = QUALITY_PROFILES[curQualityIdx];
    const devDpr = window.devicePixelRatio || 1;
    const effDpr = Math.max(1, Math.min(3.5, devDpr * p.dprMul));
    renderer.setPixelRatio(effDpr);
    renderer.shadowMap.enabled = p.shadows;
    if (sunLight.shadow.map) {
      sunLight.shadow.map.dispose();
      sunLight.shadow.map = null;
    }
    sunLight.shadow.mapSize.width = p.shadowRes;
    sunLight.shadow.mapSize.height = p.shadowRes;
    sunLight.castShadow = p.shadows;

    const qBtn = document.getElementById('quality-btn');
    if (qBtn) qBtn.textContent = `⚡ ${p.name.toUpperCase()}`;
    const qTag = document.getElementById('quality-tag');
    if (qTag) qTag.textContent = p.name;
  }

  // 5. Освещение и динамическое Солнце
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -28;
  sunLight.shadow.camera.right = 28;
  sunLight.shadow.camera.top = 28;
  sunLight.shadow.camera.bottom = -28;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  let sunOrbitRadius = 38;
  let timeOfDay = 12; // 12:00 день
  let isAutoTime = false;

  function updateSunPosition() {
    const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;
    sunLight.position.x = Math.cos(angle) * sunOrbitRadius;
    sunLight.position.y = Math.sin(angle) * sunOrbitRadius;
    sunLight.position.z = 18;

    // Цвет неба и солнца в зависимости от высоты
    if (sunLight.position.y > 0) {
      const sunHeight = sunLight.position.y / sunOrbitRadius;
      if (sunHeight > 0.3) {
        // День
        scene.background.setHex(0x87ceeb);
        scene.fog.color.setHex(0x87ceeb);
        sunLight.color.setHex(0xfffaed);
        sunLight.intensity = 1.35;
        hemiLight.intensity = 0.7;
      } else {
        // Закат / Рассвет
        scene.background.setHex(0xd97706);
        scene.fog.color.setHex(0xd97706);
        sunLight.color.setHex(0xf97316);
        sunLight.intensity = 1.1;
        hemiLight.intensity = 0.45;
      }
    } else {
      // Ночь
      scene.background.setHex(0x090d16);
      scene.fog.color.setHex(0x090d16);
      sunLight.color.setHex(0x38bdf8);
      sunLight.intensity = 0.25;
      hemiLight.intensity = 0.18;
    }

    const tTag = document.getElementById('time-tag');
    if (tTag) {
      const h = Math.floor(timeOfDay);
      const m = Math.floor((timeOfDay % 1) * 60);
      tTag.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }

  // 6. Чистая естественная почва без процедурных точек и пятен
  function createCleanGround() {
    const groundGeom = new THREE.PlaneGeometry(160, 160, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2b3824, // Естественный цвет лесной почвы и примятой травы
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Дорожки из гравия между постройками
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x3d352e, // Утрамбованная грунтовая тропинка
      roughness: 0.9
    });
    const path1 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 28), pathMat);
    path1.rotation.x = -Math.PI / 2;
    path1.position.set(0, 0.01, 0);
    path1.receiveShadow = true;
    scene.add(path1);

    const path2 = new THREE.Mesh(new THREE.PlaneGeometry(28, 2.2), pathMat);
    path2.rotation.x = -Math.PI / 2;
    path2.position.set(0, 0.01, 0);
    path2.receiveShadow = true;
    scene.add(path2);
  }

  createCleanGround();

  // 7. Создание и размещение 4-х 3D-построек на полигоне
  const buildings = window.Buildings;

  // 7.1 Сруб (Северо-Запад: -8, -8)
  const cabin = buildings.createLogCabin(-8, -8);
  scene.add(cabin);

  // 7.2 Военный блокпост (Северо-Восток: 8, -8)
  const post = buildings.createMilitaryPost(8, -8);
  scene.add(post);

  // 7.3 Заброшенный дом (Юго-Запад: -8, 8)
  const ruin = buildings.createRuinedHouse(-8, 8);
  scene.add(ruin);

  // 7.4 Бункер выживших (Юго-Восток: 8, 8)
  const bunker = buildings.createBunker(8, 8);
  scene.add(bunker);

  // 8. Персонаж игрока (боец с оружием)
  // Спавним прямо перед Срубом (-8, -3.5), чтобы он был сразу виден при старте
  const player = {
    x: -8,
    z: -3.5,
    speed: 5.5,
    radius: 0.45,
    rotation: 0,
    aimAngle: 0,
    mesh: null
  };

  function createPlayerMesh() {
    const group = new THREE.Group();

    // Тело бойца (тактический комбинезон)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.7 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 });

    // Торс
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.85, 8), bodyMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    // Бронежилет
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.42), vestMat);
    vest.position.y = 1.12;
    vest.castShadow = true;
    group.add(vest);

    // Голова и тактический шлем
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    group.add(head);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), vestMat);
    helmet.position.y = 1.66;
    helmet.castShadow = true;
    group.add(helmet);

    // Ноги
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.7, 6), bodyMat);
    legL.position.set(-0.16, 0.35, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.7, 6), bodyMat);
    legR.position.set(0.16, 0.35, 0);
    legR.castShadow = true;
    group.add(legR);

    // 3D автомат в руках
    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.85), gunMat);
    rifle.position.set(0.22, 1.05, 0.45);
    rifle.castShadow = true;
    group.add(rifle);

    group.position.set(player.x, 0, player.z);
    scene.add(group);
    player.mesh = group;
  }

  createPlayerMesh();

  // 9. Зомби (спавн по кнопке)
  const zombies = [];
  function spawnZombie() {
    const zGroup = new THREE.Group();
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x5b7065, roughness: 0.85 }); // Бледная зеленоватая кожа

    // Рост взрослого человека ~1.8м
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.85, 8), shirtMat);
    body.position.y = 1.05;
    body.castShadow = true;
    zGroup.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    zGroup.add(head);

    // Вытянутые руки вперёд
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.65, 6), skinMat);
    armL.rotation.x = Math.PI / 2 - 0.2;
    armL.position.set(-0.28, 1.25, 0.32);
    armL.castShadow = true;
    zGroup.add(armL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.65, 6), skinMat);
    armR.rotation.x = Math.PI / 2 - 0.2;
    armR.position.set(0.28, 1.25, 0.32);
    armR.castShadow = true;
    zGroup.add(armR);

    // Ноги
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.7, 6), shirtMat);
    legL.position.set(-0.15, 0.35, 0);
    legL.castShadow = true;
    zGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.7, 6), shirtMat);
    legR.position.set(0.15, 0.35, 0);
    legR.castShadow = true;
    zGroup.add(legR);

    // Позиция спавна рядом с бойцом
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 4.5 + Math.random() * 2.5;
    const zx = player.x + Math.cos(spawnAngle) * spawnDist;
    const zz = player.z + Math.sin(spawnAngle) * spawnDist;

    zGroup.position.set(zx, 0, zz);
    scene.add(zGroup);
    zombies.push({
      x: zx,
      z: zz,
      mesh: zGroup,
      speed: 2.1
    });
  }

  // 10. Сенсорное управление RedMagic 10 Pro
  const joystick = { active: false, touchId: null, startX: 0, startY: 0, dx: 0, dy: 0, maxDist: 48 };
  const fireStick = { active: false, touchId: null, startX: 0, startY: 0, dx: 0, dy: 0, isFiring: false };

  // Переменные для вращения камеры 360° и pinch-to-zoom
  let isCamDragging = false;
  let camTouchId = null;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let isPinching = false;
  let initialPinchDist = 0;
  let initialPinchCameraDist = 0;

  const walkStickEl = document.getElementById('walk-stick');
  const walkKnobEl = document.getElementById('walk-knob');
  const fireBtnEl = document.getElementById('fire-btn');
  const fireKnobEl = document.getElementById('fire-knob');

  function isUI(t) {
    return t && t.closest && !!(
      t.closest('#top-bar') ||
      t.closest('#teleport-bar') ||
      t.closest('#cam-controls') ||
      t.closest('#zombie-btn') ||
      t.closest('#auto-btn') ||
      t.closest('#rot-btn')
    );
  }

  window.addEventListener('touchstart', (e) => {
    // Двупальцевый жест зума (Pinch-to-zoom)
    if (e.touches.length === 2) {
      e.preventDefault();
      isPinching = true;
      isCamDragging = false;
      initialPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchCameraDist = cameraDistance;
      return;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (isUI(t.target)) continue;

      // Левый нижний угол экрана — джойстик ходьбы
      if (t.clientX < window.innerWidth * 0.4 && t.clientY > window.innerHeight * 0.45) {
        if (!joystick.active) {
          joystick.active = true;
          joystick.touchId = t.identifier;
          joystick.startX = t.clientX;
          joystick.startY = t.clientY;
          joystick.dx = 0;
          joystick.dy = 0;
          walkStickEl.style.display = 'block';
          walkStickEl.style.left = `${t.clientX}px`;
          walkStickEl.style.top = `${t.clientY}px`;
          walkKnobEl.style.transform = 'translate(0px, 0px)';
        }
      }
      // Правый нижний угол экрана — плавающий стик прицела и огня
      else if (t.clientX > window.innerWidth * 0.6 && t.clientY > window.innerHeight * 0.45) {
        if (!fireStick.active) {
          fireStick.active = true;
          fireStick.touchId = t.identifier;
          fireStick.startX = t.clientX;
          fireStick.startY = t.clientY;
          fireStick.isFiring = true;
          fireBtnEl.style.display = 'block';
          fireBtnEl.style.left = `${t.clientX}px`;
          fireBtnEl.style.top = `${t.clientY}px`;
          fireKnobEl.style.transform = 'translate(0px, 0px)';
        }
      }
      // Верхняя или центральная часть экрана — свободное вращение камеры 360°
      else {
        if (!isCamDragging && !isPinching) {
          isCamDragging = true;
          camTouchId = t.identifier;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
          isAutoOrbit = false;
          document.getElementById('cam-orbit-btn')?.classList.remove('active');
        }
      }
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    // Обработка двух пальцев (Pinch Zoom)
    if (isPinching && e.touches.length >= 2) {
      e.preventDefault();
      const curDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = initialPinchDist / (curDist || 1);
      cameraDistance = Math.max(1.8, Math.min(45.0, initialPinchCameraDist * ratio));
      updateZoomBadge();
      return;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];

      // Вращение камеры 360°
      if (isCamDragging && t.identifier === camTouchId) {
        e.preventDefault();
        const dx = t.clientX - lastTouchX;
        const dy = t.clientY - lastTouchY;
        cameraYaw -= dx * 0.007; // поворот по кругу 360°
        cameraPitch = Math.max(0.05, Math.min(1.52, cameraPitch + dy * 0.007)); // наклон
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
      }
      // Джойстик ходьбы
      else if (joystick.active && t.identifier === joystick.touchId) {
        e.preventDefault();
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
          joystick.dx = 0;
          joystick.dy = 0;
        }
        walkKnobEl.style.transform = `translate(${Math.cos(a) * cl}px, ${Math.sin(a) * cl}px)`;
      }
      // Джойстик прицела и огня
      else if (fireStick.active && t.identifier === fireStick.touchId) {
        e.preventDefault();
        const diffX = t.clientX - fireStick.startX;
        const diffY = t.clientY - fireStick.startY;
        const dist = Math.hypot(diffX, diffY);
        if (dist > 12) {
          const a = Math.atan2(diffX, diffY);
          // Учитываем вращение камеры при прицеливании
          player.aimAngle = a + cameraYaw;
        }
        const cl = Math.min(dist, 50);
        const a = Math.atan2(diffY, diffX);
        fireKnobEl.style.transform = `translate(${Math.cos(a) * cl}px, ${Math.sin(a) * cl}px)`;
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      isPinching = false;
    }
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === camTouchId) {
        isCamDragging = false;
        camTouchId = null;
      }
      if (joystick.active && t.identifier === joystick.touchId) {
        joystick.active = false;
        joystick.dx = 0;
        joystick.dy = 0;
        walkStickEl.style.display = 'none';
      }
      if (fireStick.active && t.identifier === fireStick.touchId) {
        fireStick.active = false;
        fireStick.isFiring = false;
        fireBtnEl.style.display = 'none';
      }
    }
  });

  // Вспомогательное мышиное управление (для ПК тестов)
  let isMouseDown = false;
  let mouseStartX = 0;
  let mouseStartY = 0;

  window.addEventListener('mousedown', (e) => {
    if (isUI(e.target)) return;
    if (e.button === 0 || e.button === 2) {
      isMouseDown = true;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
      isAutoOrbit = false;
      document.getElementById('cam-orbit-btn')?.classList.remove('active');
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
      const dx = e.clientX - mouseStartX;
      const dy = e.clientY - mouseStartY;
      cameraYaw -= dx * 0.006;
      cameraPitch = Math.max(0.05, Math.min(1.52, cameraPitch + dy * 0.006));
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    } else if (player && !isUI(e.target)) {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      player.aimAngle = Math.atan2(e.clientX - cx, e.clientY - cy) + cameraYaw;
    }
  });

  window.addEventListener('mouseup', () => { isMouseDown = false; });
  window.addEventListener('contextmenu', (e) => { e.preventDefault(); });

  // Колесико мыши — зум
  window.addEventListener('wheel', (e) => {
    zoomCamera(Math.sign(e.deltaY) * 1.5);
  }, { passive: true });

  // Клавиатура (ПК)
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyQ') applyQuality(curQualityIdx + 1);
    if (e.code === 'KeyZ') spawnZombie();
    if (e.code === 'Equal' || e.code === 'NumpadAdd') zoomCamera(-2.0);
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') zoomCamera(2.0);
    if (e.code === 'Digit1') focusBuilding(-8, -8);
    if (e.code === 'Digit2') focusBuilding(8, -8);
    if (e.code === 'Digit3') focusBuilding(-8, 8);
    if (e.code === 'Digit4') focusBuilding(8, 8);
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  // 11. Фокусировка камеры и телепортация
  function focusBuilding(bx, bz) {
    focusOnPlayer = false;
    desiredCamTarget.set(bx, 1.8, bz);
    player.x = bx;
    player.z = bz + 4.5; // Ставим игрока перед входом в здание
    if (player.mesh) player.mesh.position.set(player.x, 0, player.z);
  }

  // 12. Привязка UI кнопок
  document.getElementById('tp-cabin')?.addEventListener('click', () => focusBuilding(-8, -8));
  document.getElementById('tp-post')?.addEventListener('click', () => focusBuilding(8, -8));
  document.getElementById('tp-ruin')?.addEventListener('click', () => focusBuilding(-8, 8));
  document.getElementById('tp-bunker')?.addEventListener('click', () => focusBuilding(8, 8));

  // Кнопки управления камерой 360° и зумом
  document.getElementById('cam-zoom-in')?.addEventListener('click', () => zoomCamera(-2.0));
  document.getElementById('cam-zoom-out')?.addEventListener('click', () => zoomCamera(2.0));

  const orbitBtn = document.getElementById('cam-orbit-btn');
  orbitBtn?.addEventListener('click', () => {
    isAutoOrbit = !isAutoOrbit;
    orbitBtn.classList.toggle('active', isAutoOrbit);
  });

  document.getElementById('cam-reset-btn')?.addEventListener('click', () => {
    cameraYaw = 0;
    cameraPitch = 0.42;
    cameraDistance = 9.5;
    isAutoOrbit = false;
    orbitBtn?.classList.remove('active');
    updateZoomBadge();
  });

  document.getElementById('cam-player-btn')?.addEventListener('click', () => {
    focusOnPlayer = true;
  });

  document.getElementById('quality-btn')?.addEventListener('click', () => {
    applyQuality(curQualityIdx + 1);
  });

  document.getElementById('zombie-btn')?.addEventListener('click', () => {
    spawnZombie();
  });

  // Кнопки времени суток
  const timeBtns = document.querySelectorAll('.time-btn');
  timeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      timeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-time');
      if (val === 'auto') {
        isAutoTime = true;
      } else {
        isAutoTime = false;
        timeOfDay = parseFloat(val);
        updateSunPosition();
      }
    });
  });

  // 13. Игровой цикл
  let lastTime = performance.now();
  let fpsFrames = 0;
  let fpsTimer = 0;

  function updateCamera(dt) {
    if (isAutoOrbit) {
      cameraYaw += dt * 0.35; // Автоматический кинематографичный облёт
    }

    if (focusOnPlayer) {
      desiredCamTarget.set(player.x, 1.2, player.z);
    }

    // Плавная интерполяция к целевой точке фокуса
    currentCamTarget.lerp(desiredCamTarget, dt * 6.0);

    // Сферические координаты камеры 360°
    const cy = currentCamTarget.y + cameraDistance * Math.sin(cameraPitch);
    const horizDist = cameraDistance * Math.cos(cameraPitch);
    const cx = currentCamTarget.x + horizDist * Math.sin(cameraYaw);
    const cz = currentCamTarget.z + horizDist * Math.cos(cameraYaw);

    camera.position.set(cx, cy, cz);
    camera.lookAt(currentCamTarget);
  }

  function gameLoop(now) {
    requestAnimationFrame(gameLoop);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // FPS подсчет
    fpsFrames++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      const fps = Math.round(fpsFrames / fpsTimer);
      const fpsEl = document.getElementById('info-fps');
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
      fpsFrames = 0;
      fpsTimer = 0;
    }

    // Авто-время
    if (isAutoTime) {
      timeOfDay = (timeOfDay + dt * 0.5) % 24;
      updateSunPosition();
    }

    // Движение игрока
    let mx = 0, mz = 0;
    if (joystick.active) {
      // Движение относительно угла камеры!
      const moveAngle = Math.atan2(joystick.dx, -joystick.dy) + cameraYaw;
      const mag = Math.hypot(joystick.dx, joystick.dy);
      mx = Math.sin(moveAngle) * mag;
      mz = -Math.cos(moveAngle) * mag;
    } else {
      let kx = 0, kz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) kz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) kz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) kx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) kx += 1;
      if (kx !== 0 || kz !== 0) {
        const keyAngle = Math.atan2(kx, kz) + cameraYaw;
        mx = Math.sin(keyAngle);
        mz = Math.cos(keyAngle);
      }
    }

    if (mx !== 0 || mz !== 0) {
      const nextX = player.x + mx * player.speed * dt;
      const nextZ = player.z + mz * player.speed * dt;

      // Проверка столкновения со зданиями
      const col = buildings.checkCollision(nextX, nextZ, player.radius);
      if (!col.collided) {
        player.x = nextX;
        player.z = nextZ;
      } else {
        player.x = col.pushX;
        player.z = col.pushZ;
      }

      player.rotation = Math.atan2(mx, mz);
    }

    // Поворот персонажа к прицелу
    if (fireStick.active || keys['Space']) {
      player.rotation = player.aimAngle;
    }

    if (player.mesh) {
      player.mesh.position.set(player.x, 0, player.z);
      player.mesh.rotation.y = player.rotation;
    }

    // Зомби преследуют игрока
    for (let z of zombies) {
      const dx = player.x - z.x;
      const dz = player.z - z.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.8) {
        const nx = z.x + (dx / dist) * z.speed * dt;
        const nz = z.z + (dz / dist) * z.speed * dt;
        const col = buildings.checkCollision(nx, nz, 0.45);
        if (!col.collided) {
          z.x = nx;
          z.z = nz;
        }
        z.mesh.position.set(z.x, 0, z.z);
        z.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }

    // Обновление координат в UI
    const coordEl = document.getElementById('info-coords');
    if (coordEl) {
      coordEl.textContent = `X: ${player.x.toFixed(1)}, Z: ${player.z.toFixed(1)}`;
    }

    // Обновление камеры
    updateCamera(dt);

    // Рендер сцены
    renderer.render(scene, camera);
  }

  // Ресайз окна
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Запуск
  applyQuality(0); // По умолчанию Ультра 3.3x
  updateSunPosition();
  updateZoomBadge();
  requestAnimationFrame(gameLoop);

})();
