// Модуль 3D-построек и укрытий для Survival Game Test
// Постройки создаются из реалистичной геометрии с PBR-текстурами дерева, черепицы, камня, металла и бетона.
// Все элементы отбрасывают динамические тени от солнца (castShadow = true, receiveShadow = true)
// Никаких статичных чёрных пятен под зданиями нет — тени зависят исключительно от положения солнца!

const Buildings = (function () {
  const colliders = []; // [ { minX, maxX, minZ, maxZ } ]
  const buildingList = [];

  function addBoxCollider(cx, cz, hw, hd) {
    colliders.push({
      minX: cx - hw,
      maxX: cx + hw,
      minZ: cz - hd,
      maxZ: cz + hd
    });
  }

  function setShadow(obj) {
    obj.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }

  // ==========================================
  // 1. ОХОТНИЧЬЯ БРЕВЕНЧАТАЯ ИЗБА (Log Cabin)
  // ==========================================
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
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x90b0c0, roughness: 0.2, metalness: 0.8, transparent: true, opacity: 0.6 });

    const w = 6.4, d = 5.2, h = 2.8;
    const logRadius = 0.16;
    const numLogs = Math.floor(h / (logRadius * 1.8));

    // 1.1 Каменный фундамент
    const fGeo = new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4);
    const foundation = new THREE.Mesh(fGeo, stoneMat);
    foundation.position.y = 0.2;
    group.add(foundation);

    // 1.2 Бревенчатые стены (складка брёвен со срубленными венцами)
    for (let i = 0; i < numLogs; i++) {
      const ly = 0.4 + (i + 0.5) * logRadius * 1.8;
      // Левая часть передней стены
      const lGeo = new THREE.CylinderGeometry(logRadius, logRadius, 2.2, 12);
      const lLog = new THREE.Mesh(lGeo, logMat);
      lLog.rotation.z = Math.PI / 2;
      lLog.position.set(-w / 2 + 1.1, ly, d / 2);
      group.add(lLog);

      // Правая часть передней стены (окно вверху)
      if (i < 2 || i > 6) {
        const rGeo = new THREE.CylinderGeometry(logRadius, logRadius, 2.8, 12);
        const rLog = new THREE.Mesh(rGeo, logMat);
        rLog.rotation.z = Math.PI / 2;
        rLog.position.set(w / 2 - 1.4, ly, d / 2);
        group.add(rLog);
      } else {
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, 0.9, 12), logMat);
        p1.rotation.z = Math.PI / 2;
        p1.position.set(0.7, ly, d / 2);
        group.add(p1);

        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(logRadius, logRadius, 0.9, 12), logMat);
        p2.rotation.z = Math.PI / 2;
        p2.position.set(w / 2 - 0.45, ly, d / 2);
        group.add(p2);
      }

      // Задняя сплошная стена
      const bGeo = new THREE.CylinderGeometry(logRadius, logRadius, w + 0.6, 12);
      const bLog = new THREE.Mesh(bGeo, logMat);
      bLog.rotation.z = Math.PI / 2;
      bLog.position.set(0, ly, -d / 2);
      group.add(bLog);

      // Боковые стены (X = -w/2 и X = w/2)
      const sGeo = new THREE.CylinderGeometry(logRadius, logRadius, d + 0.6, 12);
      const sLog1 = new THREE.Mesh(sGeo, logMat);
      sLog1.rotation.x = Math.PI / 2;
      sLog1.position.set(-w / 2, ly, 0);
      group.add(sLog1);

      const sLog2 = new THREE.Mesh(sGeo, logMat);
      sLog2.rotation.x = Math.PI / 2;
      sLog2.position.set(w / 2, ly, 0);
      group.add(sLog2);
    }

    // 1.3 Окно с рамой и стеклом
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.15), woodMat);
    winFrame.position.set(2.0, 1.4, d / 2);
    const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), glassMat);
    winGlass.position.set(2.0, 1.4, d / 2 + 0.08);
    group.add(winFrame);
    group.add(winGlass);

    // 1.4 Дверной косяк и приоткрытая деревянная дверь
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.2), woodMat);
    doorFrame.position.set(-0.35, 1.35, d / 2);
    group.add(doorFrame);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.95, 0.08), woodMat);
    door.position.set(-0.25, 1.35, d / 2 + 0.35);
    door.rotation.y = -0.45; // дверь приоткрыта
    group.add(door);

    // 1.5 Крыльцо с навесом и перилами (Porch)
    const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.25, 1.6), woodMat);
    porchFloor.position.set(-0.5, 0.25, d / 2 + 1.0);
    group.add(porchFloor);

    // Столбы крыльца
    for (const px of [-1.8, 0.8]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.3, 0.16), woodMat);
      post.position.set(px, 1.4, d / 2 + 1.7);
      group.add(post);
    }
    // Навес над крыльцом
    const pRoof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 1.9), roofMat);
    pRoof.position.set(-0.5, 2.65, d / 2 + 0.95);
    pRoof.rotation.x = 0.18;
    group.add(pRoof);

    // 1.6 Двускатная крыша (Gabled Roof)
    const roofSlope = 0.62;
    const roofLen = 3.9;
    const rL = new THREE.Mesh(new THREE.BoxGeometry(roofLen, 0.14, d + 1.2), roofMat);
    rL.position.set(-w / 4 - 0.2, h + 1.0, 0);
    rL.rotation.z = roofSlope;
    group.add(rL);

    const rR = new THREE.Mesh(new THREE.BoxGeometry(roofLen, 0.14, d + 1.2), roofMat);
    rR.position.set(w / 4 + 0.2, h + 1.0, 0);
    rR.rotation.z = -roofSlope;
    group.add(rR);

    // Конёк крыши
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, d + 1.3), woodMat);
    ridge.position.set(0, h + 2.05, 0);
    group.add(ridge);

    // Фронтоны (треугольники под крышей)
    for (const fz of [d / 2, -d / 2]) {
      const gShape = new THREE.Shape();
      gShape.moveTo(-w / 2, 0);
      gShape.lineTo(w / 2, 0);
      gShape.lineTo(0, 1.95);
      gShape.closePath();
      const gGeo = new THREE.ShapeGeometry(gShape);
      const gable = new THREE.Mesh(gGeo, woodMat);
      gable.position.set(0, h + 0.1, fz);
      if (fz < 0) gable.rotation.y = Math.PI;
      group.add(gable);
    }

    // 1.7 Каменная печная труба с дымоходом
    const chimGeo = new THREE.BoxGeometry(0.8, 4.2, 0.8);
    const chimney = new THREE.Mesh(chimGeo, stoneMat);
    chimney.position.set(-1.8, 2.1, -1.2);
    group.add(chimney);

    const chimCap = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), stoneMat);
    chimCap.position.set(-1.8, 4.25, -1.2);
    group.add(chimCap);

    setShadow(group);

    addBoxCollider(x - w / 2, z, 0.35, d / 2);
    addBoxCollider(x + w / 2, z, 0.35, d / 2);
    addBoxCollider(x, z - d / 2, w / 2, 0.35);
    addBoxCollider(x - 1.8, z + d / 2, 1.4, 0.35);
    addBoxCollider(x + 1.7, z + d / 2, 1.5, 0.35);

    buildingList.push({ name: 'Бревенчатый сруб', x, z, group });
    return group;
  }

  // ====================================================
  // 2. ВОЕННЫЙ БЛОКПОСТ С ВЫШКОЙ (Military Guard Post)
  // ====================================================
  function createMilitaryPost(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const woodTex = Textures.createWoodPlanks();
    const metalTex = Textures.createCorrugatedMetal();
    const sandTex = Textures.createSandbag();
    const camoTex = Textures.createCamoTarp();

    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.4, metalness: 0.7 });
    const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.95 });
    const camoMat = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.85, side: THREE.DoubleSide });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x242825, roughness: 0.5, metalness: 0.8 });
    const oliveDrumMat = new THREE.MeshStandardMaterial({ color: 0x475338, roughness: 0.55, metalness: 0.6 });

    // 2.1 Наблюдательная вышка (Watchtower, высота 6.5м)
    const towerH = 5.2;
    const tw = 3.2, td = 3.2;

    const legs = [
      [-tw / 2, -td / 2], [tw / 2, -td / 2],
      [-tw / 2, td / 2], [tw / 2, td / 2]
    ];
    for (const [lx, lz] of legs) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, towerH, 0.24), woodMat);
      leg.position.set(lx, towerH / 2, lz);
      group.add(leg);
    }

    for (let level = 0; level < 2; level++) {
      const y0 = 1.0 + level * 2.0;
      const braceX = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.12, 0.12), woodMat);
      braceX.position.set(0, y0, -td / 2);
      group.add(braceX);
      const braceX2 = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.12, 0.12), woodMat);
      braceX2.position.set(0, y0, td / 2);
      group.add(braceX2);
      const braceZ = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, td), woodMat);
      braceZ.position.set(-tw / 2, y0, 0);
      group.add(braceZ);
    }

    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.6, towerH, 0.08), woodMat);
    ladder.position.set(0, towerH / 2, td / 2 + 0.12);
    group.add(ladder);

    const plat = new THREE.Mesh(new THREE.BoxGeometry(tw + 0.8, 0.2, td + 0.8), woodMat);
    plat.position.set(0, towerH, 0);
    group.add(plat);

    const railH = 1.1;
    for (const [rx, rz, rw, rd] of [
      [0, (td + 0.8) / 2, tw + 0.8, 0.08],
      [0, -(td + 0.8) / 2, tw + 0.8, 0.08],
      [-(tw + 0.8) / 2, 0, 0.08, td + 0.8],
      [(tw + 0.8) / 2, 0, 0.08, td + 0.8]
    ]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(rw, railH, rd), woodMat);
      rail.position.set(rx, towerH + railH / 2, rz);
      group.add(rail);
    }

    const tRoof = new THREE.Mesh(new THREE.BoxGeometry(tw + 1.2, 0.1, td + 1.2), metalMat);
    tRoof.position.set(0, towerH + 2.3, 0);
    tRoof.rotation.x = -0.08;
    group.add(tRoof);

    for (const [lx, lz] of legs) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.3, 0.14), woodMat);
      post.position.set(lx, towerH + 1.15, lz);
      group.add(post);
    }

    // 2.2 Брустверы из мешков с песком
    function makeSandbagWall(wx, wz, length, isRotated) {
      const bagGeo = new THREE.BoxGeometry(0.85, 0.28, 0.45);
      const layers = 4;
      const count = Math.floor(length / 0.8);
      for (let l = 0; l < layers; l++) {
        const y = 0.14 + l * 0.26;
        const offset = (l % 2) * 0.4;
        for (let c = 0; c < count; c++) {
          const bag = new THREE.Mesh(bagGeo, sandMat);
          const posOffset = (c - count / 2) * 0.8 + offset;
          if (isRotated) {
            bag.position.set(wx, y, wz + posOffset);
            bag.rotation.y = Math.PI / 2;
          } else {
            bag.position.set(wx + posOffset, y, wz);
          }
          group.add(bag);
        }
      }
    }

    makeSandbagWall(0, 4.0, 7.0, false);
    makeSandbagWall(-3.8, 1.8, 4.5, true);
    makeSandbagWall(3.8, 1.8, 4.5, true);

    // 2.3 Бочки и ящики
    for (const [bx, bz, col] of [
      [-2.8, 0.5, oliveDrumMat],
      [-2.8, 1.4, darkSteelMat],
      [-2.0, 0.8, oliveDrumMat]
    ]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.1, 16), col);
      barrel.position.set(bx, 0.55, bz);
      group.add(barrel);
      addBoxCollider(x + bx, z + bz, 0.4, 0.4);
    }

    for (const [cx, cz, cy, s] of [
      [2.2, 0.6, 0.35, 0.7],
      [2.2, 1.5, 0.35, 0.7],
      [2.2, 1.0, 0.95, 0.6]
    ]) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), woodMat);
      crate.position.set(cx, cy, cz);
      group.add(crate);
      addBoxCollider(x + cx, z + cz, s / 2 + 0.1, s / 2 + 0.1);
    }

    // 2.4 Тент
    const tarpGeo = new THREE.PlaneGeometry(3.6, 3.2);
    const tarp = new THREE.Mesh(tarpGeo, camoMat);
    tarp.position.set(2.0, 2.0, 0.5);
    tarp.rotation.x = -Math.PI / 2.3;
    tarp.rotation.z = 0.15;
    group.add(tarp);

    setShadow(group);

    addBoxCollider(x, z, tw / 2, td / 2);
    addBoxCollider(x, z + 4.0, 3.5, 0.35);
    addBoxCollider(x - 3.8, z + 1.8, 0.35, 2.3);
    addBoxCollider(x + 3.8, z + 1.8, 0.35, 2.3);

    buildingList.push({ name: 'Военный блокпост', x, z, group });
    return group;
  }

  // =======================================================
  // 3. ЗАБРОШЕННЫЙ ПОЛУРАЗРУШЕННЫЙ ДОМ (Abandoned Ruin)
  // =======================================================
  function createRuinedHouse(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneTex = Textures.createStoneBricks();
    const woodTex = Textures.createWoodPlanks();
    const shingleTex = Textures.createRoofShingles();

    const brickMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 });
    const charredWoodMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x3d3025, roughness: 0.9 });
    const brokenRoofMat = new THREE.MeshStandardMaterial({ map: shingleTex, roughness: 0.8 });

    const rw = 7.0, rd = 5.6;

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(rw, 2.6, 0.35), brickMat);
    backWall.position.set(0, 1.3, -rd / 2);
    group.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.4, rd * 0.7), brickMat);
    leftWall.position.set(-rw / 2, 1.2, -rd * 0.15);
    group.add(leftWall);

    const frontWallPart = new THREE.Mesh(new THREE.BoxGeometry(rw * 0.45, 1.6, 0.35), brickMat);
    frontWallPart.position.set(-rw / 4, 0.8, rd / 2);
    group.add(frontWallPart);

    const rightPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 1.5), brickMat);
    rightPillar1.position.set(rw / 2, 1.1, -rd / 2 + 0.75);
    group.add(rightPillar1);
    const rightPillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 1.5), brickMat);
    rightPillar2.position.set(rw / 2, 0.7, rd / 2 - 0.75);
    group.add(rightPillar2);

    for (let i = 0; i < 6; i++) {
      const rx = -rw / 2 + 0.8 + i * 1.1;
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.8, 0.14), charredWoodMat);
      if (i % 2 === 0) {
        rafter.position.set(rx, 1.2, 0);
        rafter.rotation.set(0.4, 0.2, (Math.random() - 0.5) * 0.3);
      } else {
        rafter.position.set(rx, 2.6, -1.2);
        rafter.rotation.x = -0.55;
      }
      group.add(rafter);
    }

    const brokenRoof = new THREE.Mesh(new THREE.BoxGeometry(rw * 0.55, 0.12, rd * 0.65), brokenRoofMat);
    brokenRoof.position.set(-1.4, 2.8, -1.2);
    brokenRoof.rotation.x = -0.52;
    group.add(brokenRoof);

    for (let b = 0; b < 24; b++) {
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(0.35 + Math.random() * 0.4, 0.2 + Math.random() * 0.2, 0.35 + Math.random() * 0.4),
        brickMat
      );
      debris.position.set(
        (Math.random() - 0.5) * (rw - 1.5),
        0.15,
        (Math.random() - 0.5) * (rd - 1.5)
      );
      debris.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      group.add(debris);
    }

    setShadow(group);

    addBoxCollider(x, z - rd / 2, rw / 2, 0.35);
    addBoxCollider(x - rw / 2, z - rd * 0.15, 0.35, rd * 0.35);
    addBoxCollider(x - rw / 4, z + rd / 2, rw * 0.25, 0.35);

    buildingList.push({ name: 'Заброшенный дом', x, z, group });
    return group;
  }

  // ========================================================
  // 4. УКРЕПЛЁННЫЙ БУНКЕР ВЫЖИВШИХ (Fortified Bunker)
  // ========================================================
  function createBunker(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const concTex = Textures.createConcrete();
    const metalTex = Textures.createCorrugatedMetal();
    const sandTex = Textures.createSandbag();

    const concMat = new THREE.MeshStandardMaterial({ map: concTex, roughness: 0.85 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x3b423c, roughness: 0.4, metalness: 0.8 });
    const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.95 });
    const ventMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.4, metalness: 0.75 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xcc9922, roughness: 0.5, metalness: 0.4 });

    const bw = 5.4, bd = 4.8, bh = 2.4;

    const portal = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), concMat);
    portal.position.set(0, bh / 2, 0);
    group.add(portal);

    const recess = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.05, 1.4), steelMat);
    recess.position.set(0, 1.05, bd / 2 - 0.5);
    group.add(recess);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.9, 0.22), steelMat);
    door.position.set(0, 1.05, bd / 2 - 1.1);
    group.add(door);

    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 24), yellowMat);
    wheel.position.set(0, 1.05, bd / 2 - 0.95);
    group.add(wheel);

    for (let r = 0; r < 2; r++) {
      const ry = bh + 0.15 + r * 0.28;
      for (let i = -2; i <= 2; i++) {
        const bagF = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.45), sandMat);
        bagF.position.set(i * 0.9, ry, bd / 2 - 0.3);
        group.add(bagF);

        const bagB = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.45), sandMat);
        bagB.position.set(i * 0.9, ry, -bd / 2 + 0.3);
        group.add(bagB);
      }
    }

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 16), ventMat);
    pipe.position.set(-1.8, bh + 0.8, -1.2);
    group.add(pipe);

    const pipeCap = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.3, 16), ventMat);
    pipeCap.position.set(-1.8, bh + 1.65, -1.2);
    group.add(pipeCap);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), steelMat);
    mast.position.set(1.8, bh + 2.1, -1.2);
    group.add(mast);

    for (const ay of [bh + 2.8, bh + 3.4, bh + 4.0]) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), steelMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(1.8, ay, -1.2);
      group.add(bar);
    }

    setShadow(group);

    addBoxCollider(x, z, bw / 2 + 0.2, bd / 2 + 0.2);

    buildingList.push({ name: 'Бункер выживших', x, z, group });
    return group;
  }

  function checkCollision(px, pz, radius) {
    const r = radius || 0.4;
    for (const c of colliders) {
      if (
        px + r > c.minX &&
        px - r < c.maxX &&
        pz + r > c.minZ &&
        pz - r < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  return {
    createLogCabin,
    createMilitaryPost,
    createRuinedHouse,
    createBunker,
    checkCollision,
    getBuildingList: () => buildingList
  };
})();
