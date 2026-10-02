// Главный контроллер тестового полигона (Survival Game Test: 9 Моделей Укрытий)
// Режим свободного архитектурного осмотра:
// - Персонаж-человек полностью убран по просьбе пользователя
// - 9 реалистичных 3D-моделей лесных домов и укрытий с честными динамическими тенями от солнца
// - Свободное перемещение по карте (сенсорный стик полёта, 2-пальцевый drag, WASD на ПК)
// - Свободная камера 360° (1 палец вращение yaw/pitch, 360° авто-орбита)
// - Зум в упор и вдаль (от 1.2м до 85.0м: pinch двумя пальцами, колесико мыши, кнопки [🔍 +]/[🔍 −])

(function () {
  'use strict';

  // 1. Инициализация Three.js
  const canvas = document.getElementById('canvas3d');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Дневное небо
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

  // 2. Рендерер
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 3. Параметры свободной камеры 360°
  let cameraYaw = 0;              // Горизонтальный угол (0..360°)
  let cameraPitch = 0.42;         // Вертикальный наклон (~24° к горизонту)
  let cameraDistance = 11.0;      // Дистанция от фокуса (от 1.2м до 85м)
  let isAutoOrbit = false;        // Автоматический кинематографический облёт

  // Целевая точка фокуса камеры (плавно летит в пространстве)
  const currentCamTarget = new THREE.Vector3(-36, 1.8, -36); // Старт у Сруба
  const desiredCamTarget = new THREE.Vector3(-36, 1.8, -36);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.2, 400);

  function updateZoomBadge() {
    const el = document.getElementById('info-zoom');
    if (el) el.textContent = `${cameraDistance.toFixed(1)}м`;
  }

  function zoomCamera(delta) {
    cameraDistance = Math.max(1.2, Math.min(85.0, cameraDistance + delta));
    updateZoomBadge();
  }

  function adjustTargetHeight(delta) {
    desiredCamTarget.y = Math.max(0.5, Math.min(25.0, desiredCamTarget.y + delta));
  }

  // 4. Профили качества графики (RedMagic 10 Pro: 1116x2480 нативно)
  const QUALITY_PROFILES = [\n    { name: 'Ультра (3.3x)', dprMul: 1.0, shadowRes: 2048, shadows: true },\n    { name: 'Высокое (2.0x)', dprMul: 0.65, shadowRes: 1024, shadows: true },\n    { name: 'Среднее (1.5x)', dprMul: 0.5, shadowRes: 512, shadows: true },\n    { name: 'Эконом (1.0x)', dprMul: 0.35, shadowRes: 256, shadows: false }\n  ];
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

  // 5. Солнце и динамические тени
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.75);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -65;
  sunLight.shadow.camera.right = 65;
  sunLight.shadow.camera.top = 65;
  sunLight.shadow.camera.bottom = -65;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  let sunOrbitRadius = 65;
  let timeOfDay = 12; // 12:00 день
  let isAutoTime = false;

  function updateSunPosition() {
    const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;
    sunLight.position.x = Math.cos(angle) * sunOrbitRadius;
    sunLight.position.y = Math.sin(angle) * sunOrbitRadius;
    sunLight.position.z = 25;

    if (sunLight.position.y > 0) {
      const sunHeight = sunLight.position.y / sunOrbitRadius;
      if (sunHeight > 0.3) {
        scene.background.setHex(0x87ceeb);
        scene.fog.color.setHex(0x87ceeb);
        sunLight.color.setHex(0xfffaed);
        sunLight.intensity = 1.35;
        hemiLight.intensity = 0.75;
      } else {
        scene.background.setHex(0xd97706);
        scene.fog.color.setHex(0xd97706);
        sunLight.color.setHex(0xf97316);
        sunLight.intensity = 1.1;
        hemiLight.intensity = 0.5;
      }
    } else {
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

  // 6. Окружение: просторная лесная почва и дорожки между участками
  function createCleanGround() {
    const groundGeom = new THREE.PlaneGeometry(220, 220, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d3a24,
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Гравийные тропинки, связывающие постройки в единый комплекс
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x3d352e,
      roughness: 0.9
    });

    // 3 горизонтальные и 3 вертикальные тропы (по осям -36, 0, 36)
    [-36, 0, 36].forEach(coord => {
      const pathH = new THREE.Mesh(new THREE.PlaneGeometry(100, 2.5), pathMat);
      pathH.rotation.x = -Math.PI / 2;
      pathH.position.set(0, 0.01, coord);
      pathH.receiveShadow = true;
      scene.add(pathH);

      const pathV = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 100), pathMat);
      pathV.rotation.x = -Math.PI / 2;
      pathV.position.set(coord, 0.01, 0);
      pathV.receiveShadow = true;
      scene.add(pathV);
    });
  }

  createCleanGround();

  // 7. Размещение ВСЕХ 9 моделей укрытий на полигоне
  const b = window.Buildings;

  // Ряд 1 (Север: Z = -36)
  scene.add(b.createLogCabin(-36, -36));         // 1. Охотничья бревенчатая изба
  scene.add(b.createBurntCottage(0, -36));        // 2. Сгоревший коттедж (Пожар)
  scene.add(b.createMilitaryPost(36, -36));       // 3. Военный блокпост с вышкой

  // Ряд 2 (Центр: Z = 0)
  scene.add(b.createRuinedHouse(-36, 0));         // 4. Заброшенный кирпичный дом (Руины)
  scene.add(b.createBombCraterHouse(0, 0));       // 5. Дом после авиаудара с воронкой
  scene.add(b.createUnfinishedFramedHouse(36, 0)); // 6. Недостроенный каркасный дом (Стройка)

  // Ряд 3 (Юг: Z = 36)
  scene.add(b.createEarthquakeChalet(-36, 36));   // 7. Шале после тектонического разлома
  scene.add(b.createZombieBreachedFarm(0, 36));   // 8. Усадьба после штурма орды
  scene.add(b.createBunker(36, 36));              // 9. Укреплённый бункер выживших

  // 8. Свободное сенсорное управление (RedMagic 10 Pro)
  // Левая рука: плавающий джойстик полёта по карте
  const moveStick = { active: false, touchId: null, startX: 0, startY: 0, dx: 0, dy: 0, maxDist: 48 };

  // Правая рука / экран: вращение 360°, зум (pinch), перетаскивание карты
  let isCamDragging = false;
  let camTouchId = null;
  let lastTouchX = 0;
  let lastTouchY = 0;

  let isPinching = false;
  let initialPinchDist = 0;
  let initialPinchCameraDist = 0;

  let isTwoFingerPan = false;
  let lastPanCenterX = 0;
  let lastPanCenterY = 0;

  const moveStickEl = document.getElementById('move-stick');
  const moveKnobEl = document.getElementById('move-knob');

  function isUI(t) {
    return t && t.closest && !!(
      t.closest('#top-bar') ||
      t.closest('#teleport-bar') ||
      t.closest('#cam-controls') ||
      t.closest('#building-info-bar') ||
      t.closest('#move-hint-container') ||
      t.closest('#stick-mode-btn') ||
      t.closest('#rot-btn')
    );
  }

  window.addEventListener('touchstart', (e) => {
    // 2 пальца: мультитач (Pinch зум + Двупальцевое перетаскивание карты)
    if (e.touches.length === 2) {
      e.preventDefault();
      isPinching = true;
      isTwoFingerPan = true;
      isCamDragging = false;

      initialPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchCameraDist = cameraDistance;

      lastPanCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      lastPanCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      return;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (isUI(t.target)) continue;

      // Левая нижняя треть экрана — стик свободного полёта по карте
      if (t.clientX < window.innerWidth * 0.42 && t.clientY > window.innerHeight * 0.4) {
        if (!moveStick.active) {
          moveStick.active = true;
          moveStick.touchId = t.identifier;
          moveStick.startX = t.clientX;
          moveStick.startY = t.clientY;
          moveStick.dx = 0;
          moveStick.dy = 0;
          if (moveStickEl) {
            moveStickEl.style.display = 'block';
            moveStickEl.style.left = `${t.clientX}px`;
            moveStickEl.style.top = `${t.clientY}px`;
          }
          if (moveKnobEl) moveKnobEl.style.transform = 'translate(0px, 0px)';
        }
      }
      // Остальная область экрана — свободное вращение камеры на 360°
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
    // 2 пальца: обработка зума и панорамирования
    if (e.touches.length >= 2) {
      e.preventDefault();
      const curDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = initialPinchDist / (curDist || 1);
      cameraDistance = Math.max(1.2, Math.min(85.0, initialPinchCameraDist * ratio));
      updateZoomBadge();

      // Панорамирование карты двумя пальцами
      const curCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const curCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const panDX = curCenterX - lastPanCenterX;
      const panDY = curCenterY - lastPanCenterY;
      lastPanCenterX = curCenterX;
      lastPanCenterY = curCenterY;

      // Сдвигаем точку фокуса относительно угла обзора
      const panSpeed = (cameraDistance / 600);
      const forwardX = -Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      desiredCamTarget.x -= (rightX * panDX + forwardX * (-panDY)) * panSpeed;
      desiredCamTarget.z -= (rightZ * panDX + forwardZ * (-panDY)) * panSpeed;
      return;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];

      // Вращение камеры 360°
      if (isCamDragging && t.identifier === camTouchId) {
        e.preventDefault();
        const dx = t.clientX - lastTouchX;
        const dy = t.clientY - lastTouchY;
        cameraYaw -= dx * 0.007;
        cameraPitch = Math.max(0.05, Math.min(1.52, cameraPitch + dy * 0.007));
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
      }
      // Стик полёта по карте
      else if (moveStick.active && t.identifier === moveStick.touchId) {
        e.preventDefault();
        const diffX = t.clientX - moveStick.startX;
        const diffY = t.clientY - moveStick.startY;
        const dist = Math.hypot(diffX, diffY);
        const a = Math.atan2(diffY, diffX);
        const cl = Math.min(dist, moveStick.maxDist);

        if (dist > 6) {
          const factor = (cl - 6) / (moveStick.maxDist - 6);
          moveStick.dx = Math.cos(a) * factor;
          moveStick.dy = Math.sin(a) * factor;
        } else {
          moveStick.dx = 0;
          moveStick.dy = 0;
        }
        if (moveKnobEl) {
          moveKnobEl.style.transform = `translate(${Math.cos(a) * cl}px, ${Math.sin(a) * cl}px)`;
        }
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      isPinching = false;
      isTwoFingerPan = false;
    }
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === camTouchId) {
        isCamDragging = false;
        camTouchId = null;
      }
      if (moveStick.active && t.identifier === moveStick.touchId) {
        moveStick.active = false;
        moveStick.dx = 0;
        moveStick.dy = 0;
        if (moveStickEl) moveStickEl.style.display = 'none';
      }
    }
  });

  // 9. Мышь и клавиатура (для ПК)
  let isMouseRotating = false;
  let isMousePanning = false;
  let mouseStartX = 0;
  let mouseStartY = 0;

  window.addEventListener('mousedown', (e) => {
    if (isUI(e.target)) return;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    if (e.button === 0) {
      isMouseRotating = true;
      isAutoOrbit = false;
      document.getElementById('cam-orbit-btn')?.classList.remove('active');
    } else if (e.button === 1 || e.button === 2) {
      isMousePanning = true;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isMouseRotating) {
      const dx = e.clientX - mouseStartX;
      const dy = e.clientY - mouseStartY;
      cameraYaw -= dx * 0.006;
      cameraPitch = Math.max(0.05, Math.min(1.52, cameraPitch + dy * 0.006));
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    } else if (isMousePanning) {
      const dx = e.clientX - mouseStartX;
      const dy = e.clientY - mouseStartY;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;

      const panSpeed = (cameraDistance / 600);
      const forwardX = -Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      desiredCamTarget.x -= (rightX * dx + forwardX * (-dy)) * panSpeed;
      desiredCamTarget.z -= (rightZ * dx + forwardZ * (-dy)) * panSpeed;
    }
  });

  window.addEventListener('mouseup', () => {
    isMouseRotating = false;
    isMousePanning = false;
  });
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('wheel', (e) => {
    zoomCamera(Math.sign(e.deltaY) * 2.0);
  }, { passive: true });

  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyQ') cameraYaw += 0.08;
    if (e.code === 'KeyE') cameraYaw -= 0.08;
    if (e.code === 'KeyR') adjustTargetHeight(1.0);
    if (e.code === 'KeyF') adjustTargetHeight(-1.0);
    if (e.code === 'Equal' || e.code === 'NumpadAdd') zoomCamera(-2.5);
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') zoomCamera(2.5);
    if (e.code === 'Space') {
      isAutoOrbit = !isAutoOrbit;
      document.getElementById('cam-orbit-btn')?.classList.toggle('active', isAutoOrbit);
    }
    // Быстрый переход по клавишам 1..9
    const digits = ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9'];
    const idx = digits.indexOf(e.code);
    if (idx !== -1) {
      const bl = b.getBuildingList();
      if (bl[idx]) focusBuildingById(bl[idx].id);
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  // 10. Фокусировка на любом из 9 зданий
  function focusBuildingById(id) {
    const bl = b.getBuildingList();
    const item = bl.find(x => x.id === id);
    if (!item) return;

    desiredCamTarget.set(item.x, item.camY || 2.0, item.z);
    cameraDistance = item.dist || 12.0;
    updateZoomBadge();

    // Обновляем заголовок и активную кнопку
    const titleEl = document.getElementById('building-title');
    if (titleEl) {
      titleEl.textContent = `${item.name} — ${item.desc}`;
    }

    document.querySelectorAll('.tp-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-id') === id);
    });
  }

  // Привязка кнопок зданий
  document.querySelectorAll('.tp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      focusBuildingById(id);
    });
  });

  // Кнопки панели камеры
  document.getElementById('cam-zoom-in')?.addEventListener('click', () => zoomCamera(-2.5));
  document.getElementById('cam-zoom-out')?.addEventListener('click', () => zoomCamera(2.5));
  document.getElementById('cam-up-btn')?.addEventListener('click', () => adjustTargetHeight(1.5));
  document.getElementById('cam-down-btn')?.addEventListener('click', () => adjustTargetHeight(-1.5));

  const orbitBtn = document.getElementById('cam-orbit-btn');
  orbitBtn?.addEventListener('click', () => {
    isAutoOrbit = !isAutoOrbit;
    orbitBtn.classList.toggle('active', isAutoOrbit);
  });

  document.getElementById('cam-reset-btn')?.addEventListener('click', () => {
    cameraYaw = 0;
    cameraPitch = 0.42;
    cameraDistance = 12.0;
    isAutoOrbit = false;
    orbitBtn?.classList.remove('active');
    updateZoomBadge();
  });

  document.getElementById('cam-map-btn')?.addEventListener('click', () => {
    desiredCamTarget.set(0, 2.0, 0);
    cameraDistance = 75.0;
    cameraPitch = 0.95; // Высокий обзор птичьего полёта
    isAutoOrbit = false;
    orbitBtn?.classList.remove('active');
    updateZoomBadge();
    const titleEl = document.getElementById('building-title');
    if (titleEl) titleEl.textContent = '🗺️ Обзор всего полигона (9 моделей укрытий)';
  });

  document.getElementById('quality-btn')?.addEventListener('click', () => {
    applyQuality(curQualityIdx + 1);
  });

  // Время суток
  const timeBtns = document.querySelectorAll('.time-btn');
  timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
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

  // Инверсия направления стика (прямой полёт vs реверс)
  let isStickInverted = false;
  try {
    const saved = localStorage.getItem('poligon_stick_inverted');
    if (saved !== null) isStickInverted = saved === '1';
  } catch (e) {}

  const stickModeBtn = document.getElementById('stick-mode-btn');
  function updateStickModeUI() {
    if (!stickModeBtn) return;
    if (isStickInverted) {
      stickModeBtn.textContent = '🔄 Стик: Инверт';
      stickModeBtn.classList.add('inverted');
    } else {
      stickModeBtn.textContent = '🕹️ Стик: Прямой';
      stickModeBtn.classList.remove('inverted');
    }
  }

  stickModeBtn?.addEventListener('click', () => {
    isStickInverted = !isStickInverted;
    try {
      localStorage.setItem('poligon_stick_inverted', isStickInverted ? '1' : '0');
    } catch (e) {}
    updateStickModeUI();
  });
  updateStickModeUI();

  // 11. Игровой цикл
  let lastTime = performance.now();
  let fpsFrames = 0;
  let fpsTimer = 0;

  function gameLoop(now) {
    requestAnimationFrame(gameLoop);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // FPS
    fpsFrames++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      const fps = Math.round(fpsFrames / fpsTimer);
      const fpsEl = document.getElementById('info-fps');
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
      fpsFrames = 0;
      fpsTimer = 0;
    }

    if (isAutoTime) {
      timeOfDay = (timeOfDay + dt * 0.5) % 24;
      updateSunPosition();
    }

    // Свободный полёт по карте через стик с корректной проекцией на угол обзора
    if (moveStick.active && (moveStick.dx !== 0 || moveStick.dy !== 0)) {
      const moveSpeed = Math.max(10, cameraDistance * 0.95);
      
      const forwardX = -Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      // moveStick.dy < 0 когда палец тянут вверх (вглубь экрана)
      // moveStick.dx > 0 когда палец тянут вправо
      const inv = isStickInverted ? -1 : 1;
      const inputFwd = (-moveStick.dy) * inv;
      const inputRight = (moveStick.dx) * inv;

      desiredCamTarget.x += (rightX * inputRight + forwardX * inputFwd) * moveSpeed * dt;
      desiredCamTarget.z += (rightZ * inputRight + forwardZ * inputFwd) * moveSpeed * dt;
    }

    // Клавиатура WASD на ПК с корректной проекцией
    let keyFwd = 0, keyRight = 0;
    if (keys['KeyW'] || keys['ArrowUp']) keyFwd += 1;
    if (keys['KeyS'] || keys['ArrowDown']) keyFwd -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) keyRight -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) keyRight += 1;
    if (keyFwd !== 0 || keyRight !== 0) {
      const keySpeed = Math.max(12, cameraDistance * 1.1);
      const len = Math.hypot(keyRight, keyFwd);
      const normRight = keyRight / len;
      const normFwd = keyFwd / len;

      const forwardX = -Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      desiredCamTarget.x += (rightX * normRight + forwardX * normFwd) * keySpeed * dt;
      desiredCamTarget.z += (rightZ * normRight + forwardZ * normFwd) * keySpeed * dt;
    }
    // Авто-облёт 360°
    if (isAutoOrbit) {
      cameraYaw += dt * 0.35;
    }

    // Плавная интерполяция к целевой точке фокуса
    currentCamTarget.lerp(desiredCamTarget, dt * 7.0);

    // Сферические координаты камеры 360°
    const cy = currentCamTarget.y + cameraDistance * Math.sin(cameraPitch);
    const horizDist = cameraDistance * Math.cos(cameraPitch);
    const cx = currentCamTarget.x + horizDist * Math.sin(cameraYaw);
    const cz = currentCamTarget.z + horizDist * Math.cos(cameraYaw);

    camera.position.set(cx, cy, cz);
    camera.lookAt(currentCamTarget);

    // Обновление координат в панели
    const coordEl = document.getElementById('info-coords');
    if (coordEl) {
      coordEl.textContent = `X: ${currentCamTarget.x.toFixed(1)}, Z: ${currentCamTarget.z.toFixed(1)}`;
    }

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Запуск
  applyQuality(0); // Ультра 3.3x
  updateSunPosition();
  updateZoomBadge();
  focusBuildingById('cabin');
  requestAnimationFrame(gameLoop);

})();
