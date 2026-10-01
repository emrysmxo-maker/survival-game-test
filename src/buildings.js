// Библиотека 3D-моделей зданий и укрытий для Survival Game
// Каждое здание имеет честную геометрию, реалистичные пропорции, детализацию
// и отбрасывает честные тени от солнца на землю (castShadow = true, receiveShadow = true)
window.Buildings = (function () {

  const T = window.Textures;

  // Вспомогательный хелпер для включения теней на всей иерархии меша
  function enableShadows(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return obj;
  }

  // =========================================================================
  // 1. ОХОТНИЧЬЯ БРЕВЕНЧАТАЯ ИЗБА (СРУБ)
  // Размер ~ 6.5м x 5.5м x 4.2м в коньке
  // Включает: каменный фундамент, срубленные брёвна стен с перерубами,
  // крыльцо со ступеньками и навесом, двухскатную тёсаную крышу, каменную трубу
  // =========================================================================
  function createLogCabin(x, z) {
    const cabin = new THREE.Group();
    cabin.position.set(x, 0, z);

    // Материалы
    const stoneTex = T.getStoneTexture();
    stoneTex.repeat.set(2, 0.5);
    const stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.9,
      metalness: 0.1
    });

    const logTex = T.getLogTexture();
    logTex.repeat.set(1, 4);
    const logMat = new THREE.MeshStandardMaterial({
      map: logTex,
      roughness: 0.85,
      metalness: 0.05
    });

    const woodTex = T.getWoodTexture();
    woodTex.repeat.set(2, 2);
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.8,
      metalness: 0.05
    });

    const roofTex = T.getCorrugatedTexture();
    roofTex.repeat.set(4, 2);
    const roofMat = new THREE.MeshStandardMaterial({
      map: roofTex,
      roughness: 0.6,
      metalness: 0.3,
      color: 0x4a3728
    });

    // 1.1 Каменный фундамент (цоколь)
    const foundationGeom = new THREE.BoxGeometry(6.4, 0.5, 5.4);
    const foundation = new THREE.Mesh(foundationGeom, stoneMat);
    foundation.position.set(0, 0.25, 0);
    cabin.add(foundation);

    // 1.2 Сруб из брёвен (стены с угловыми врубками "в чашу")
    const logRadius = 0.18;
    const logDiameter = logRadius * 2;
    const wallHeightLogs = 10;
    const width = 6.0;
    const depth = 5.0;

    // Продольные брёвна (по X)
    for (let i = 0; i < wallHeightLogs; i++) {
      const y = 0.5 + i * (logDiameter * 0.85) + logRadius;

      // Задняя стена
      const logBack = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, width + 0.6, 10), logMat);
      logBack.rotation.z = Math.PI / 2;
      logBack.position.set(0, y, -depth / 2);
      cabin.add(logBack);

      // Передняя стена (с вырезом под дверь в центре)
      if (i > 6) {
        // Верхние брёвна над дверью
        const logFront = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, width + 0.6, 10), logMat);
        logFront.rotation.z = Math.PI / 2;
        logFront.position.set(0, y, depth / 2);
        cabin.add(logFront);
      } else {
        // Брёвна по бокам от двери
        const leftW = (width - 1.4) / 2;
        const logFL = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, leftW + 0.3, 10), logMat);
        logFL.rotation.z = Math.PI / 2;
        logFL.position.set(-width / 2 + leftW / 2, y, depth / 2);
        cabin.add(logFL);

        const logFR = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, leftW + 0.3, 10), logMat);
        logFR.rotation.z = Math.PI / 2;
        logFR.position.set(width / 2 - leftW / 2, y, depth / 2);
        cabin.add(logFR);
      }
    }

    // Поперечные брёвна (по Z)
    for (let i = 0; i < wallHeightLogs; i++) {
      const y = 0.5 + i * (logDiameter * 0.85) + logRadius + logRadius * 0.85;

      // Левая стена
      const logLeft = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, depth + 0.6, 10), logMat);
      logLeft.rotation.x = Math.PI / 2;
      logLeft.position.set(-width / 2, y, 0);
      cabin.add(logLeft);

      // Правая стена
      const logRight = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, depth + 0.6, 10), logMat);
      logRight.rotation.x = Math.PI / 2;
      logRight.position.set(width / 2, y, 0);
      cabin.add(logRight);
    }

    // 1.3 Фронтоны крыши (деревянные треугольники по бокам)
    const gableHeight = 1.6;
    const gableGeom = new THREE.BufferGeometry();
    // Треугольник фронтона
    const vertices = new Float32Array([
      // Передний фронтон
      -width / 2, 0.5 + wallHeightLogs * (logDiameter * 0.85), depth / 2,
       width / 2, 0.5 + wallHeightLogs * (logDiameter * 0.85), depth / 2,
       0,         0.5 + wallHeightLogs * (logDiameter * 0.85) + gableHeight, depth / 2,
      // Задний фронтон
       width / 2, 0.5 + wallHeightLogs * (logDiameter * 0.85), -depth / 2,
      -width / 2, 0.5 + wallHeightLogs * (logDiameter * 0.85), -depth / 2,
       0,         0.5 + wallHeightLogs * (logDiameter * 0.85) + gableHeight, -depth / 2
    ]);
    gableGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    gableGeom.computeVertexNormals();
    const gableMesh = new THREE.Mesh(gableGeom, woodMat);
    cabin.add(gableMesh);

    // 1.4 Двухскатная крыша (2 наклонных ската)
    const roofSlopeLen = Math.hypot(width / 2 + 0.5, gableHeight) + 0.3;
    const roofSlopeAngle = Math.atan2(gableHeight, width / 2);

    // Левый скат
    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(roofSlopeLen, 0.12, depth + 1.2), roofMat);
    roofLeft.rotation.z = roofSlopeAngle;
    roofLeft.position.set(-(width / 4 + 0.2), 0.5 + wallHeightLogs * (logDiameter * 0.85) + gableHeight / 2, 0);
    cabin.add(roofLeft);

    // Правый скат
    const roofRight = new THREE.Mesh(new THREE.BoxGeometry(roofSlopeLen, 0.12, depth + 1.2), roofMat);
    roofRight.rotation.z = -roofSlopeAngle;
    roofRight.position.set((width / 4 + 0.2), 0.5 + wallHeightLogs * (logDiameter * 0.85) + gableHeight / 2, 0);
    cabin.add(roofRight);

    // Конёк крыши
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, depth + 1.3), woodMat);
    ridge.position.set(0, 0.5 + wallHeightLogs * (logDiameter * 0.85) + gableHeight + 0.05, 0);
    cabin.add(ridge);

    // 1.5 Крыльцо перед входом
    // Настил крыльца
    const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.8), woodMat);
    porchDeck.position.set(0, 0.2, depth / 2 + 0.9);
    cabin.add(porchDeck);

    // Ступенька крыльца
    const porchStep = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 0.6), woodMat);
    porchStep.position.set(0, 0.09, depth / 2 + 1.8 + 0.3);
    cabin.add(porchStep);

    // Столбы крыльца
    const postMat = woodMat;
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), postMat);
    postL.position.set(-1.0, 1.3, depth / 2 + 1.6);
    cabin.add(postL);

    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), postMat);
    postR.position.set(1.0, 1.3, depth / 2 + 1.6);
    cabin.add(postR);

    // Навес над крыльцом
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 2.0), roofMat);
    porchRoof.rotation.x = 0.22; // Небольшой уклон вперёд
    porchRoof.position.set(0, 2.45, depth / 2 + 0.9);
    cabin.add(porchRoof);

    // 1.6 Каменная печная труба
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), stoneMat);
    chimney.position.set(width / 2 - 0.7, 2.1, -depth / 4);
    cabin.add(chimney);

    // 1.7 Дверь в избу (приоткрыта)
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.08), woodMat);
    door.position.set(0.15, 1.3, depth / 2 - 0.15);
    door.rotation.y = -0.35; // Приоткрыта внутрь
    cabin.add(door);

    enableShadows(cabin);
    return cabin;
  }

  // =========================================================================
  // 2. ВОЕННЫЙ БЛОКПОСТ С НАБЛЮДАТЕЛЬНОЙ ВЫШКОЙ
  // Включает: высокую 4-опорную деревянную вышку (6.5м) с будкой часового,
  // защитные брустверы из мешков с песком, армейские бочки и ящики
  // =========================================================================
  function createMilitaryPost(x, z) {
    const post = new THREE.Group();
    post.position.set(x, 0, z);

    const woodMat = new THREE.MeshStandardMaterial({
      map: T.getWoodTexture(),
      roughness: 0.85
    });

    const sandbagMat = new THREE.MeshStandardMaterial({
      map: T.getSandbagTexture(),
      roughness: 0.95
    });

    const rustMat = new THREE.MeshStandardMaterial({
      map: T.getRustTexture(),
      roughness: 0.7,
      metalness: 0.4
    });

    const roofMat = new THREE.MeshStandardMaterial({
      map: T.getCorrugatedTexture(),
      roughness: 0.6,
      metalness: 0.4,
      color: 0x3e4a3d // Защитный зелёный цвет
    });

    // 2.1 Опоры вышки (наклонные столбы 6.5м)
    const towerH = 5.2;
    const baseSpan = 3.6;
    const topSpan = 2.6;

    const legGeom = new THREE.CylinderGeometry(0.12, 0.14, towerH, 8);
    const legPositions = [
      [-baseSpan / 2, -baseSpan / 2, -topSpan / 2, -topSpan / 2],
      [ baseSpan / 2, -baseSpan / 2,  topSpan / 2, -topSpan / 2],
      [-baseSpan / 2,  baseSpan / 2, -topSpan / 2,  topSpan / 2],
      [ baseSpan / 2,  baseSpan / 2,  topSpan / 2,  topSpan / 2]
    ];

    legPositions.forEach(([bx, bz, tx, tz]) => {
      const leg = new THREE.Mesh(legGeom, woodMat);
      leg.position.set((bx + tx) / 2, towerH / 2, (bz + tz) / 2);
      leg.lookAt(tx, towerH, tz);
      leg.rotateX(Math.PI / 2);
      post.add(leg);
    });

    // Поперечные балки и раскосы
    for (let h = 1.4; h < towerH; h += 1.8) {
      const t = h / towerH;
      const curSpan = baseSpan * (1 - t) + topSpan * t;
      const bGeom = new THREE.BoxGeometry(curSpan, 0.1, 0.1);
      // Север/Юг
      const b1 = new THREE.Mesh(bGeom, woodMat);
      b1.position.set(0, h, curSpan / 2);
      post.add(b1);
      const b2 = new THREE.Mesh(bGeom, woodMat);
      b2.position.set(0, h, -curSpan / 2);
      post.add(b2);
      // Запад/Восток
      const b3Geom = new THREE.BoxGeometry(0.1, 0.1, curSpan);
      const b3 = new THREE.Mesh(b3Geom, woodMat);
      b3.position.set(curSpan / 2, h, 0);
      post.add(b3);
      const b4 = new THREE.Mesh(b3Geom, woodMat);
      b4.position.set(-curSpan / 2, h, 0);
      post.add(b4);
    }

    // 2.2 Настил площадки часового
    const deck = new THREE.Mesh(new THREE.BoxGeometry(topSpan + 0.6, 0.15, topSpan + 0.6), woodMat);
    deck.position.set(0, towerH, 0);
    post.add(deck);

    // Перила площадки
    const railMat = woodMat;
    const railHeight = 1.1;
    const rGeomH = new THREE.BoxGeometry(topSpan + 0.6, 0.08, 0.08);
    const rGeomV = new THREE.BoxGeometry(0.08, 0.08, topSpan + 0.6);

    const rNorth = new THREE.Mesh(rGeomH, railMat);
    rNorth.position.set(0, towerH + railHeight, -(topSpan + 0.6) / 2);
    post.add(rNorth);

    const rSouth = new THREE.Mesh(rGeomH, railMat);
    rSouth.position.set(0, towerH + railHeight, (topSpan + 0.6) / 2);
    post.add(rSouth);

    const rEast = new THREE.Mesh(rGeomV, railMat);
    rEast.position.set((topSpan + 0.6) / 2, towerH + railHeight, 0);
    post.add(rEast);

    const rWest = new THREE.Mesh(rGeomV, railMat);
    rWest.position.set(-(topSpan + 0.6) / 2, towerH + railHeight, 0);
    post.add(rWest);

    // Стойки перил
    [-1, 1].forEach(sx => {
      [-1, 1].forEach(sz => {
        const postPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, railHeight, 6), railMat);
        postPillar.position.set(sx * (topSpan + 0.5) / 2, towerH + railHeight / 2, sz * (topSpan + 0.5) / 2);
        post.add(postPillar);
      });
    });

    // 2.3 Крыша вышки на 4 стойках
    const roofPillars = [
      [-topSpan / 2, -topSpan / 2],
      [ topSpan / 2, -topSpan / 2],
      [-topSpan / 2,  topSpan / 2],
      [ topSpan / 2,  topSpan / 2]
    ];
    roofPillars.forEach(([px, pz]) => {
      const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), railMat);
      rp.position.set(px, towerH + 1.1, pz);
      post.add(rp);
    });

    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(topSpan * 0.9, 0.9, 4), roofMat);
    towerRoof.position.set(0, towerH + 2.5, 0);
    towerRoof.rotation.y = Math.PI / 4;
    post.add(towerRoof);

    // 2.4 Лестница на вышку
    const ladderRails = new THREE.Mesh(new THREE.BoxGeometry(0.06, towerH * 1.05, 0.08), woodMat);
    ladderRails.position.set(baseSpan / 2 + 0.2, towerH / 2, 0);
    post.add(ladderRails);

    // 2.5 Брустверы из мешков с песком (вокруг основания)
    function createSandbagWall(wx, wz, rotY, length) {
      const group = new THREE.Group();
      group.position.set(wx, 0, wz);
      group.rotation.y = rotY;

      const bagGeom = new THREE.BoxGeometry(0.7, 0.22, 0.38);
      const rows = 4;
      const count = Math.floor(length / 0.65);

      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * 0.3;
        for (let i = 0; i < count; i++) {
          const bag = new THREE.Mesh(bagGeom, sandbagMat);
          bag.position.set(i * 0.65 - (length / 2) + offset, 0.11 + r * 0.2, 0);
          bag.rotation.y = (Math.random() - 0.5) * 0.1;
          group.add(bag);
        }
      }
      return group;
    }

    // Линия мешков спереди и сбоку
    post.add(createSandbagWall(0, 3.2, 0, 4.2));
    post.add(createSandbagWall(-2.8, 1.2, Math.PI / 2, 3.5));

    // 2.6 Армейские ящики и бочки
    const crateMat = woodMat;
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat);
    crate1.position.set(-1.8, 0.4, 2.2);
    post.add(crate1);

    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), crateMat);
    crate2.position.set(-1.8, 1.0, 2.2);
    crate2.rotation.y = 0.2;
    post.add(crate2);

    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 12), rustMat);
    barrel1.position.set(2.2, 0.5, 2.0);
    post.add(barrel1);

    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 12), rustMat);
    barrel2.position.set(2.8, 0.5, 2.4);
    post.add(barrel2);

    enableShadows(post);
    return post;
  }

  // =========================================================================
  // 3. ЗАБРОШЕННЫЙ РАЗРУШЕННЫЙ ДОМ
  // Полуразрушенные кирпичные стены, обрушенные стропила, битый кирпич
  // =========================================================================
  function createRuinedHouse(x, z) {
    const ruin = new THREE.Group();
    ruin.position.set(x, 0, z);

    const brickMat = new THREE.MeshStandardMaterial({
      map: T.getBrickTexture(),
      roughness: 0.95
    });

    const beamMat = new THREE.MeshStandardMaterial({
      map: T.getWoodTexture(),
      roughness: 0.9,
      color: 0x3d2b1f // Обугленное старое дерево
    });

    // 3.1 Уцелевшая высокая стена с пустыми оконными проёмами
    const mainWall = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.2, 0.4), brickMat);
    mainWall.position.set(0, 1.6, -2.5);
    ruin.add(mainWall);

    // 3.2 Полуразрушенные боковые стены с неровным сколом
    const leftWallGeom = new THREE.BufferGeometry();
    const lVerts = new Float32Array([
      -2.5, 0, -2.5,   -2.5, 3.2, -2.5,   -2.5, 0, 1.8,
      -2.5, 3.2, -2.5,  -2.5, 1.4, 0.0,    -2.5, 0, 1.8
    ]);
    leftWallGeom.setAttribute('position', new THREE.BufferAttribute(lVerts, 3));
    leftWallGeom.computeVertexNormals();
    const leftWall = new THREE.Mesh(leftWallGeom, brickMat);
    ruin.add(leftWall);

    // Правая стена (почти полностью разрушена, остался только остов 1м)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 3.5), brickMat);
    rightWall.position.set(2.5, 0.6, -1.0);
    ruin.add(rightWall);

    // 3.3 Обрушившиеся деревянные стропильные балки (лежат под наклоном)
    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4.8), beamMat);
    beam1.rotation.set(0.45, 0.2, 0.3);
    beam1.position.set(-0.6, 1.5, -0.8);
    ruin.add(beam1);

    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 3.6), beamMat);
    beam2.rotation.set(-0.35, 0.4, -0.2);
    beam2.position.set(0.8, 1.1, -1.2);
    ruin.add(beam2);

    // 3.4 Завалы битого кирпича на полу
    for (let i = 0; i < 18; i++) {
      const rubble = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 + Math.random() * 0.4, 0.2 + Math.random() * 0.3, 0.3 + Math.random() * 0.4),
        brickMat
      );
      rubble.position.set((Math.random() - 0.5) * 4.0, 0.15, (Math.random() - 0.5) * 3.5);
      rubble.rotation.set(Math.random(), Math.random(), Math.random());
      ruin.add(rubble);
    }

    enableShadows(ruin);
    return ruin;
  }

  // =========================================================================
  // 4. БУНКЕР ВЫЖИВШИХ (ВХОДНОЙ ПОРТАЛ)
  // Железобетонный козырёк, массивная гермодверь со штурвалом,
  // вентиляционная труба с фильтром и радиомачта
  // =========================================================================
  function createBunker(x, z) {
    const bunker = new THREE.Group();
    bunker.position.set(x, 0, z);

    const concreteMat = new THREE.MeshStandardMaterial({
      map: T.getStoneTexture(),
      roughness: 0.9,
      color: 0x64748b // Монолитный серый бетон
    });

    const steelMat = new THREE.MeshStandardMaterial({
      map: T.getRustTexture(),
      roughness: 0.5,
      metalness: 0.7,
      color: 0x94a3b8 // Оружейная сталь
    });

    const yellowHatchMat = new THREE.MeshStandardMaterial({
      map: T.getRustTexture(),
      roughness: 0.6,
      metalness: 0.5,
      color: 0xd97706 // Предупреждающий жёлтый цвет
    });

    // 4.1 Земляная насыпь (холм укрытия сзади портала)
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      concreteMat
    );
    mound.scale.set(1.2, 0.75, 1.2);
    mound.position.set(0, 0, -2.5);
    bunker.add(mound);

    // 4.2 Железобетонный портал входа
    const portalBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 1.2), concreteMat);
    portalBack.position.set(0, 1.4, 0);
    bunker.add(portalBack);

    // Козырёк портала
    const overhang = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.4, 1.8), concreteMat);
    overhang.position.set(0, 2.8, 0.5);
    bunker.add(overhang);

    // Подпорные стены по бокам
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.6, 2.2), concreteMat);
    wingL.position.set(-2.0, 1.3, 0.8);
    wingL.rotation.y = 0.25;
    bunker.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.6, 2.2), concreteMat);
    wingR.position.set(2.0, 1.3, 0.8);
    wingR.rotation.y = -0.25;
    bunker.add(wingR);

    // 4.3 Массивная стальная гермодверь
    const blastDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.18), yellowHatchMat);
    blastDoor.position.set(0, 1.2, 0.55);
    bunker.add(blastDoor);

    // Круглый запорный штурвал на двери
    const handwheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16), steelMat);
    handwheel.position.set(0.4, 1.2, 0.67);
    bunker.add(handwheel);

    // 4.4 Вентиляционная грибовидная шахта
    const ventPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 10), steelMat);
    ventPipe.position.set(-1.8, 2.2, -1.8);
    bunker.add(ventPipe);

    const ventCap = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.25, 0.35, 10), steelMat);
    ventCap.position.set(-1.8, 3.3, -1.8);
    bunker.add(ventCap);

    // 4.5 Радиомачта с антенной
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 5.5, 6), steelMat);
    mast.position.set(1.6, 3.8, -2.2);
    bunker.add(mast);

    enableShadows(bunker);
    return bunker;
  }

  // Радиусы коллизий зданий (чтобы игрок и зомби не проходили сквозь стены)
  const colliders = [
    { name: 'Сруб', x: -8, z: -8, radius: 3.2 },
    { name: 'Блокпост', x: 8, z: -8, radius: 2.8 },
    { name: 'Руины', x: -8, z: 8, radius: 2.9 },
    { name: 'Бункер', x: 8, z: 8, radius: 3.0 }
  ];

  function checkCollision(px, pz, radius) {
    for (let c of colliders) {
      const dist = Math.hypot(px - c.x, pz - c.z);
      if (dist < c.radius + radius) {
        const angle = Math.atan2(pz - c.z, px - c.x);
        return {
          collided: true,
          pushX: c.x + Math.cos(angle) * (c.radius + radius),
          pushZ: c.z + Math.sin(angle) * (c.radius + radius),
          name: c.name
        };
      }
    }
    return { collided: false };
  }

  function getBuildingList() {
    return [
      { id: 'cabin', name: '🏕️ Сруб', x: -8, z: -8, desc: 'Бревенчатая изба с крыльцом и камином' },
      { id: 'post', name: '🎖️ Блокпост', x: 8, z: -8, desc: 'Наблюдательная вышка и бруствер' },
      { id: 'ruin', name: '🏚️ Руины', x: -8, z: 8, desc: 'Заброшенный кирпичный дом' },
      { id: 'bunker', name: '🚪 Бункер', x: 8, z: 8, desc: 'Железобетонный вход с гермодверью' }
    ];
  }

  return {
    createLogCabin,
    createMilitaryPost,
    createRuinedHouse,
    createBunker,
    checkCollision,
    getBuildingList
  };
})();
