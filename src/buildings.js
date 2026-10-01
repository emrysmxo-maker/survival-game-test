// Модуль 3D-построек и укрытий для Survival Game Test (Полигон 3D: 9 Моделей)
// Все 9 моделей построек созданы из детальной процедурной геометрии с PBR-текстурами.
// Каждая постройка отбрасывает честные динамические тени от солнца (castShadow = true, receiveShadow = true).
// Человек и боевой режим убраны — полигон полностью сфокусирован на архитектуре, разрушениях и исследовании.

window.Buildings = (function () {
  const buildingList = [];

  function setShadow(obj) {
    obj.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }

  // =========================================================================
  // 1. ОХОТНИЧЬЯ БРЕВЕНЧАТАЯ ИЗБА (Log Cabin)
  // Размер: 6.5м x 5.5м x 4.2м
  // Каменный фундамент, сруб с перерубами, крыльцо с навесом, тёсаная крыша, печь
  // =========================================================================
  function createLogCabin(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const logTex = Textures.createLogBark();
    const woodTex = Textures.createWoodPlanks();
    const shingleTex = Textures.createRoofShingles();
    const stoneTex = Textures.createStoneBricks();

    const logMat = new THREE.MeshStandardMaterial({ map: logTex, roughness: 0.85 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ map: shingleTex, roughness: 0.65 });
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 });

    // Фундамент
    const found = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.45, 5.4), stoneMat);
    found.position.set(0, 0.22, 0);
    group.add(found);

    // Сруб из брёвен
    const logRadius = 0.18;
    const logDiam = logRadius * 2;
    const wallLogs = 9;
    const w = 6.0, d = 5.0;

    for (let i = 0; i < wallLogs; i++) {
      const y = 0.45 + i * (logDiam * 0.88) + logRadius;

      // Задняя стена
      const lb = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, w + 0.6, 8), logMat);
      lb.rotation.z = Math.PI / 2;
      lb.position.set(0, y, -d / 2);
      group.add(lb);

      // Передняя стена
      if (i > 5) {
        const lf = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, w + 0.6, 8), logMat);
        lf.rotation.z = Math.PI / 2;
        lf.position.set(0, y, d / 2);
        group.add(lf);
      } else {
        const lw = (w - 1.4) / 2;
        const lfl = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, lw + 0.3, 8), logMat);
        lfl.rotation.z = Math.PI / 2;
        lfl.position.set(-w / 2 + lw / 2, y, d / 2);
        group.add(lfl);

        const lfr = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, lw + 0.3, 8), logMat);
        lfr.rotation.z = Math.PI / 2;
        lfr.position.set(w / 2 - lw / 2, y, d / 2);
        group.add(lfr);
      }

      // Боковые стены
      const ySide = y + logRadius * 0.88;
      const ll = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, d + 0.6, 8), logMat);
      ll.rotation.x = Math.PI / 2;
      ll.position.set(-w / 2, ySide, 0);
      group.add(ll);

      const lr = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, d + 0.6, 8), logMat);
      lr.rotation.x = Math.PI / 2;
      lr.position.set(w / 2, ySide, 0);
      group.add(lr);
    }

    // Двухскатная крыша
    const gableH = 1.6;
    const slopeLen = Math.hypot(w / 2 + 0.4, gableH) + 0.3;
    const slopeAng = Math.atan2(gableH, w / 2);
    const roofY = 0.45 + wallLogs * (logDiam * 0.88) + gableH / 2;

    const rLeft = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.12, d + 1.2), roofMat);
    rLeft.rotation.z = slopeAng;
    rLeft.position.set(-(w / 4 + 0.2), roofY, 0);
    group.add(rLeft);

    const rRight = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.12, d + 1.2), roofMat);
    rRight.rotation.z = -slopeAng;
    rRight.position.set((w / 4 + 0.2), roofY, 0);
    group.add(rRight);

    // Конёк
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, d + 1.3), woodMat);
    ridge.position.set(0, 0.45 + wallLogs * (logDiam * 0.88) + gableH + 0.05, 0);
    group.add(ridge);

    // Крыльцо и ступени
    const porch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 1.8), woodMat);
    porch.position.set(0, 0.15, d / 2 + 0.9);
    group.add(porch);

    const step = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.6), woodMat);
    step.position.set(0, 0.075, d / 2 + 1.8 + 0.3);
    group.add(step);

    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), woodMat);
    postL.position.set(-1.0, 1.25, d / 2 + 1.6);
    group.add(postL);

    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), woodMat);
    postR.position.set(1.0, 1.25, d / 2 + 1.6);
    group.add(postR);

    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 2.0), roofMat);
    porchRoof.rotation.x = 0.22;
    porchRoof.position.set(0, 2.35, d / 2 + 0.9);
    group.add(porchRoof);

    // Каменная печная труба
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.2, 0.75), stoneMat);
    chimney.position.set(w / 2 - 0.7, 2.1, -d / 4);
    group.add(chimney);

    // Приоткрытая дверь
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.08), woodMat);
    door.position.set(0.15, 1.3, d / 2 - 0.15);
    door.rotation.y = -0.35;
    group.add(door);

    setShadow(group);
    buildingList.push({ id: 'cabin', name: '🏕️ Сруб', desc: 'Бревенчатая изба с крыльцом и камином', x, z, group, camY: 2.2, dist: 11.0 });
    return group;
  }

  // =========================================================================
  // 2. СГОРЕВШИЙ ЛЕСНОЙ КОТТЕДЖ (Burnt Forest Cottage - Пожар)
  // Размер: 7.2м x 6.2м x 4.8м
  // Обугленный остов стен, уцелевший кирпичный камин и дымоход, обвалившиеся перекрытия
  // =========================================================================
  function createBurntCottage(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const charredTex = Textures.createCharredWood();
    const brickTex = Textures.createRedBrick();
    const stoneTex = Textures.createStoneBricks();
    const metalTex = Textures.createCorrugatedMetal();

    const charredMat = new THREE.MeshStandardMaterial({ map: charredTex, roughness: 0.95, color: 0x222222 });
    const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 });
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 });
    const rustedMetalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.75, metalness: 0.4, color: 0x3a3028 });

    // Каменный фундамент со следами копоти
    const found = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 6.2), stoneMat);
    found.position.set(0, 0.2, 0);
    group.add(found);

    // Обугленный пол первого этажа
    const floor = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.08, 5.8), charredMat);
    floor.position.set(0, 0.44, 0);
    group.add(floor);

    // Массивный уцелевший кирпичный камин и высокий дымоход
    const hearthBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.4), brickMat);
    hearthBase.position.set(-1.8, 1.15, -1.8);
    group.add(hearthBase);

    // Очаг камина (углубление)
    const hearthHole = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.8), charredMat);
    hearthHole.position.set(-1.8, 1.0, -1.3);
    group.add(hearthHole);

    // Высокая кирпичная труба
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.85, 5.2, 0.85), brickMat);
    chimney.position.set(-1.8, 3.2, -1.8);
    group.add(chimney);

    // Обугленные вертикальные стойки стен
    const postCoords = [
      [-3.2, -2.8, 3.2], [-1.0, -2.8, 2.6], [1.0, -2.8, 3.2], [3.2, -2.8, 2.4],
      [-3.2, 0.0, 2.8],  [3.2, 0.0, 1.8],
      [-3.2, 2.8, 3.0],  [-1.0, 2.8, 1.5],  [1.0, 2.8, 2.8],  [3.2, 2.8, 3.2]
    ];
    postCoords.forEach(([px, pz, ph]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, ph, 0.22), charredMat);
      post.position.set(px, 0.4 + ph / 2, pz);
      if (ph < 2.5) {
        post.rotation.z = (Math.random() - 0.5) * 0.15;
        post.rotation.x = (Math.random() - 0.5) * 0.15;
      }
      group.add(post);
    });

    // Обугленные верхние обвязочные балки
    const bBack = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.2, 0.2), charredMat);
    bBack.position.set(0, 3.5, -2.8);
    group.add(bBack);

    const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 5.8), charredMat);
    bLeft.position.set(-3.2, 3.5, 0);
    group.add(bLeft);

    // Обрушившиеся балки перекрытия
    const fallenBeam1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4.5), charredMat);
    fallenBeam1.rotation.set(0.45, 0.2, 0.35);
    fallenBeam1.position.set(0.8, 1.4, 0.2);
    group.add(fallenBeam1);

    const fallenBeam2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 3.8), charredMat);
    fallenBeam2.rotation.set(-0.35, 0.4, -0.25);
    fallenBeam2.position.set(-0.6, 1.2, 1.0);
    group.add(fallenBeam2);

    // Обгоревшие листы металлической кровли
    const sheet1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 1.8), rustedMetalMat);
    sheet1.rotation.set(0.65, 0.1, -0.3);
    sheet1.position.set(1.8, 2.2, -1.2);
    group.add(sheet1);

    const sheet2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.5), rustedMetalMat);
    sheet2.rotation.set(-0.2, 0.5, 0.8);
    sheet2.position.set(-1.2, 0.6, 1.8);
    group.add(sheet2);

    // Веранда
    const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 1.6), charredMat);
    porchDeck.position.set(0.6, 0.2, 3.6);
    group.add(porchDeck);

    // Зола и угли
    for (let k = 0; k < 12; k++) {
      const ash = new THREE.Mesh(
        new THREE.BoxGeometry(0.6 + Math.random() * 0.8, 0.15, 0.6 + Math.random() * 0.8),
        charredMat
      );
      ash.position.set((Math.random() - 0.5) * 5.0, 0.5, (Math.random() - 0.5) * 4.2);
      ash.rotation.y = Math.random() * Math.PI;
      group.add(ash);
    }

    setShadow(group);
    buildingList.push({ id: 'burnt', name: '🔥 Пепелище', desc: 'Сгоревший лесной коттедж с уцелевшим кирпичным камином', x, z, group, camY: 2.5, dist: 13.0 });
    return group;
  }

  // =========================================================================
  // 3. ВОЕННЫЙ БЛОКПОСТ С ВЫШКОЙ (Military Guard Post)
  // Размер: 7.0м x 7.0м x 6.5м
  // Вышка часового 6.5м, брустверы из мешков с песком, армейские ящики и бочки
  // =========================================================================
  function createMilitaryPost(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const woodTex = Textures.createWoodPlanks();
    const sandbagTex = Textures.createSandbag();
    const camoTex = Textures.createCamoTarp();
    const metalTex = Textures.createCorrugatedMetal();

    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
    const sandbagMat = new THREE.MeshStandardMaterial({ map: sandbagTex, roughness: 0.95 });
    const camoMat = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.7 });
    const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.6, metalness: 0.4 });

    const towerH = 5.2;
    const baseSpan = 3.6;
    const topSpan = 2.6;

    // 4 наклонные опоры вышки
    const legGeom = new THREE.CylinderGeometry(0.12, 0.14, towerH, 8);
    const legPos = [
      [-baseSpan / 2, -baseSpan / 2, -topSpan / 2, -topSpan / 2],
      [ baseSpan / 2, -baseSpan / 2,  topSpan / 2, -topSpan / 2],
      [-baseSpan / 2,  baseSpan / 2, -topSpan / 2,  topSpan / 2],
      [ baseSpan / 2,  baseSpan / 2,  topSpan / 2,  topSpan / 2]
    ];

    legPos.forEach(([bx, bz, tx, tz]) => {
      const leg = new THREE.Mesh(legGeom, woodMat);
      leg.position.set((bx + tx) / 2, towerH / 2, (bz + tz) / 2);
      leg.lookAt(tx, towerH, tz);
      leg.rotateX(Math.PI / 2);
      group.add(leg);
    });

    // Поперечные раскосы
    for (let h = 1.4; h < towerH; h += 1.8) {
      const t = h / towerH;
      const span = baseSpan * (1 - t) + topSpan * t;
      const bGeom = new THREE.BoxGeometry(span, 0.1, 0.1);
      const b1 = new THREE.Mesh(bGeom, woodMat);
      b1.position.set(0, h, span / 2);
      group.add(b1);
      const b2 = new THREE.Mesh(bGeom, woodMat);
      b2.position.set(0, h, -span / 2);
      group.add(b2);
    }

    // Настил часового
    const deck = new THREE.Mesh(new THREE.BoxGeometry(topSpan + 0.6, 0.15, topSpan + 0.6), woodMat);
    deck.position.set(0, towerH, 0);
    group.add(deck);

    // Перила
    const railH = 1.1;
    const rGeomH = new THREE.BoxGeometry(topSpan + 0.6, 0.08, 0.08);
    const rNorth = new THREE.Mesh(rGeomH, woodMat);
    rNorth.position.set(0, towerH + railH, -(topSpan + 0.6) / 2);
    group.add(rNorth);
    const rSouth = new THREE.Mesh(rGeomH, woodMat);
    rSouth.position.set(0, towerH + railH, (topSpan + 0.6) / 2);
    group.add(rSouth);

    // Крыша будки часового
    const roofPillars = [
      [-topSpan / 2, -topSpan / 2], [ topSpan / 2, -topSpan / 2],
      [-topSpan / 2,  topSpan / 2], [ topSpan / 2,  topSpan / 2]
    ];
    roofPillars.forEach(([px, pz]) => {
      const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), woodMat);
      rp.position.set(px, towerH + 1.1, pz);
      group.add(rp);
    });

    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(topSpan * 0.9, 0.9, 4), camoMat);
    towerRoof.position.set(0, towerH + 2.5, 0);
    towerRoof.rotation.y = Math.PI / 4;
    group.add(towerRoof);

    // Лестница
    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.08, towerH * 1.05, 0.5), woodMat);
    ladder.position.set(baseSpan / 2 + 0.15, towerH / 2, 0);
    group.add(ladder);

    // Брустверы из мешков с песком
    function makeSandbags(ox, oz, rotY, len) {
      const bg = new THREE.Group();
      bg.position.set(ox, 0, oz);
      bg.rotation.y = rotY;
      const bGeom = new THREE.BoxGeometry(0.7, 0.22, 0.38);
      const rows = 4;
      const count = Math.floor(len / 0.65);
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * 0.3;
        for (let i = 0; i < count; i++) {
          const b = new THREE.Mesh(bGeom, sandbagMat);
          b.position.set(i * 0.65 - len / 2 + off, 0.11 + r * 0.2, 0);
          bg.add(b);
        }
      }
      return bg;
    }

    group.add(makeSandbags(0, 3.2, 0, 4.2));
    group.add(makeSandbags(-2.8, 1.2, Math.PI / 2, 3.5));

    // Армейские ящики и бочки
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), woodMat);
    crate1.position.set(-1.8, 0.4, 2.2);
    group.add(crate1);

    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 12), metalMat);
    barrel1.position.set(2.2, 0.5, 2.0);
    group.add(barrel1);

    setShadow(group);
    buildingList.push({ id: 'post', name: '🎖️ Блокпост', desc: 'Военная наблюдательная вышка 6.5м и бруствер', x, z, group, camY: 3.5, dist: 14.0 });
    return group;
  }

  // =========================================================================
  // 4. ЗАБРОШЕННЫЙ ПОЛУРАЗРУШЕННЫЙ ДОМ (Abandoned Brick Ruin)
  // Размер: 6.0м x 5.5м x 3.5м
  // Разрушенная кирпичная кладка, сломанные стропила, битый кирпич
  // =========================================================================
  function createRuinedHouse(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const brickTex = Textures.createStoneBricks();
    const woodTex = Textures.createWoodPlanks();
    const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.95 });
    const beamMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9, color: 0x4a3b2c });

    // Уцелевшая задняя кирпичная стена
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.2, 0.4), brickMat);
    backWall.position.set(0, 1.6, -2.5);
    group.add(backWall);

    // Полуразрушенные боковые стены
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 3.5), brickMat);
    leftWall.position.set(-2.5, 1.1, -0.8);
    group.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 2.8), brickMat);
    rightWall.position.set(2.5, 0.6, -1.0);
    group.add(rightWall);

    // Обрушившиеся стропильные балки
    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4.6), beamMat);
    beam1.rotation.set(0.45, 0.2, 0.3);
    beam1.position.set(-0.6, 1.5, -0.8);
    group.add(beam1);

    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 3.6), beamMat);
    beam2.rotation.set(-0.35, 0.4, -0.2);
    beam2.position.set(0.8, 1.1, -1.2);
    group.add(beam2);

    // Завалы битого кирпича на полу
    for (let i = 0; i < 16; i++) {
      const rubble = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 + Math.random() * 0.4, 0.2 + Math.random() * 0.25, 0.3 + Math.random() * 0.4),
        brickMat
      );
      rubble.position.set((Math.random() - 0.5) * 4.0, 0.15, (Math.random() - 0.5) * 3.5);
      rubble.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rubble);
    }

    setShadow(group);
    buildingList.push({ id: 'ruin', name: '🏚️ Руины', desc: 'Заброшенный кирпичный дом со сломанными стропилами', x, z, group, camY: 2.0, dist: 12.0 });
    return group;
  }

  // =========================================================================
  // 5. ДОМ ПОСЛЕ АВИАУДАРА С ВОРОНКОЙ (Bomb Cratered House)
  // Размер: 8.5м x 7.5м x 4.6м
  // Воронка от авиабомбы во дворе, выбитый фасад, обнажённые комнаты и арматура
  // =========================================================================
  function createBombCraterHouse(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const brickTex = Textures.createRedBrick();
    const concreteTex = Textures.createConcrete();
    const woodTex = Textures.createWoodPlanks();

    const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 });
    const concreteMat = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.95 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
    const rebarMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.85, roughness: 0.3 });
    const craterDirtMat = new THREE.MeshStandardMaterial({ color: 0x1f1a14, roughness: 0.98 });

    // Воронка от авиабомбы перед домом (Z = 2.6)
    const craterRim = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.35, 8, 16), craterDirtMat);
    craterRim.rotation.x = Math.PI / 2;
    craterRim.position.set(0, 0.2, 2.6);
    group.add(craterRim);

    const craterPit = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 16, 1, true), craterDirtMat);
    craterPit.rotation.x = Math.PI;
    craterPit.position.set(0, 0.1, 2.6);
    group.add(craterPit);

    // Фундамент дома
    const foundBack = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.5, 4.0), concreteMat);
    foundBack.position.set(0, 0.25, -1.5);
    group.add(foundBack);

    // Задняя стена дома
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.8, 0.4), brickMat);
    backWall.position.set(0, 2.15, -3.3);
    group.add(backWall);

    // Левая боковая стена
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 3.6), brickMat);
    leftWall.position.set(-3.8, 1.85, -1.5);
    group.add(leftWall);

    // Правая боковая стена
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.4, 3.0), brickMat);
    rightWall.position.set(3.8, 1.45, -1.8);
    group.add(rightWall);

    // Плита межэтажного перекрытия, расколотая и повисшая под углом
    const brokenSlab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 3.2), concreteMat);
    brokenSlab.rotation.set(0.42, 0, 0.1);
    brokenSlab.position.set(-1.0, 1.4, -0.6);
    group.add(brokenSlab);

    // Торчащая изогнутая арматура из плиты
    for (let r = 0; r < 6; r++) {
      const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6), rebarMat);
      rebar.position.set(-2.5 + r * 0.8, 1.8, 0.8);
      rebar.rotation.set((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8);
      group.add(rebar);
    }

    // Уцелевшая половина крыши над задней частью дома
    const halfRoof = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.12, 2.8), woodMat);
    halfRoof.rotation.x = -0.35;
    halfRoof.position.set(0, 4.2, -2.4);
    group.add(halfRoof);

    // Торчащие изломанные стропила
    for (let k = 0; k < 5; k++) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 2.5), woodMat);
      rafter.position.set(-3.2 + k * 1.6, 3.8, -0.6);
      rafter.rotation.set(0.4, 0, (Math.random() - 0.5) * 0.2);
      group.add(rafter);
    }

    // Выброшенные взрывом глыбы бетона и кирпича вокруг воронки
    for (let b = 0; b < 14; b++) {
      const chunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.4 + Math.random() * 0.5, 0.3 + Math.random() * 0.3, 0.4 + Math.random() * 0.5),
        Math.random() > 0.5 ? concreteMat : brickMat
      );
      const ang = Math.random() * Math.PI * 2;
      const rad = 2.4 + Math.random() * 2.2;
      chunk.position.set(Math.cos(ang) * rad, 0.2, 2.6 + Math.sin(ang) * rad);
      chunk.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(chunk);
    }

    setShadow(group);
    buildingList.push({ id: 'crater', name: '💥 Авиаудар', desc: 'Дом с воронкой от бомбы, выбитым фасадом и висящими перекрытиями', x, z, group, camY: 2.2, dist: 14.0 });
    return group;
  }

  // =========================================================================
  // 6. НЕДОСТРОЕННЫЙ КАРКАСНЫЙ ДОМ (Unfinished Barnhouse - Брошенная стройка)
  // Размер: 8.0м x 6.5м x 5.0м
  // Открытый силовой каркас из стоек и стропил, строительные леса, паллеты досок
  // =========================================================================
  function createUnfinishedFramedHouse(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const woodTex = Textures.createWoodPlanks();
    const osbTex = Textures.createOSBPlank();
    const concreteTex = Textures.createConcrete();
    const tarpTex = Textures.createCamoTarp();

    const studMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65, color: 0xdeb887 });
    const osbMat = new THREE.MeshStandardMaterial({ map: osbTex, roughness: 0.8 });
    const pierMat = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.95 });
    const tarpMat = new THREE.MeshStandardMaterial({ map: tarpTex, roughness: 0.7, color: 0x1d4ed8 });

    const w = 7.6, d = 6.0, wallH = 2.8;

    // Свайный фундамент
    for (let px = -w / 2; px <= w / 2; px += w / 3) {
      for (let pz = -d / 2; pz <= d / 2; pz += d / 3) {
        const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.5, 8), pierMat);
        pier.position.set(px, 0.25, pz);
        group.add(pier);
      }
    }

    // Деревянная нижняя обвязка
    const rimX1 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.2, 0.2), studMat);
    rimX1.position.set(0, 0.6, -d / 2);
    group.add(rimX1);

    const rimX2 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.2, 0.2), studMat);
    rimX2.position.set(0, 0.6, d / 2);
    group.add(rimX2);

    const rimZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, d + 0.2), studMat);
    rimZ1.position.set(-w / 2, 0.6, 0);
    group.add(rimZ1);

    const rimZ2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, d + 0.2), studMat);
    rimZ2.position.set(w / 2, 0.6, 0);
    group.add(rimZ2);

    // Вертикальные стойки каркаса 150х50мм
    const studGeom = new THREE.BoxGeometry(0.15, wallH, 0.08);
    const studGeomSide = new THREE.BoxGeometry(0.08, wallH, 0.15);

    for (let sx = -w / 2; sx <= w / 2 + 0.01; sx += 0.8) {
      const sBack = new THREE.Mesh(studGeom, studMat);
      sBack.position.set(sx, 0.7 + wallH / 2, -d / 2);
      group.add(sBack);

      if (Math.abs(sx) > 1.2) {
        const sFront = new THREE.Mesh(studGeom, studMat);
        sFront.position.set(sx, 0.7 + wallH / 2, d / 2);
        group.add(sFront);
      }
    }

    for (let sz = -d / 2 + 0.8; sz < d / 2; sz += 0.8) {
      const sLeft = new THREE.Mesh(studGeomSide, studMat);
      sLeft.position.set(-w / 2, 0.7 + wallH / 2, sz);
      group.add(sLeft);

      const sRight = new THREE.Mesh(studGeomSide, studMat);
      sRight.position.set(w / 2, 0.7 + wallH / 2, sz);
      group.add(sRight);
    }

    // Укосины жесткости
    const braceLen = Math.hypot(1.6, wallH);
    const braceAng = Math.atan2(wallH, 1.6);
    const brace1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, braceLen, 0.12), studMat);
    brace1.rotation.z = -braceAng;
    brace1.position.set(-w / 2 + 0.8, 0.7 + wallH / 2, -d / 2);
    group.add(brace1);

    // Верхняя обвязка стен
    const topPlateX1 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.12, 0.15), studMat);
    topPlateX1.position.set(0, 0.7 + wallH + 0.06, -d / 2);
    group.add(topPlateX1);

    const topPlateX2 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.12, 0.15), studMat);
    topPlateX2.position.set(0, 0.7 + wallH + 0.06, d / 2);
    group.add(topPlateX2);

    // Стропильная система крыши
    const roofH = 1.8;
    const rafterLen = Math.hypot(w / 2, roofH) + 0.2;
    const rafterAng = Math.atan2(roofH, w / 2);

    for (let rz = -d / 2; rz <= d / 2 + 0.01; rz += 1.0) {
      const rafL = new THREE.Mesh(new THREE.BoxGeometry(rafterLen, 0.15, 0.06), studMat);
      rafL.rotation.z = rafterAng;
      rafL.position.set(-w / 4, 0.7 + wallH + roofH / 2, rz);
      group.add(rafL);

      const rafR = new THREE.Mesh(new THREE.BoxGeometry(rafterLen, 0.15, 0.06), studMat);
      rafR.rotation.z = -rafterAng;
      rafR.position.set(w / 4, 0.7 + wallH + roofH / 2, rz);
      group.add(rafR);
    }

    // Обшивка плитами OSB
    const osbPanel = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, wallH, 0.04), osbMat);
    osbPanel.position.set(-w * 0.175, 0.7 + wallH / 2, -d / 2 - 0.02);
    group.add(osbPanel);

    // Строительные леса
    const scafGroup = new THREE.Group();
    scafGroup.position.set(-w / 2 - 0.8, 0, 0);

    [-1.8, 0, 1.8].forEach(sz => {
      [-0.4, 0.4].forEach(sx => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 6), studMat);
        pole.position.set(sx, 1.9, sz);
        scafGroup.add(pole);
      });
    });

    const scafDeck = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 4.4), studMat);
    scafDeck.position.set(0, 1.9, 0);
    scafGroup.add(scafDeck);
    group.add(scafGroup);

    // Штабель пиломатериалов (доски)
    const stack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.2), studMat);
    stack.position.set(2.8, 0.4, d / 2 + 2.2);
    group.add(stack);

    // Паллет под тентом
    const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 1.0), studMat);
    pallet.position.set(-2.2, 0.075, d / 2 + 2.2);
    group.add(pallet);

    const tarpCover = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.9), tarpMat);
    tarpCover.position.set(-2.2, 0.45, d / 2 + 2.2);
    group.add(tarpCover);

    setShadow(group);
    buildingList.push({ id: 'unfinished', name: '🏗️ Стройка', desc: 'Брошенный каркасный дом со стропильной системой и лесами', x, z, group, camY: 2.5, dist: 13.0 });
    return group;
  }

  // =========================================================================
  // 7. ШАЛЕ ПОСЛЕ ТЕКТОНИЧЕСКОГО РАЗЛОМА (Earthquake-cracked Chalet)
  // Размер: 8.5м x 7.0м x 4.8м
  // Расколото землетрясением надвое: правая часть просела в расщелину и накренилась
  // =========================================================================
  function createEarthquakeChalet(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneTex = Textures.createStoneBricks();
    const woodTex = Textures.createWoodPlanks();
    const shingleTex = Textures.createRoofShingles();

    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.75 });
    const roofMat = new THREE.MeshStandardMaterial({ map: shingleTex, roughness: 0.65 });
    const fissureMat = new THREE.MeshStandardMaterial({ color: 0x181411, roughness: 0.98 });

    // Тектоническая трещина
    const fissure = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 10.0), fissureMat);
    fissure.position.set(0.4, -0.6, 0);
    fissure.rotation.y = 0.15;
    group.add(fissure);

    // Левая половина дома
    const leftHalf = new THREE.Group();
    leftHalf.position.set(-2.0, 0, 0);
    leftHalf.rotation.z = 0.06;

    const foundL = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 6.2), stoneMat);
    foundL.position.set(0, 0.3, 0);
    leftHalf.add(foundL);

    const wallL = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 6.0), woodMat);
    wallL.position.set(0, 1.8, 0);
    leftHalf.add(wallL);

    const roofL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 6.6), roofMat);
    roofL.rotation.z = 0.45;
    roofL.position.set(-0.8, 3.6, 0);
    leftHalf.add(roofL);

    group.add(leftHalf);

    // Правая половина дома (провалилась в разлом)
    const rightHalf = new THREE.Group();
    rightHalf.position.set(2.4, -0.85, 0.2);
    rightHalf.rotation.z = -0.28;
    rightHalf.rotation.x = 0.12;

    const foundR = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 6.2), stoneMat);
    foundR.position.set(0, 0.3, 0);
    rightHalf.add(foundR);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 6.0), woodMat);
    wallR.position.set(0, 1.8, 0);
    rightHalf.add(wallR);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 6.6), roofMat);
    roofR.rotation.z = -0.45;
    roofR.position.set(0.8, 3.6, 0);
    rightHalf.add(roofR);

    group.add(rightHalf);

    // Обломанные балки над разломом
    const brokenBeam1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.2), woodMat);
    brokenBeam1.rotation.set(0.2, 0.5, 0.6);
    brokenBeam1.position.set(0.3, 2.8, -1.0);
    group.add(brokenBeam1);

    const brokenBeam2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 2.8), woodMat);
    brokenBeam2.rotation.set(-0.4, 0.2, -0.5);
    brokenBeam2.position.set(0.6, 2.4, 1.2);
    group.add(brokenBeam2);

    for (let c = 0; c < 8; c++) {
      const rock = new THREE.Mesh(
        new THREE.BoxGeometry(0.4 + Math.random() * 0.4, 0.3 + Math.random() * 0.3, 0.4 + Math.random() * 0.4),
        stoneMat
      );
      rock.position.set(0.4 + (Math.random() - 0.5) * 1.2, 0.1, (Math.random() - 0.5) * 6.0);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rock);
    }

    setShadow(group);
    buildingList.push({ id: 'quake', name: '⚡ Разлом', desc: 'Шале, расколотое пополам тектоническим разломом', x, z, group, camY: 2.0, dist: 14.0 });
    return group;
  }

  // =========================================================================
  // 8. УСАДЬБА ПОСЛЕ ШТУРМА ОРДЫ (Zombie Breached Homestead)
  // Размер: 9.0м x 7.5м x 5.0м
  // Выломанные ворота частокола, расщепленные баррикады на окнах, выбитая дверь
  // =========================================================================
  function createZombieBreachedFarm(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const woodTex = Textures.createWoodPlanks();
    const logTex = Textures.createLogBark();
    const shingleTex = Textures.createRoofShingles();
    const sandbagTex = Textures.createSandbag();
    const metalTex = Textures.createCorrugatedMetal();

    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
    const logMat = new THREE.MeshStandardMaterial({ map: logTex, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ map: shingleTex, roughness: 0.7 });
    const sandbagMat = new THREE.MeshStandardMaterial({ map: sandbagTex, roughness: 0.95 });
    const barrelMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.6, metalness: 0.5 });

    // Главный дом
    const house = new THREE.Mesh(new THREE.BoxGeometry(6.6, 4.2, 5.2), logMat);
    house.position.set(0, 2.1, -1.0);
    group.add(house);

    const roofL = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 5.8), roofMat);
    roofL.rotation.z = 0.52;
    roofL.position.set(-1.8, 4.8, -1.0);
    group.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 5.8), roofMat);
    roofR.rotation.z = -0.52;
    roofR.position.set(1.8, 4.8, -1.0);
    group.add(roofR);

    // Выбитая входная дверь
    const brokenDoor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.9), woodMat);
    brokenDoor.position.set(0.2, 0.05, 1.8);
    brokenDoor.rotation.y = 0.3;
    group.add(brokenDoor);

    // Окна с выломанными досками
    const windowPlank1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.04), woodMat);
    windowPlank1.position.set(-2.0, 1.8, 1.62);
    windowPlank1.rotation.z = 0.25;
    group.add(windowPlank1);

    const brokenPlank2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.04), woodMat);
    brokenPlank2.position.set(-2.4, 1.4, 1.62);
    brokenPlank2.rotation.y = -0.4;
    group.add(brokenPlank2);

    // Наблюдательный балкон второго этажа с мешками с песком
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.15, 1.2), woodMat);
    balcony.position.set(0, 3.2, 1.8);
    group.add(balcony);

    for (let sb = 0; sb < 4; sb++) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.35), sandbagMat);
      bag.position.set(-1.0 + sb * 0.65, 3.4, 2.3);
      group.add(bag);
    }

    // Бревенчатый частокол забора вокруг двора
    const fenceH = 2.0;
    const postGeom = new THREE.CylinderGeometry(0.1, 0.1, fenceH, 6);

    for (let fx = -4.5; fx <= -1.8; fx += 0.3) {
      const p = new THREE.Mesh(postGeom, woodMat);
      p.position.set(fx, fenceH / 2, 3.6);
      p.rotation.z = (Math.random() - 0.5) * 0.1;
      group.add(p);
    }

    for (let fx = 1.8; fx <= 4.5; fx += 0.3) {
      const p = new THREE.Mesh(postGeom, woodMat);
      p.position.set(fx, fenceH / 2, 3.6);
      p.rotation.z = (Math.random() - 0.5) * 0.1;
      group.add(p);
    }

    // Снесённые ворота в центре
    const fallenGateL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.8), woodMat);
    fallenGateL.position.set(-0.8, 0.06, 3.8);
    fallenGateL.rotation.y = 0.2;
    group.add(fallenGateL);

    const fallenGateR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.8), woodMat);
    fallenGateR.position.set(0.9, 0.06, 3.9);
    fallenGateR.rotation.y = -0.3;
    group.add(fallenGateR);

    // Разорванная баррикада
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), woodMat);
    crate.position.set(-1.5, 0.4, 2.6);
    crate.rotation.y = 0.4;
    group.add(crate);

    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 10), barrelMat);
    b1.position.set(1.6, 0.45, 2.5);
    b1.rotation.z = Math.PI / 2;
    group.add(b1);

    setShadow(group);
    buildingList.push({ id: 'breached', name: '🧟 Штурм', desc: 'Усадьба со снесёнными воротами частокола и следами штурма', x, z, group, camY: 2.5, dist: 13.0 });
    return group;
  }

  // =========================================================================
  // 9. УКРЕПЛЁННЫЙ БУНКЕР ВЫЖИВШИХ (Fortified Bunker Portal)
  // Размер: 6.5м x 6.5м x 3.8м
  // Железобетонный портал, массивная стальная гермодверь со штурвалом, вентиляция
  // =========================================================================
  function createBunker(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const concreteTex = Textures.createConcrete();
    const metalTex = Textures.createCorrugatedMetal();

    const concreteMat = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.9, color: 0x64748b });
    const steelMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.45, metalness: 0.8, color: 0x94a3b8 });
    const yellowMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.55, metalness: 0.5, color: 0xd97706 });

    // Земляной холм укрытия сзади
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      concreteMat
    );
    mound.scale.set(1.2, 0.75, 1.2);
    mound.position.set(0, 0, -2.5);
    group.add(mound);

    // Железобетонный портал
    const portalBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 1.2), concreteMat);
    portalBack.position.set(0, 1.4, 0);
    group.add(portalBack);

    const overhang = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.4, 1.8), concreteMat);
    overhang.position.set(0, 2.8, 0.5);
    group.add(overhang);

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.6, 2.2), concreteMat);
    wingL.position.set(-2.0, 1.3, 0.8);
    wingL.rotation.y = 0.25;
    group.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.6, 2.2), concreteMat);
    wingR.position.set(2.0, 1.3, 0.8);
    wingR.rotation.y = -0.25;
    group.add(wingR);

    // Жёлтая стальная гермодверь
    const blastDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.18), yellowMat);
    blastDoor.position.set(0, 1.2, 0.55);
    group.add(blastDoor);

    // Запорный штурвал
    const handwheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16), steelMat);
    handwheel.position.set(0.4, 1.2, 0.67);
    group.add(handwheel);

    // Вентиляционный грибок
    const ventPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 10), steelMat);
    ventPipe.position.set(-1.8, 2.2, -1.8);
    group.add(ventPipe);

    const ventCap = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.25, 0.35, 10), steelMat);
    ventCap.position.set(-1.8, 3.3, -1.8);
    group.add(ventCap);

    // Радиомачта
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 5.5, 6), steelMat);
    mast.position.set(1.6, 3.8, -2.2);
    group.add(mast);

    setShadow(group);
    buildingList.push({ id: 'bunker', name: '🚪 Бункер', desc: 'Укреплённый железобетонный портал с гермодверью и радиомачтой', x, z, group, camY: 2.0, dist: 12.0 });
    return group;
  }

  return {
    createLogCabin,
    createBurntCottage,
    createMilitaryPost,
    createRuinedHouse,
    createBombCraterHouse,
    createUnfinishedFramedHouse,
    createEarthquakeChalet,
    createZombieBreachedFarm,
    createBunker,
    getBuildingList: () => buildingList
  };
})();
