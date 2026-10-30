// ============================================================================
// DÖNER READY! 3D — Geleneksel Türk Döner Salonu (Pizza Ready! Level & Oyun Akışı)
// - ASLA TIKANMAYAN OYUN AKIŞI: Elde Ayran/Ürün Kalmaz (Tezgahlar Geniş Kapasiteli +
//   Farklı Оcağa veya Çöpe Gidince Otomatik Bırakma + Akıllı İhtiyaç Odaklı Garson AI!)
// - Tek Tek "Tık - Tık - Tık" Ses ve Uçuş Animasyonuyla Ürün Alma & Tezgaha Bırakma
// - Sadece Döner Keserken Duyulan Doğal Mangal Köz Sesi (Arka Planda Cızırtı Yok!)
// - +X Ekseninde Akan Düz Müşteri Kuyruğu & Sadece Sıradayken Görünen Adetli (x1, x2) Siparişler
// - Düzgün Oranlı (0.76x) ve Yüzü/Gözleri Saçla Çakışmayan İnsansı Karakterler
// - Referans Görselli Net "Çay Tabağı" + İnce Belli Çay Bardağı & Net "Veresiye/Peşin" Tablosu
// - Referans Fotoğraflara Göre 5 Gezen Mahalle Kedisi (Van Kedisi, Tekir, Sarman, Ankara, Alacalı)
//   + Simitçi Arabası, Mahalle Çeşmesi, Manav Kasaları ve Kıraathane Masası!
// ============================================================================

const container = document.getElementById('webgl-container');
const hudCanvas = document.getElementById('hud-canvas');
const hudCtx = hudCanvas.getContext('2d');

function to3DX(x) { return (x - 500) * 0.05; }
function to3DZ(y) { return (y - 390) * 0.05; }

// ============================================================================
// THREE.JS SCENE, COZY WARM DIM TRADITIONAL LIGHTING & PIZZA READY! CAMERA
// ============================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7dd3fc);
scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0011);

// Pizza Ready! Diorama Perspective Camera with Upper Horizon View of the Istanbul Bosphorus!
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 450);
const CAM_PITCH_RAD = (29.5 * Math.PI) / 180; // 29.5° pitch frames the entire shop, Bosphorus Strait, Bridge, Kız Kulesi, Seagulls & Sky/Sun/Moon!
const CAM_YAW_RAD = (-8 * Math.PI) / 180;
const CAM_BASE_DIST = 31.5;
camera.position.set(
  Math.sin(CAM_YAW_RAD) * Math.cos(CAM_PITCH_RAD) * CAM_BASE_DIST,
  Math.sin(CAM_PITCH_RAD) * CAM_BASE_DIST,
  Math.cos(CAM_YAW_RAD) * Math.cos(CAM_PITCH_RAD) * CAM_BASE_DIST - 2.0
);
camera.lookAt(0, 0.0, -2.0);

let camPanTarget = null;
let camPanTimer = 0;
let camZoom = 1.0;

window.addEventListener('wheel', e => {
  camZoom = Math.max(0.68, Math.min(1.35, camZoom + (e.deltaY > 0 ? 0.06 : -0.06)));
}, { passive: true });

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
container.appendChild(renderer.domElement);

const MAX_ANISOTROPY = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 8;

function applyCrispTextureSettings(tex) {
  if (!tex) return tex;
  tex.anisotropy = MAX_ANISOTROPY;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  hudCanvas.width = window.innerWidth;
  hudCanvas.height = window.innerHeight;
}
window.addEventListener('resize', onWindowResize);
onWindowResize();

const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x291d12, 0.58);
hemiLight.position.set(0, 52, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffdcb5, 0.72);
dirLight.position.set(-12, 38, 18);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 5;
dirLight.shadow.camera.far = 115;
const d = 42;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

function worldToScreen(wx, wy, wz) {
  const vec = new THREE.Vector3(wx, wy, wz);
  vec.project(camera);
  return {
    x: (vec.x * 0.5 + 0.5) * hudCanvas.width,
    y: (-(vec.y * 0.5) + 0.5) * hudCanvas.height,
    visible: vec.z < 1
  };
}

// ============================================================================
// CRISP TEXTURE GENERATORS & REFERENCE IMAGE LOADERS (TEA SAUCER, VERESİYE & ZURNA DÜRÜM LAVAŞ)
// ============================================================================
let sharedKilimTexture = null;
let sharedWoodTexture = null;
let sharedDarkFloorTexture = null;
let sharedWallMotifTexture = null;
let sharedThiefStripeTexture = null;
let sharedLemonLabelTexture = null;
let sharedCayTabagiTexture = null;
let sharedLavashTexture = null;
let cayTabagiImageElement = null;

// Authentic Toasted Sac/Grill Blistered Lavash Texture for Zurna Dürüm (Modeled after Uploaded Photo!)
function getToastedLavashTexture() {
  if (sharedLavashTexture) return sharedLavashTexture;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Warm creamy baked wheat dough base
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#f7e6c4');
  grad.addColorStop(0.5, '#f0d4a4');
  grad.addColorStop(1, '#e8c58e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle flour & dough grain
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,250,240,0.28)' : 'rgba(180,120,60,0.12)';
    ctx.beginPath();
    ctx.arc((i * 73) % 256, (i * 41) % 256, 2 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }

  // Authentic golden-amber & dark roasted brown blister spots (sac yanığı benekleri)
  const spots = [
    [28, 34, 14, 9, 0.3], [72, 24, 18, 11, -0.2], [125, 42, 15, 10, 0.4], [182, 30, 19, 12, -0.1], [228, 48, 13, 8, 0.2],
    [45, 78, 20, 12, -0.3], [96, 86, 16, 10, 0.1], [154, 74, 22, 13, 0.25], [208, 92, 15, 9, -0.2], [22, 118, 14, 9, 0.15],
    [68, 132, 19, 11, -0.25], [118, 124, 21, 13, 0.2], [172, 136, 17, 10, -0.15], [226, 128, 18, 11, 0.3],
    [36, 176, 18, 11, 0.1], [88, 184, 22, 12, -0.2], [144, 172, 16, 10, 0.35], [196, 188, 20, 12, -0.1], [236, 178, 14, 8, 0.2],
    [54, 224, 17, 10, -0.3], [110, 230, 21, 12, 0.15], [166, 220, 18, 11, -0.2], [218, 232, 16, 10, 0.25]
  ];

  spots.forEach(([sx, sy, rx, ry, rot], idx) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);

    // Outer warm golden-amber blister halo
    ctx.fillStyle = 'rgba(194, 106, 27, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 1.18, ry * 1.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mid roasted brown blister
    ctx.fillStyle = 'rgba(133, 62, 14, 0.78)';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.82, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark toasted center char speck
    if (idx % 2 === 0) {
      ctx.fillStyle = 'rgba(69, 26, 3, 0.85)';
      ctx.beginPath();
      ctx.ellipse(1, -1, rx * 0.42, ry * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Diagonal spiral lavash wrap fold shadow seam
  ctx.strokeStyle = 'rgba(120, 65, 20, 0.45)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 95);
  ctx.lineTo(256, 175);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 248, 230, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 91);
  ctx.lineTo(256, 171);
  ctx.stroke();

  sharedLavashTexture = applyCrispTextureSettings(new THREE.CanvasTexture(c));
  return sharedLavashTexture;
}

// Reusable 3D Floor Action Pad (Specific point where Usta must stand to carve, pick up, drop, clean, or collect cash!)
function createActionPadMesh3D(radius = 0.92, baseColor = 0xfef08a) {
  const padGroup = new THREE.Group();

  const innerDisc = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.84, 24),
    new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  innerDisc.rotation.x = -Math.PI / 2;
  innerDisc.position.y = 0.14;
  padGroup.add(innerDisc);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.78, radius, 28),
    new THREE.MeshBasicMaterial({ color: baseColor, side: THREE.DoubleSide })
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.15;
  padGroup.add(outerRing);

  // Subtle footprint stance markers inside the circle
  const footGeo = new THREE.BoxGeometry(0.18, 0.02, 0.34);
  const footMat = new THREE.MeshBasicMaterial({ color: baseColor });
  const leftFoot = new THREE.Mesh(footGeo, footMat);
  leftFoot.position.set(-0.18, 0.155, 0);
  const rightFoot = new THREE.Mesh(footGeo, footMat);
  rightFoot.position.set(0.18, 0.155, 0);
  padGroup.add(leftFoot, rightFoot);

  padGroup.userData.outerRing = outerRing;
  padGroup.userData.footMat = footMat;
  padGroup.userData.baseColor = baseColor;
  return padGroup;
}

function setActionPadHighlight(padGroup, isActive) {
  if (!padGroup || !padGroup.userData.outerRing) return;
  const col = isActive ? 0x22c55e : padGroup.userData.baseColor;
  padGroup.userData.outerRing.material.color.setHex(col);
  padGroup.userData.footMat.color.setHex(col);
  const s = isActive ? 1.10 : 1.0;
  padGroup.scale.set(s, 1, s);
}

// Preload Reference Tea Saucer Image (Uploaded Image 1) for both 3D Saucer & 2D HUD!
function getCayTabagiTexture() {
  if (sharedCayTabagiTexture) return sharedCayTabagiTexture;
  if (window.CAY_TABAGI_DATA_URI) {
    const loader = new THREE.TextureLoader();
    sharedCayTabagiTexture = loader.load(window.CAY_TABAGI_DATA_URI, tex => {
      applyCrispTextureSettings(tex);
    });
    applyCrispTextureSettings(sharedCayTabagiTexture);

    cayTabagiImageElement = new Image();
    cayTabagiImageElement.src = window.CAY_TABAGI_DATA_URI;
  }
  return sharedCayTabagiTexture;
}
getCayTabagiTexture();

function getLemonCologneLabelTexture() {
  if (sharedLemonLabelTexture) return sharedLemonLabelTexture;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Deep green label background with golden border
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 240, 240);

  // Draw a bright, unmistakable yellow Lemon + Green Leaf in the center!
  ctx.save();
  ctx.translate(128, 115);
  ctx.rotate(-0.2);
  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 56, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Lemon tips
  ctx.beginPath();
  ctx.arc(-58, 0, 10, 0, Math.PI * 2);
  ctx.arc(58, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  // Green leaf
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(10, -44, 24, 11, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('80° LİMON', 128, 200);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('KOLONYASI', 128, 230);

  const tex = new THREE.CanvasTexture(c);
  return applyCrispTextureSettings(tex);
}

function getKilimCushionTexture() {
  if (sharedKilimTexture) return sharedKilimTexture;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#8b1e24';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 256, 2);
  }

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, 228, 228);

  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 204, 204);

  const corners = [[48, 48], [208, 48], [48, 208], [208, 208]];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx + 18, cy);
    ctx.lineTo(cx, cy + 18);
    ctx.lineTo(cx - 18, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 5, cy - 5, 10, 10);
  });

  ctx.fillStyle = '#450a0a';
  ctx.beginPath();
  ctx.moveTo(128, 44);
  ctx.lineTo(212, 128);
  ctx.lineTo(128, 212);
  ctx.lineTo(44, 128);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(128, 70);
  ctx.lineTo(186, 128);
  ctx.lineTo(128, 186);
  ctx.lineTo(70, 128);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.moveTo(128, 98);
  ctx.lineTo(158, 128);
  ctx.lineTo(128, 158);
  ctx.lineTo(98, 128);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#8b1e24';
  ctx.fillRect(120, 120, 16, 16);

  const tex = new THREE.CanvasTexture(c);
  sharedKilimTexture = applyCrispTextureSettings(tex);
  return sharedKilimTexture;
}

function getNaturalWoodTexture() {
  if (sharedWoodTexture) return sharedWoodTexture;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#9a6338';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 65; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(67, 36, 15, 0.16)' : 'rgba(217, 155, 96, 0.12)';
    const y = Math.random() * 256;
    ctx.fillRect(0, y, 256, 2 + Math.random() * 4);
  }
  ctx.strokeStyle = 'rgba(55, 28, 10, 0.35)';
  ctx.lineWidth = 2;
  for (let p = 64; p < 256; p += 64) {
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(256, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  sharedWoodTexture = applyCrispTextureSettings(tex);
  return sharedWoodTexture;
}

function getDarkFloorTexture() {
  if (sharedDarkFloorTexture) return sharedDarkFloorTexture;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#3b2618';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 64;
  for (let gx = 0; gx < 512; gx += tileSize) {
    for (let gy = 0; gy < 512; gy += tileSize) {
      const isAlt = ((gx / tileSize) + (gy / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#4a2f1d' : '#3e2718';
      ctx.fillRect(gx + 2, gy + 2, tileSize - 4, tileSize - 4);

      ctx.strokeStyle = 'rgba(180, 83, 9, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx + 6, gy + 6, tileSize - 12, tileSize - 12);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 4.5);
  tex.anisotropy = MAX_ANISOTROPY;
  tex.needsUpdate = true;
  sharedDarkFloorTexture = tex;
  return tex;
}

function getWallMotifTexture() {
  if (sharedWallMotifTexture) return sharedWallMotifTexture;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 64;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#451a03';
  ctx.fillRect(0, 0, 512, 64);

  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(0, 8, 512, 48);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 8, 512, 48);

  for (let x = 16; x < 512; x += 32) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x + 12, 32);
    ctx.lineTo(x, 50);
    ctx.lineTo(x - 12, 32);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x - 3, 29, 6, 6);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(8, 1);
  tex.anisotropy = MAX_ANISOTROPY;
  tex.needsUpdate = true;
  sharedWallMotifTexture = tex;
  return tex;
}

function getStripedThiefTexture() {
  if (sharedThiefStripeTexture) return sharedThiefStripeTexture;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 128; y += 16) {
    ctx.fillStyle = (y / 16) % 2 === 0 ? '#111827' : '#f8fafc';
    ctx.fillRect(0, y, 128, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  sharedThiefStripeTexture = applyCrispTextureSettings(tex);
  return sharedThiefStripeTexture;
}

function createSignboard3D(titleText, subText, bgColor = '#3b1d0a', borderColor = '#f59e0b', width3D = 2.8, height3D = 0.78) {
  // Keep text ONLY on exterior cultural buildings (Kıraathane, Manav, Fırın, Rezidans, AVM);
  // convert all interior/station/counter/depot/truck signs into clean, zero-clutter Symbolic Medallions!
  const keepText = /KIRAATHANE|MANAV|FIRIN|REZİDANS|AVM/.test(titleText || '');

  if (!keepText) {
    const tokens = (titleText || '').trim().split(/\s+/);
    const symbolOnly = tokens[0] || '🥙';
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 160;
    const ctx = c.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(10, 10, 140, 140, 34);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '82px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbolOnly, 80, 86);

    const tex = applyCrispTextureSettings(new THREE.CanvasTexture(c));
    const group = new THREE.Group();
    const medSize = 0.86;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(medSize, medSize, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x3b1d0a, roughness: 0.55 })
    );
    const faceFront = new THREE.Mesh(
      new THREE.PlaneGeometry(medSize * 0.94, medSize * 0.94),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    faceFront.position.z = 0.068;
    const faceBack = faceFront.clone();
    faceBack.rotation.y = Math.PI;
    faceBack.position.z = -0.068;

    group.add(board, faceFront, faceBack);
    return group;
  }

  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 144;
  const ctx = c.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 144);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 128);

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(titleText, 256, subText ? 68 : 86);

  if (subText) {
    ctx.fillStyle = borderColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(subText, 256, 114);
  }

  const tex = applyCrispTextureSettings(new THREE.CanvasTexture(c));

  const group = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(width3D, height3D, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 })
  );
  const faceFront = new THREE.Mesh(
    new THREE.PlaneGeometry(width3D * 0.96, height3D * 0.92),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  faceFront.position.z = 0.08;
  const faceBack = faceFront.clone();
  faceBack.rotation.y = Math.PI;
  faceBack.position.z = -0.08;

  group.add(board, faceFront, faceBack);
  return group;
}

// ============================================================================
// PIZZA READY! REFERENCE LEVEL DESIGN, SPEED, CAPACITY & ECONOMY CURVE
// ============================================================================
const BILL_VALUE = 5;

// Staggered raw material capacities so Chicken & Drinks NEVER deplete simultaneously!
const SUPPLY_CONFIG = {
  meatMaxStock: 10,
  meatCrateCost: 20,
  meatCrateAmount: 10,
  drinkMaxStock: 15,
  drinkCrateCost: 15,
  drinkCrateAmount: 15
};

const LEVELS = [
  { level: 1, title: 'SEVİYE 1: Boğaz Havasında Siftah (Masa 1 & Ana Ocak)', reqPads: 0 },
  { level: 2, title: 'SEVİYE 2: Yeni Masa Alanı (Masa 2 Açıldı)', reqPads: 1 },
  { level: 3, title: 'SEVİYE 3: İK (HR) Odası & İlk Çırak Garson (Kaynakçı Aktif!)', reqPads: 2 },
  { level: 4, title: 'SEVİYE 4: Köpüklü Yayık Ayran & Masa 3', reqPads: 3 },
  { level: 5, title: 'SEVİYE 5: Bakır Semaver Çay Ocağı & Paket Servis (Hırsız Aktif!)', reqPads: 4 },
  { level: 6, title: 'SEVİYE 6: Zurna Dürüm & Lüks Semt (Rezidans & AVM)', reqPads: 5 },
  { level: 7, title: 'SEVİYE 7: Drive-Thru & Gizli Milyoner / Dilenci Aktif!', reqPads: 6 },
  { level: 8, title: 'SEVİYE 8: Acılı Şalgam & Güvenlik Kapanı', reqPads: 7 },
  { level: 9, title: 'SEVİYE 9: Bakır Sahanda İskender & VIP Masa 4', reqPads: 8 },
  { level: 10, title: 'SEVİYE 10: Altın Semaver & Boğaz Döner İmparatoru!', reqPads: 9 }
];

// Pizza Ready! Reference Menu Pricing & Upgrade Curve (Steady, rewarding progression without instant wealth!)
const MENU_CONFIG = {
  doner: { name: '🥙 Tombul Ekmek Tavuk Döner', type: 'food', tier: 1, prices: [10, 15, 22], upgradeCosts: [0, 450, 1600], color: 0xf59e0b },
  ayran: { name: '🥛 Tombul Yayık Ayran', type: 'drink', tier: 1, prices: [5, 10, 15], upgradeCosts: [0, 380, 1300], color: 0xf8fafc },
  durum: { name: '🌯 Zurna Tavuk Dürüm', type: 'food', tier: 1, prices: [15, 22, 32], upgradeCosts: [0, 900, 2600], color: 0xfb923c },
  salgam: { name: '🥤 Acılı Şalgam Şişesi', type: 'drink', tier: 1, prices: [10, 15, 22], upgradeCosts: [0, 750, 2200], color: 0x991b1b },
  iskender: { name: '🍛 Bakır Sahanda İskender', type: 'food', tier: 1, prices: [25, 38, 55], upgradeCosts: [0, 2000, 5500], color: 0xdc2626 }
};

// Pizza Ready! 8-Stage Usta & Garson Progression (Starts grounded at Lv.1 and scales proportionally with Store Level!)
const USTA_UPGRADES = {
  speed: {
    name: '🏃‍♂️ Usta Yürüme Hızı',
    desc: 'Seviyeye göre kademeli artan yürüme hızı (Pizza Ready dengesi)',
    star: 1,
    costs: [0, 140, 320, 650, 1200, 2200, 3800, 6500],
    values: [120, 129, 138, 147, 156, 165, 175, 186]
  },
  capacity: {
    name: '🤲 Usta Tepsi Kapasitesi',
    desc: 'Tek seferde taşınan maksimum ürün adedi (3 -> 4 -> 5 -> 6 -> 8 -> 10 -> 12 -> 15)',
    star: 1,
    costs: [0, 160, 360, 750, 1400, 2500, 4200, 7200],
    values: [3, 4, 5, 6, 8, 10, 12, 15]
  },
  sliceSpeed: {
    name: '🔪 Döner Kesim & Üretim Hızı',
    desc: 'Ocakların pişirme ve döner kesim hızı çarpanı',
    star: 1,
    costs: [0, 150, 340, 700, 1300, 2400, 4000, 6800],
    values: [1.00, 1.12, 1.25, 1.40, 1.55, 1.72, 1.90, 2.15]
  }
};

const HR_UPGRADES = {
  count: {
    name: '🧑‍🍳 Garson (Çırak) Sayısı',
    desc: 'Müşteri ihtiyacına göre döner/ayran taşıyan ve çöp toplayan garsonlar',
    star: 0,
    costs: [240, 650, 1500, 3400, 7500],
    values: [0, 1, 2, 3, 4, 5]
  },
  speed: {
    name: '⚡ Garson Yürüme Hızı',
    desc: 'Garsonların servis ve masa temizleme hızı (8 Kademe)',
    star: 1,
    costs: [0, 150, 340, 700, 1300, 2400, 4000, 6800],
    values: [84, 93, 102, 111, 120, 130, 140, 152]
  },
  capacity: {
    name: '📦 Garson Taşıma Kapasitesi',
    desc: 'Garsonların tek seferde taşıdığı ürün adedi (2 -> 3 -> 4 -> 5 -> 6 -> 8 -> 10 -> 12)',
    star: 1,
    costs: [0, 170, 380, 780, 1450, 2600, 4400, 7500],
    values: [2, 3, 4, 5, 6, 8, 10, 12]
  },
  guard: {
    name: '👮‍♂️ Bıyıklı Bekçi (Hırsız Koruması)',
    desc: 'Restorana giren çizgili hırsıza otomatik Osmanlı tokadı atar!',
    star: 0,
    maxStar: 1,
    costs: [2800],
    values: [false, true]
  },
  autoBarrier: {
    name: '🚧 Otomatik Plaka Okuyucu Kapan',
    desc: 'Drive-Thru hırsızını sen basmadan otomatik durdurur!',
    star: 0,
    maxStar: 1,
    costs: [9500],
    values: [false, true]
  }
};

// Pizza Ready! Level-Proportional Upgrade Gate: prevents maxing out stats at Level 1!
function getMaxAllowedUpgradeStar(totalStars) {
  const currentStoreLevel = state.levelIndex + 1; // 1..10
  return Math.min(totalStars, currentStoreLevel + 1);
}

function getUstaOverallLevel() {
  return USTA_UPGRADES.speed.star + USTA_UPGRADES.capacity.star + USTA_UPGRADES.sliceSpeed.star - 2;
}
function getStaffOverallLevel() {
  return HR_UPGRADES.count.star + HR_UPGRADES.speed.star + HR_UPGRADES.capacity.star - 1;
}

// ============================================================================
// GAME STATE, PLAYER-ONLY HR ROOM, +X QUEUE COUNTERS, TABLES & DYNAMIC TRUCKS
// ============================================================================
const DAY_DURATION = 150.0; // 2.5 minutes per full day (08:00 Morning to 22:00 Night Closing)

const state = {
  cash: 30,
  xp: 0,
  rawMeat: 10,
  rawDrink: 15,
  levelIndex: 0,
  bereketTimer: 0,
  comboTimer: 0,
  comboCount: 0,
  hrUnlocked: false,      // Unlocks at Level 3 (pad_waiter1)
  semaverUnlocked: false, // Unlocks at Level 5 (pad_lineup)
  semaverUpgraded: false,
  lineUpUnlocked: false,
  driveThruUnlocked: false,
  barrierUnlocked: false,
  doorOpenAmount: 0,
  doorWasOpen: false,
  dayNumber: 1,
  dayTime: 0,
  isNightClosed: false,
  dailyStats: {
    customersServed: 0,
    itemsSold: 0,
    grossRevenue: 0,
    supplyCost: 0
  },
  shavingParticles: [],
  flyingBills3D: [],
  flyingTrash3D: [],
  flyingItems3D: [],
  floatingPopups2D: []
};

const supplyDock = {
  meatPad: { x: 148, y: 230, cost: SUPPLY_CONFIG.meatCrateCost, amount: SUPPLY_CONFIG.meatCrateAmount, cooldown: 0, fillTimer: 0, fillDuration: 3.0, tickTimer: 0 },
  drinkPad: { x: 148, y: 410, cost: SUPPLY_CONFIG.drinkCrateCost, amount: SUPPLY_CONFIG.drinkCrateAmount, cooldown: 0, fillTimer: 0, fillDuration: 2.6, tickTimer: 0 },
  meatCrateGroup: null,
  meatPadMesh: null,
  meatProgressMesh: null,
  fridgeGroup: null,
  drinkPadMesh: null,
  drinkProgressMesh: null,
  fridgeBottleGroup: null,
  meatTruckGroup: null,
  drinkTruckGroup: null,
  // Meat truck arrives from +Y (+95) and drives forward toward -Y (-95)!
  meatTruckZ: 95,
  drinkTruckZ: 95
};

// Dedicated Enclosed 3D HR Room in the Top-Left-Center Wing (x = 340..480, y = 104..180)
const hrOffice = {
  roomCenterX: 410,
  roomCenterY: 142,
  deskX: 410,
  deskY: 125,
  padX: 410,
  padY: 158,
  doorX: 410,
  doorY: 182,
  dwellTimer: 0,
  modalCooldown: 0
};

// Trash Container (Çöp Konteyneri) — Tucked cleanly below the counter column with wide corridors all around!
const trashBin = {
  x: 348,
  y: 618,
  padX: 348,
  padY: 576,
  hw: 12,
  hh: 12,
  lidAngle: 0,
  lidPivot: null,
  actionPadMesh: null
};

// Restroom / Toilet (WC) in Top-Right (x = 735..845, y = 104..205)
const restroom = {
  x: 795,
  y: 150,
  padX: 795,
  padY: 165,
  doorX: 795,
  doorY: 205,
  cologneX: 745,
  cologneY: 222,
  dirty: false,
  trashCount: 0,
  cleanProgress: 0,
  cashBills: 0,
  cashX: 715,
  cashY: 195,
  useCount: 0,
  maxUsesBeforeDirty: 3,
  doorOpenAmount: 0,
  doorPivot: null,
  dirtySignMesh: null,
  puddleGroup: null,
  wcTrashGroup: null,
  progressRing: null,
  cashGroup: null,
  colognePumpHead: null,
  actionPadMesh: null,
  cashPadMesh: null
};

// Ornate Semaver Tea Station in Bottom Dining Area with generous walk-around clearance
const semaverStation = {
  x: 565,
  y: 602,
  drinkX: 565,
  drinkY: 564,
  trayGlassesGroup: null
};

// Well-spaced kitchen stations along x=205 with generous 100-unit vertical spacing and compact collision boxes (hw: 18, hh: 15)
const stations = [
  { id: 'doner1', itemKey: 'doner', signTitle: '🥙', signSub: '', x: 205, y: 170, padX: 250, padY: 170, carveFacing: -Math.PI / 2, hw: 18, hh: 15, unlocked: true, stock: 3, maxStock: 8, timer: 0, baseInterval: 2.25, rotAngle: 0, meshGroup: null, coneMesh: null, stockGroup: null, actionPadMesh: null },
  { id: 'ayran1', itemKey: 'ayran', signTitle: '🥛', signSub: '', x: 205, y: 270, padX: 250, padY: 270, carveFacing: -Math.PI / 2, hw: 18, hh: 15, unlocked: false, stock: 2, maxStock: 8, timer: 0, baseInterval: 2.05, rotAngle: 0, meshGroup: null, stockGroup: null, actionPadMesh: null },
  { id: 'durum1', itemKey: 'durum', signTitle: '🌯', signSub: '', x: 205, y: 370, padX: 250, padY: 370, carveFacing: -Math.PI / 2, hw: 18, hh: 15, unlocked: false, stock: 3, maxStock: 8, timer: 0, baseInterval: 2.40, rotAngle: 0, meshGroup: null, coneMesh: null, stockGroup: null, actionPadMesh: null },
  { id: 'salgam1', itemKey: 'salgam', signTitle: '🥤', signSub: '', x: 205, y: 470, padX: 250, padY: 470, carveFacing: -Math.PI / 2, hw: 18, hh: 15, unlocked: false, stock: 2, maxStock: 8, timer: 0, baseInterval: 2.15, rotAngle: 0, meshGroup: null, stockGroup: null, actionPadMesh: null },
  { id: 'iskender1', itemKey: 'iskender', signTitle: '🍛', signSub: '', x: 205, y: 570, padX: 250, padY: 570, carveFacing: -Math.PI / 2, hw: 18, hh: 15, unlocked: false, stock: 2, maxStock: 7, timer: 0, baseInterval: 2.75, rotAngle: 0, meshGroup: null, coneMesh: null, stockGroup: null, actionPadMesh: null }
];

function createCounterItemStacks() {
  return {
    doner: [],
    durum: [],
    iskender: [],
    ayran: [],
    salgam: []
  };
}

// Side-by-side (yan yana) single-row counter slots using PURE SYMBOLS (zero text clutter!)
const COUNTER_SLOT_OFFSETS_3D = {
  doner:    { x: 0.0, y: 1.54, z: -1.84, label: '🥙', border: '#f59e0b', bg: '#451a03' },
  ayran:    { x: 0.0, y: 1.54, z: -0.92, label: '🥛', border: '#38bdf8', bg: '#0c4a6e' },
  durum:    { x: 0.0, y: 1.54, z:  0.00, label: '🌯', border: '#fb923c', bg: '#7c2d12' },
  salgam:   { x: 0.0, y: 1.54, z:  0.92, label: '🥤', border: '#f43f5e', bg: '#4c0519' },
  iskender: { x: 0.0, y: 1.54, z:  1.84, label: '🍛', border: '#ef4444', bg: '#7f1d1d' }
};

// Counters with compact collision boxes (hw: 16, hh: 24) and a massive 192-unit central corridor between dineIn (y=245) and lineUp (y=485)!
const counters = {
  dineIn: { id: 'dineIn', x: 348, y: 245, dropPadX: 304, dropPadY: 245, hw: 16, hh: 24, stacks: createCounterItemStacks(), stackGroups: {}, traySlots3D: {}, cashBills: 0, cashX: 348, cashY: 192, meshGroup: null, cashGroup: null, dropPadMesh: null, cashPadMesh: null },
  lineUp: { id: 'lineUp', x: 348, y: 485, dropPadX: 304, dropPadY: 485, hw: 16, hh: 24, stacks: createCounterItemStacks(), stackGroups: {}, traySlots3D: {}, cashBills: 0, cashX: 348, cashY: 432, meshGroup: null, cashGroup: null, dropPadMesh: null, cashPadMesh: null },
  driveThru: { id: 'driveThru', x: 815, y: 365, dropPadX: 772, dropPadY: 365, hw: 16, hh: 24, stacks: createCounterItemStacks(), stackGroups: {}, traySlots3D: {}, cashBills: 0, cashX: 768, cashY: 425, meshGroup: null, cashGroup: null, dropPadMesh: null, cashPadMesh: null }
};

function createTableSeats() {
  return [
    { index: 0, dir: 'N', offsetX: 0, offsetY: -36, facing: 0, occupant: null, hasTrash: false, mealFood: null, mealDrink: null },
    { index: 1, dir: 'S', offsetX: 0, offsetY: 36, facing: Math.PI, occupant: null, hasTrash: false, mealFood: null, mealDrink: null },
    { index: 2, dir: 'W', offsetX: -36, offsetY: 0, facing: Math.PI / 2, occupant: null, hasTrash: false, mealFood: null, mealDrink: null },
    { index: 3, dir: 'E', offsetX: 36, offsetY: 0, facing: -Math.PI / 2, occupant: null, hasTrash: false, mealFood: null, mealDrink: null }
  ];
}

function syncTableTrashCount(tb) {
  tb.trashCount = tb.seats.filter(s => s.hasTrash).length;
}

// Well-separated tables with compact collision footprints (hw: 15, hh: 15) so players, waiters & customers walk between them effortlessly!
const tables = [
  { id: 't1', x: 545, y: 355, padX: 504, padY: 388, hw: 15, hh: 15, unlocked: true, seats: createTableSeats(), trashCount: 0, pendingTrash: 0, cashBills: 0, vip: false, meshGroup: null, mealGroups: [], trashGroup: null, cashGroup: null, actionPadMesh: null },
  { id: 't2', x: 700, y: 355, padX: 659, padY: 388, hw: 15, hh: 15, unlocked: false, seats: createTableSeats(), trashCount: 0, pendingTrash: 0, cashBills: 0, vip: false, meshGroup: null, mealGroups: [], trashGroup: null, cashGroup: null, actionPadMesh: null },
  { id: 't3', x: 622, y: 225, padX: 581, padY: 258, hw: 15, hh: 15, unlocked: false, seats: createTableSeats(), trashCount: 0, pendingTrash: 0, cashBills: 0, vip: false, meshGroup: null, mealGroups: [], trashGroup: null, cashGroup: null, actionPadMesh: null },
  { id: 't4', x: 690, y: 505, padX: 649, padY: 538, hw: 15, hh: 15, unlocked: false, seats: createTableSeats(), trashCount: 0, pendingTrash: 0, cashBills: 0, vip: true, meshGroup: null, mealGroups: [], trashGroup: null, cashGroup: null, actionPadMesh: null }
];

// Pizza Ready! Reference Unlock Progression (HR at Lv.3, Semaver & Line-Up at Lv.5, Zurna at Lv.6, Drive-Thru at Lv.7!)
const unlockPads = [
  {
    id: 'pad_table2', name: '🪑 Masa 2 (Yeni Yemek Alanı)', desc: '4 kilim tabureli 2. ahşap masayı hizmete açar', icon: '🪑✨', cost: 220, paid: 0, x: 695, y: 375, unlocked: false, reqIndex: 0,
    onUnlock: () => {
      tables.find(t => t.id === 't2').unlocked = true;
      rebuildWorldVisibility();
      panCameraTo(695, 375);
    }
  },
  {
    id: 'pad_waiter1', name: '🏢 İK (HR) Odası & 1. Çırak Garson', desc: 'İK Geliştirme Odasını açar ve 1. Çırak Garsonu işe başlatır!', icon: '🏢🧑‍🍳', cost: 450, paid: 0, x: 410, y: 205, unlocked: false, reqIndex: 1,
    onUnlock: () => {
      state.hrUnlocked = true;
      if (HR_UPGRADES.count.star === 0) { HR_UPGRADES.count.star = 1; syncStaffCount(); }
      rebuildWorldVisibility();
      panCameraTo(410, 155);
    }
  },
  {
    id: 'pad_ayran', name: '🥛 Yayık Ayran & Masa 3 Alanı', desc: 'Tombul Yayık Ayran istasyonunu ve 3. Masayı açar', icon: '🥛➕🪑', cost: 850, paid: 0, x: 295, y: 295, unlocked: false, reqIndex: 2,
    onUnlock: () => {
      stations.find(s => s.id === 'ayran1').unlocked = true;
      tables.find(t => t.id === 't3').unlocked = true;
      rebalanceQueuedCustomerOrders();
      rebuildWorldVisibility();
      panCameraTo(220, 295);
    }
  },
  {
    id: 'pad_lineup', name: '🫖 Bakır Semaver & Paket Servis Tezgahı', desc: 'Semaver Çay Ocağını ve Al-Götür Paket Servis sırasını açar!', icon: '🫖🛍️', cost: 1400, paid: 0, x: 355, y: 505, unlocked: false, reqIndex: 3,
    onUnlock: () => {
      state.semaverUnlocked = true;
      state.lineUpUnlocked = true;
      rebuildWorldVisibility();
      panCameraTo(495, 550);
    }
  },
  {
    id: 'pad_durum', name: '🌯 Zurna Dürüm & Lüks Semt (Rezidans & AVM)', desc: 'Zurna Dürüm ocağını açar ve dış mahalleyi Rezidans & AVM semtine taşır!', icon: '🌯🏙️', cost: 2500, paid: 0, x: 295, y: 415, unlocked: false, reqIndex: 4,
    onUnlock: () => {
      const dSt = stations.find(s => s.id === 'durum1');
      dSt.unlocked = true;
      dSt.stock = Math.max(dSt.stock, 3);
      rebalanceQueuedCustomerOrders();
      rebuildWorldVisibility();
      panCameraTo(220, 415);
    }
  },
  {
    id: 'pad_drivethru', name: '🚗 Drive-Thru (Arabaya Servis) Yolu', desc: 'Sağ cephede arabaya 2x kombo servis penceresini açar', icon: '🚗🍔', cost: 4200, paid: 0, x: 785, y: 365, unlocked: false, reqIndex: 5,
    onUnlock: () => {
      state.driveThruUnlocked = true;
      rebuildWorldVisibility();
      panCameraTo(835, 365);
    }
  },
  {
    id: 'pad_salgam_barrier', name: '🥤 Acılı Şalgam & Hırsız Kapanı', desc: 'Şalgam dolabını ve Drive-Thru güvenlik bariyerini kurar', icon: '🥤➕🚧', cost: 6800, paid: 0, x: 785, y: 530, unlocked: false, reqIndex: 6,
    onUnlock: () => {
      const sSt = stations.find(s => s.id === 'salgam1');
      sSt.unlocked = true;
      sSt.stock = Math.max(sSt.stock, 2);
      state.barrierUnlocked = true;
      rebalanceQueuedCustomerOrders();
      rebuildWorldVisibility();
      panCameraTo(220, 535);
    }
  },
  {
    id: 'pad_iskender_vip', name: '🍛 Bakır Sahanda İskender & VIP Masa 4', desc: 'Usta İskender ocağını ve altın işlemeli VIP Masa 4 alanını açar', icon: '🍛➕👑', cost: 11000, paid: 0, x: 695, y: 505, unlocked: false, reqIndex: 7,
    onUnlock: () => {
      const iSt = stations.find(s => s.id === 'iskender1');
      iSt.unlocked = true;
      iSt.stock = Math.max(iSt.stock, 2);
      tables.find(t => t.id === 't4').unlocked = true;
      rebalanceQueuedCustomerOrders();
      rebuildWorldVisibility();
      panCameraTo(695, 505);
    }
  },
  {
    id: 'pad_semaver', name: '🫖 Altın Semaver & Döner İmparatorluğu', desc: 'Semaver çay bahşişlerini 2 katına çıkarır ve 45sn Bereket Modu başlatır!', icon: '🫖🏆', cost: 18000, paid: 0, x: 635, y: 555, unlocked: false, reqIndex: 8,
    onUnlock: () => {
      state.semaverUpgraded = true;
      rebuildWorldVisibility();
      triggerBereketMode(45);
      panCameraTo(635, 595);
    }
  }
];

function panCameraTo(tx, ty) {
  camPanTarget = { x: to3DX(tx), z: to3DZ(ty) };
  camPanTimer = 1.15;
}

// ============================================================================
// SOLID OBSTACLE COLLISION + ONE-WAY PLAYER-VS-CUSTOMER COLLISION
// ============================================================================
function getSolidObstacles() {
  const obs = [
    // Left wall kitchen storage & beverage fridge
    { x: 120, y: 230, hw: 18, hh: 24 },
    { x: 120, y: 410, hw: 18, hh: 26 },
    // Enclosed Player-Only HR Room walls (x = 340..480, y = 104..180; doorway gap at x = 385..435, y = 180)
    { x: 340, y: 142, hw: 6, hh: 38 },
    { x: 480, y: 142, hw: 6, hh: 38 },
    { x: 362, y: 180, hw: 20, hh: 6 },
    { x: 458, y: 180, hw: 20, hh: 6 },
    { x: hrOffice.deskX, y: hrOffice.deskY, hw: 22, hh: 12 },
    // Trash bin
    { x: trashBin.x, y: trashBin.y, hw: trashBin.hw, hh: trashBin.hh },
    // WC partition walls (doorway gap at x = 770..825, y = 205 is wide open!)
    { x: 735, y: 154, hw: 6, hh: 50 },
    { x: 752, y: 205, hw: 16, hh: 6 },
    { x: 828, y: 128, hw: 16, hh: 16 },
  ];
  if (!state.hrUnlocked) {
    obs.push({ x: 410, y: 180, hw: 26, hh: 6 });
  }
  if (state.semaverUnlocked) {
    obs.push({ x: semaverStation.x, y: semaverStation.y, hw: 18, hh: 18 });
  }

  stations.forEach(st => {
    if (st.unlocked) obs.push({ x: st.x, y: st.y, hw: st.hw, hh: st.hh });
  });

  obs.push({ x: counters.dineIn.x, y: counters.dineIn.y, hw: counters.dineIn.hw, hh: counters.dineIn.hh });
  if (state.lineUpUnlocked) {
    obs.push({ x: counters.lineUp.x, y: counters.lineUp.y, hw: counters.lineUp.hw, hh: counters.lineUp.hh });
  }
  if (state.driveThruUnlocked) {
    obs.push({ x: counters.driveThru.x, y: counters.driveThru.y, hw: counters.driveThru.hw, hh: counters.driveThru.hh });
  }

  tables.forEach(tb => {
    if (tb.unlocked) obs.push({ x: tb.x, y: tb.y, hw: tb.hw, hh: tb.hh });
  });

  return obs;
}

function resolveObstacleCollision(entity, radius = 14, clampInsideShop = true) {
  const obstacles = getSolidObstacles();

  for (let pass = 0; pass < 3; pass++) {
    if (clampInsideShop) {
      entity.x = Math.max(134, Math.min(842, entity.x));
      entity.y = Math.max(112, Math.min(648, entity.y));
    }

    for (let i = 0; i < obstacles.length; i++) {
      const ob = obstacles[i];
      const closestX = Math.max(ob.x - ob.hw, Math.min(entity.x, ob.x + ob.hw));
      const closestY = Math.max(ob.y - ob.hh, Math.min(entity.y, ob.y + ob.hh));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
        } else {
          const penLeft = Math.abs(entity.x - (ob.x - ob.hw));
          const penRight = Math.abs((ob.x + ob.hw) - entity.x);
          const penTop = Math.abs(entity.y - (ob.y - ob.hh));
          const penBot = Math.abs((ob.y + ob.hh) - entity.y);
          const minPen = Math.min(penLeft, penRight, penTop, penBot);
          if (minPen === penLeft) entity.x = ob.x - ob.hw - radius;
          else if (minPen === penRight) entity.x = ob.x + ob.hw + radius;
          else if (minPen === penTop) entity.y = ob.y - ob.hh - radius;
          else entity.y = ob.y + ob.hh + radius;
        }
      }
    }
  }
}

function resolvePlayerCharacterCollision(playerEntity) {
  const minDist = 17.5;
  const minDistSq = minDist * minDist;

  const blockers = [];
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    if (c.y < 665) blockers.push(c);
  }
  for (let i = 0; i < staffList.length; i++) {
    blockers.push(staffList[i]);
  }
  if (millionaire.active && millionaire.y < 665) blockers.push(millionaire);
  if (guardNPC.active) blockers.push(guardNPC);

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < blockers.length; i++) {
      const b = blockers[i];
      const dx = playerEntity.x - b.x;
      const dy = playerEntity.y - b.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq && dSq > 0.0001) {
        const d = Math.sqrt(dSq);
        const overlap = minDist - d;
        playerEntity.x += (dx / d) * overlap;
        playerEntity.y += (dy / d) * overlap;
      }
    }
  }
}

// ============================================================================
// PROPORTIONATE (0.76x), CLEAN-FACED HUMAN CHARACTER BUILDER
// (Eyes & Brows NEVER Overlap Hair! Clean Forehead & Expressive Face!)
// ============================================================================
function createCharacterRig(config) {
  const group = new THREE.Group();
  // Enlarged character scale (0.96x for Usta, 0.92x for customers/waiters) so characters stand out clearly!
  const defaultScale = config.role === 'usta' ? 0.98 : 0.92;
  const charScale = config.scale || defaultScale;
  group.scale.set(charScale, charScale, charScale);

  const isFemale = config.gender === 'female';

  const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor || 0xffdfc4, roughness: 0.50 });
  const topMat = new THREE.MeshStandardMaterial({
    color: config.role === 'thief' ? 0xffffff : (config.topColor || 0x3b82f6),
    map: config.role === 'thief' ? getStripedThiefTexture() : null,
    roughness: 0.60
  });
  const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor || 0x1e293b, roughness: 0.72 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.45 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.18 });

  // 1. Articulated Legs + Shoes with Hip Pivots (y = 0.76)
  const legGeo = new THREE.CylinderGeometry(0.13, 0.10, 0.72, 14);
  const shoeGeo = new THREE.BoxGeometry(0.21, 0.12, 0.32);

  const leftHipPivot = new THREE.Group();
  leftHipPivot.position.set(-0.17, 0.76, 0);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(0, -0.36, 0);
  leftLeg.castShadow = true;
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0, -0.70, 0.05);
  leftHipPivot.add(leftLeg, leftShoe);

  const rightHipPivot = new THREE.Group();
  rightHipPivot.position.set(0.17, 0.76, 0);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0, -0.36, 0);
  rightLeg.castShadow = true;
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0, -0.70, 0.05);
  rightHipPivot.add(rightLeg, rightShoe);

  group.add(leftHipPivot, rightHipPivot);

  // 2. Torso, Rounded Shoulders & Neck
  const torsoRadiusTop = isFemale ? 0.34 : 0.38;
  const torsoRadiusBot = isFemale ? 0.40 : 0.35;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBot, 1.04, 18), topMat);
  torso.position.set(0, 1.24, 0);
  torso.castShadow = true;
  group.add(torso);

  const shoulderGeo = new THREE.SphereGeometry(0.14, 12, 10);
  const leftShoulder = new THREE.Mesh(shoulderGeo, topMat);
  leftShoulder.position.set(-torsoRadiusTop - 0.05, 1.66, 0);
  const rightShoulder = new THREE.Mesh(shoulderGeo, topMat);
  rightShoulder.position.set(torsoRadiusTop + 0.05, 1.66, 0);
  group.add(leftShoulder, rightShoulder);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.13, 0.22, 12), skinMat);
  neck.position.set(0, 1.82, 0);
  group.add(neck);

  if (config.role === 'usta') {
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const apron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.40, 0.43, 0.92, 16, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
      apronMat
    );
    apron.position.set(0, 1.18, 0.02);
    const sash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.41, 0.41, 0.13, 16),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c })
    );
    sash.position.set(0, 1.20, 0);
    group.add(apron, sash);
  } else if (config.role === 'waiter') {
    const vest = new THREE.Mesh(
      new THREE.CylinderGeometry(torsoRadiusTop + 0.02, torsoRadiusBot + 0.02, 0.92, 16),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.55 })
    );
    vest.position.set(0, 1.24, 0);
    const bowTie = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.08), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    bowTie.position.set(0, 1.68, torsoRadiusTop + 0.01);
    group.add(vest, bowTie);
  } else if (config.role === 'whiteCollar') {
    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.48, 0.06),
      new THREE.MeshStandardMaterial({ color: isFemale ? 0xf43f5e : 0x0284c7 })
    );
    tie.position.set(0, 1.44, torsoRadiusTop + 0.02);
    group.add(tie);
  }

  // Millionaire Gold Necklace & Luxury Medallion
  const goldNecklaceGroup = new THREE.Group();
  const goldChain = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.038, 10, 20), goldMat);
  goldChain.rotation.x = Math.PI * 0.38;
  goldChain.position.set(0, 1.68, 0.14);
  const goldMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14), goldMat);
  goldMedallion.rotation.x = Math.PI / 2;
  goldMedallion.position.set(0, 1.52, 0.37);
  goldNecklaceGroup.add(goldChain, goldMedallion);
  goldNecklaceGroup.visible = false;
  group.add(goldNecklaceGroup);
  group.userData.goldNecklaceGroup = goldNecklaceGroup;

  // 3. Clean Human Head & Facial Features (Face is at +Z, Hair is strictly on Crown & Back!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.16, 0);
  group.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 22), skinMat);
  headMesh.scale.set(0.96, 1.05, 0.96);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  const earGeo = new THREE.SphereGeometry(0.06, 10, 10);
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.scale.set(0.5, 1.1, 0.7);
  leftEar.position.set(-0.33, 0.0, 0);
  const rightEar = leftEar.clone();
  rightEar.position.set(0.33, 0.0, 0);
  headGroup.add(leftEar, rightEar);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.044, 0.10, 10), skinMat);
  nose.rotation.x = Math.PI * 0.42;
  nose.position.set(0, -0.02, 0.35);
  headGroup.add(nose);

  // Eyes placed cleanly on front face (y = 0.03, z = 0.335) — well below the hairline!
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeGeo = new THREE.SphereGeometry(0.046, 12, 12);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.scale.set(1.0, 1.12, 0.35);
  leftEye.position.set(-0.115, 0.03, 0.332);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.scale.set(1.0, 1.12, 0.35);
  rightEye.position.set(0.115, 0.03, 0.332);

  const shineGeo = new THREE.SphereGeometry(0.016, 8, 8);
  const leftShine = new THREE.Mesh(shineGeo, scleraMat);
  leftShine.position.set(-0.10, 0.048, 0.35);
  const rightShine = new THREE.Mesh(shineGeo, scleraMat);
  rightShine.position.set(0.13, 0.048, 0.35);
  headGroup.add(leftEye, rightEye, leftShine, rightShine);

  const browGeo = new THREE.BoxGeometry(0.105, 0.024, 0.028);
  const leftBrow = new THREE.Mesh(browGeo, darkMat);
  leftBrow.position.set(-0.115, 0.115, 0.33);
  const rightBrow = new THREE.Mesh(browGeo, darkMat);
  rightBrow.position.set(0.115, 0.115, 0.33);
  headGroup.add(leftBrow, rightBrow);

  if (!isFemale && (config.role === 'usta' || config.role === 'guard' || config.hair === 'mustache')) {
    const mustGroup = new THREE.Group();
    const mLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.05, 0.16, 10), darkMat);
    mLeft.rotation.z = Math.PI * 0.42;
    mLeft.position.set(-0.07, -0.09, 0.33);
    const mRight = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.05, 0.16, 10), darkMat);
    mRight.rotation.z = -Math.PI * 0.42;
    mRight.position.set(0.07, -0.09, 0.33);
    mustGroup.add(mLeft, mRight);
    headGroup.add(mustGroup);
  } else {
    const lipColor = isFemale ? 0xe11d48 : 0x78350f;
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.014, 8, 12, Math.PI), new THREE.MeshBasicMaterial({ color: lipColor }));
    smile.rotation.x = Math.PI;
    smile.position.set(0, -0.09, 0.33);
    headGroup.add(smile);
  }

  // 4. Clean Hair / Hat Geometry — Tilted Back so it NEVER touches the Eyes or Forehead!
  const hairColors = [0x1c1917, 0x451a03, 0x78350f, 0x92400e, 0x3f2e21];
  const hairCol = config.hairColor || hairColors[Math.floor(Math.random() * hairColors.length)];
  const hairMat = new THREE.MeshStandardMaterial({ color: hairCol, roughness: 0.55 });

  if (config.role === 'usta') {
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.34, 0.26, 16), hatMat);
    hatBase.position.set(0, 0.35, 0);
    const hatPuff = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), hatMat);
    hatPuff.position.set(0, 0.52, 0);
    headGroup.add(hatBase, hatPuff);
  } else if (config.role === 'guard') {
    const capMat = new THREE.MeshStandardMaterial({ color: 0x172554 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.35, 0.20, 14), capMat);
    cap.position.set(0, 0.34, 0);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.22), darkMat);
    visor.position.set(0, 0.25, 0.26);
    headGroup.add(cap, visor);
  } else if (config.role === 'thief') {
    // Black Bandit Eye Mask + Knit Beanie on top of head
    const maskBand = new THREE.Mesh(new THREE.CylinderGeometry(0.355, 0.355, 0.12, 20), darkMat);
    maskBand.position.set(0, 0.03, 0);
    const maskFront = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.13, 0.14), darkMat);
    maskFront.position.set(0, 0.03, 0.27);
    const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.365, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.44), darkMat);
    beanie.rotation.x = -0.28;
    beanie.position.set(0, 0.07, -0.02);
    headGroup.add(maskBand, maskFront, beanie);
  } else {
    // Tilted-back Hair Cap (thetaLength = 0.44 * PI, rotated -0.38 rad back) so forehead & eyes are 100% clear!
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.368, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.44),
      hairMat
    );
    hairCap.rotation.x = -0.38;
    hairCap.position.set(0, 0.06, -0.03);
    headGroup.add(hairCap);

    if (isFemale) {
      if (config.hair === 'headscarf') {
        // Open-face headscarf: wraps top, sides and back while leaving face (z > 0.12) completely open!
        const scarfMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65 });
        const scarfDome = new THREE.Mesh(
          new THREE.SphereGeometry(0.38, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
          scarfMat
        );
        scarfDome.rotation.x = -0.48;
        scarfDome.position.set(0, 0.03, -0.04);
        const scarfNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.24, 14), scarfMat);
        scarfNeck.position.set(0, -0.26, -0.04);
        headGroup.add(scarfDome, scarfNeck);
      } else {
        // Long flowing back hair & stylish bun behind the ears (never covers the eyes!)
        const backLocks = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.50, 0.20), hairMat);
        backLocks.position.set(0, -0.14, -0.24);
        const topBun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), hairMat);
        topBun.position.set(0, 0.26, -0.26);
        headGroup.add(backLocks, topBun);

        const goldEarringL = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.012, 8, 12), goldMat);
        goldEarringL.position.set(-0.34, -0.07, 0.0);
        const goldEarringR = goldEarringL.clone();
        goldEarringR.position.set(0.34, -0.07, 0.0);
        headGroup.add(goldEarringL, goldEarringR);
      }
    } else {
      // High crown hair wave on top of head (y = 0.36, well above eyebrows at y = 0.115!)
      const topWave = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), hairMat);
      topWave.scale.set(1.2, 0.55, 0.9);
      topWave.position.set(0, 0.34, 0.05);
      headGroup.add(topWave);
    }
  }

  // 5. Articulated Arms, Hands, Gold Watch, Designer Handbag & Hand-Held Tea Glass!
  const armOffsetX = torsoRadiusTop + 0.09;
  const sleeveGeo = new THREE.CylinderGeometry(0.11, 0.095, 0.30, 12);
  const forearmGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.38, 12);
  const handGeo = new THREE.SphereGeometry(0.09, 10, 10);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-armOffsetX, 1.64, 0);
  const leftSleeve = new THREE.Mesh(sleeveGeo, topMat);
  leftSleeve.position.set(0, -0.14, 0);
  const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
  leftForearm.position.set(0, -0.42, 0);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(0, -0.62, 0);

  const goldWatchGroup = new THREE.Group();
  const watchStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 12), goldMat);
  const watchDial = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5 }));
  watchDial.rotation.z = Math.PI / 2;
  watchDial.position.set(-0.08, 0, 0);
  goldWatchGroup.add(watchStrap, watchDial);
  goldWatchGroup.position.set(0, -0.52, 0);
  goldWatchGroup.visible = config.role !== 'millionaire';
  leftArmPivot.add(leftSleeve, leftForearm, leftHand, goldWatchGroup);
  group.userData.goldWatchGroup = goldWatchGroup;

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(armOffsetX, 1.64, 0);
  const rightSleeve = new THREE.Mesh(sleeveGeo, topMat);
  rightSleeve.position.set(0, -0.14, 0);
  const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
  rightForearm.position.set(0, -0.42, 0);
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(0, -0.62, 0);
  rightArmPivot.add(rightSleeve, rightForearm, rightHand);

  // Luxury Designer Handbag for Female Millionaire
  const designerBagGroup = new THREE.Group();
  designerBagGroup.position.set(0.08, -0.68, 0.06);
  const bagStrap = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 16, Math.PI), goldMat);
  bagStrap.position.y = 0.14;
  const bagBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.30, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.25, metalness: 0.2 })
  );
  const bagClasp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.10), goldMat);
  bagClasp.position.y = 0.08;
  designerBagGroup.add(bagStrap, bagBody, bagClasp);
  designerBagGroup.visible = false;
  rightArmPivot.add(designerBagGroup);
  group.userData.designerBagGroup = designerBagGroup;

  if (config.role === 'whiteCollar') {
    const briefcase = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.34, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 })
    );
    briefcase.position.set(0.08, -0.72, 0);
    rightArmPivot.add(briefcase);
  }

  group.add(leftArmPivot, rightArmPivot);

  let knifeGroup = null;
  if (config.role === 'usta') {
    knifeGroup = new THREE.Group();
    knifeGroup.position.set(0, -0.62, 0.15);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8), darkMat);
    handle.rotation.x = Math.PI / 2;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.13, 1.05),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.15 })
    );
    blade.position.set(0, 0, 0.60);
    knifeGroup.add(handle, blade);
    knifeGroup.visible = false;
    rightArmPivot.add(knifeGroup);
  }

  const trayGroup = new THREE.Group();
  trayGroup.position.set(0, 1.22, 0.62);
  group.add(trayGroup);

  scene.add(group);

  return {
    group,
    torso,
    leftShoulder,
    rightShoulder,
    leftSleeve,
    rightSleeve,
    headGroup,
    headMesh,
    leftBrow,
    rightBrow,
    leftHipPivot,
    rightHipPivot,
    leftLeg,
    rightLeg,
    leftArmPivot,
    rightArmPivot,
    knifeGroup,
    trayGroup,
    skinMat,
    topMat,
    pantsMat
  };
}

// ============================================================================
// 3D ASSETS: REFERENCE PORCELAIN TEA SAUCER + İNCE BELLİ ÇAY BARDAĞI & FOODS
// ============================================================================
function createInceBelliCayMesh(largeForHand = false) {
  const g = new THREE.Group();

  // 1) Authentic Red & Gold Turkish Porcelain Tea Saucer (Çay Tabağı) using Uploaded Reference Image!
  const saucerRadius = largeForHand ? 0.26 : 0.19;
  const saucerBase = new THREE.Mesh(
    new THREE.CylinderGeometry(saucerRadius, saucerRadius * 0.68, 0.032, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })
  );
  saucerBase.position.y = 0.016;
  g.add(saucerBase);

  const saucerTex = getCayTabagiTexture();
  const saucerTopDisc = new THREE.Mesh(
    new THREE.CircleGeometry(saucerRadius * 0.98, 24),
    new THREE.MeshBasicMaterial({
      map: saucerTex || null,
      color: 0xffffff
    })
  );
  saucerTopDisc.rotation.x = -Math.PI / 2;
  saucerTopDisc.position.y = 0.033;
  g.add(saucerTopDisc);

  // 2) Classic Waisted Turkish Tea Glass (İnce Belli Çay Bardağı) via LatheGeometry
  const s = largeForHand ? 1.35 : 1.0;
  const glassPoints = [
    new THREE.Vector2(0.00, 0.034),
    new THREE.Vector2(0.075 * s, 0.034),
    new THREE.Vector2(0.086 * s, 0.105 * s),
    new THREE.Vector2(0.048 * s, 0.180 * s), // Iconic narrow waist (ince bel)
    new THREE.Vector2(0.082 * s, 0.265 * s),
    new THREE.Vector2(0.092 * s, 0.315 * s)
  ];
  const glassGeo = new THREE.LatheGeometry(glassPoints, 18);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.48,
    roughness: 0.08,
    metalness: 0.1
  });
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);

  // Ruby-Red Brewed Turkish Tea (Tavşan Kanı Çay)
  const teaPoints = [
    new THREE.Vector2(0.00, 0.038),
    new THREE.Vector2(0.068 * s, 0.038),
    new THREE.Vector2(0.078 * s, 0.105 * s),
    new THREE.Vector2(0.044 * s, 0.180 * s),
    new THREE.Vector2(0.074 * s, 0.255 * s),
    new THREE.Vector2(0.00, 0.255 * s)
  ];
  const teaGeo = new THREE.LatheGeometry(teaPoints, 16);
  const teaMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    emissive: 0x7f1d1d,
    roughness: 0.18
  });
  const teaMesh = new THREE.Mesh(teaGeo, teaMat);

  // Tiny silver teaspoon & sugar cube on the saucer rim
  const sugar = new THREE.Mesh(
    new THREE.BoxGeometry(0.045 * s, 0.032 * s, 0.045 * s),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  sugar.position.set(saucerRadius * 0.58, 0.048, 0.03);

  g.add(glassMesh, teaMesh, sugar);
  return g;
}

function createFoodMesh(key) {
  const g = new THREE.Group();

  if (key === 'cay') {
    return createInceBelliCayMesh(true);
  }

  if (key === 'wc_trash') {
    return createWCNapkinClutterMesh();
  }

  if (key === 'trash') {
    // Realistic Turkish Döner Table Leftovers (Tray, Saucy Plate, Half-Eaten Bread Crust, Crumpled Foil/Paper, Empty Ayran Cup & Napkins)
    const trayBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.035, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 })
    );
    trayBase.position.y = 0.018;

    const dirtyPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.20, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
    );
    dirtyPlate.position.set(-0.08, 0.045, 0.02);

    const sauceStain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.044, 12),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75 })
    );
    sauceStain.position.set(-0.06, 0.048, 0.01);

    // Half-eaten sesame bread crust (ekmek köşesi) + leftover lettuce & tomato slice
    const breadCrust = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 })
    );
    breadCrust.scale.set(1.35, 0.55, 0.85);
    breadCrust.position.set(-0.14, 0.085, 0.05);

    const breadCrumbInner = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.05, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85 })
    );
    breadCrumbInner.position.set(-0.08, 0.08, 0.05);

    const leftoverLettuce = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.02, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 })
    );
    leftoverLettuce.position.set(-0.02, 0.072, -0.04);

    const pickledPepper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.008, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.5 })
    );
    pickledPepper.rotation.z = Math.PI / 2;
    pickledPepper.rotation.y = 0.4;
    pickledPepper.position.set(-0.05, 0.075, 0.10);

    // Crumpled greasy doner wrap paper & used napkins
    const crumpledWrap = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.11, 0),
      new THREE.MeshStandardMaterial({ color: 0xfef2f2, roughness: 0.88 })
    );
    crumpledWrap.scale.set(1.2, 0.75, 1.0);
    crumpledWrap.position.set(0.16, 0.085, 0.09);

    const usedNapkin = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.075, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })
    );
    usedNapkin.position.set(0.06, 0.07, 0.14);

    // Tipped-over empty plastic Ayran cup with blue band & peeled foil lid
    const emptyAyranGroup = new THREE.Group();
    const cupBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.068, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    const cupBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.087, 0.082, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    const foilLid = new THREE.Mesh(
      new THREE.CircleGeometry(0.082, 10),
      new THREE.MeshStandardMaterial({ color: 0x0d9488, metalness: 0.5, side: THREE.DoubleSide })
    );
    foilLid.position.set(0.04, 0.12, 0);
    foilLid.rotation.z = -0.6;
    emptyAyranGroup.add(cupBody, cupBand, foilLid);
    emptyAyranGroup.rotation.z = Math.PI * 0.46;
    emptyAyranGroup.rotation.y = 0.55;
    emptyAyranGroup.position.set(0.17, 0.095, -0.09);

    g.add(
      trayBase,
      dirtyPlate,
      sauceStain,
      breadCrust,
      breadCrumbInner,
      leftoverLettuce,
      pickledPepper,
      crumpledWrap,
      usedNapkin
    );
    const ayranUnlockedNow = (typeof stations !== 'undefined') && stations.some(s => s.id === 'ayran1' && s.unlocked);
    if (ayranUnlockedNow) {
      g.add(emptyAyranGroup);
    }
    return g;
  }

  if (key === 'ayran') {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 12), whiteMat);
    belly.scale.set(1.0, 1.15, 1.0);
    belly.position.y = 0.17;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.15, 12), whiteMat);
    base.position.y = 0.075;

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.14, 0.15, 12), whiteMat);
    neck.position.y = 0.35;

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.095, 0.055, 12),
      new THREE.MeshStandardMaterial({ color: 0x0d9488, metalness: 0.4, roughness: 0.3 })
    );
    cap.position.y = 0.44;

    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.203, 0.203, 0.09, 14),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    label.position.y = 0.17;

    g.add(base, belly, neck, cap, label);
    return g;
  }

  if (key === 'salgam') {
    const bottleMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.2 });
    const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.30, 12), bottleMat);
    belly.position.y = 0.15;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 0.14, 12), bottleMat);
    neck.position.y = 0.34;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    cap.position.y = 0.43;
    g.add(belly, neck, cap);
    return g;
  }

  if (key === 'durum') {
    // Authentic Zurna Tavuk Dürüm modeled directly after the user's uploaded reference photo!
    // Features toasted blistered lavash tortilla wrap + open front rim stuffed with glazed chicken chunks, green peppers & onions!
    const wrapGroup = new THREE.Group();
    wrapGroup.position.y = 0.14;
    wrapGroup.rotation.y = -0.32;

    const lavashMat = new THREE.MeshStandardMaterial({
      map: getToastedLavashTexture(),
      roughness: 0.62,
      metalness: 0.02
    });

    // Long rolled Zurna Lavash body (slightly tapered from open front to folded back)
    const lavashRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.132, 0.72, 20, 1, false),
      lavashMat
    );
    lavashRoll.rotation.z = Math.PI / 2;
    wrapGroup.add(lavashRoll);

    // Rolled lavash dough lip around the open front mouth (+X end)
    const openLip = new THREE.Mesh(
      new THREE.TorusGeometry(0.138, 0.016, 10, 20),
      new THREE.MeshStandardMaterial({ color: 0xf5e1bf, roughness: 0.65 })
    );
    openLip.rotation.y = Math.PI / 2;
    openLip.position.set(0.36, 0, 0);
    wrapGroup.add(openLip);

    // Deep saucy interior backdrop at the open mouth
    const sauceBase = new THREE.Mesh(
      new THREE.CircleGeometry(0.13, 16),
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.35 })
    );
    sauceBase.rotation.y = Math.PI / 2;
    sauceBase.position.set(0.355, 0, 0);
    wrapGroup.add(sauceBase);

    // Glazed, saucy roasted chicken doner chunks packed inside the open end
    const chickenColors = [0xc2410c, 0xb45309, 0x9a3412, 0xd97706, 0xa16207];
    const chunkOffsets = [
      [0.37, 0.055, 0.045, 0.052],
      [0.375, -0.05, 0.05, 0.050],
      [0.37, 0.045, -0.05, 0.048],
      [0.38, -0.045, -0.045, 0.052],
      [0.385, 0.0, 0.005, 0.056],
      [0.365, -0.08, 0.0, 0.042],
      [0.365, 0.08, -0.01, 0.040]
    ];
    chunkOffsets.forEach(([cx, cy, cz, cr], idx) => {
      const chunk = new THREE.Mesh(
        new THREE.DodecahedronGeometry(cr, 1),
        new THREE.MeshStandardMaterial({
          color: chickenColors[idx % chickenColors.length],
          roughness: 0.24, // Glossy tomato-pepper sauce glaze!
          metalness: 0.08
        })
      );
      chunk.scale.set(0.85, 1.05, 0.92);
      chunk.position.set(cx, cy, cz);
      wrapGroup.add(chunk);
    });

    // Fresh green pepper strips tucked between the chicken chunks
    const pepperMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35 });
    const pep1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.095, 0.024), pepperMat);
    pep1.position.set(0.382, 0.02, 0.035);
    pep1.rotation.x = 0.4;
    const pep2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.085, 0.024), pepperMat);
    pep2.position.set(0.380, -0.025, -0.02);
    pep2.rotation.x = -0.35;
    wrapGroup.add(pep1, pep2);

    // Sliced white onion arcs inside the wrap mouth
    const onionMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.3 });
    const onion1 = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.012, 6, 12, Math.PI * 0.85), onionMat);
    onion1.rotation.y = Math.PI / 2;
    onion1.position.set(0.382, -0.01, 0.04);
    const onion2 = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 6, 12, Math.PI * 0.8), onionMat);
    onion2.rotation.y = Math.PI / 2;
    onion2.rotation.x = 1.8;
    onion2.position.set(0.380, 0.03, -0.035);
    wrapGroup.add(onion1, onion2);

    g.add(wrapGroup);
    return g;
  }

  if (key === 'iskender') {
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.25, 0.07, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.65, roughness: 0.25 })
    );
    plate.position.y = 0.04;
    const meatMound = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 })
    );
    meatMound.scale.set(1.1, 0.45, 0.9);
    meatMound.position.set(-0.04, 0.10, 0);
    const yogurt = new THREE.Mesh(
      new THREE.SphereGeometry(0.10, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    yogurt.scale.set(1, 0.5, 1);
    yogurt.position.set(0.15, 0.10, 0.05);
    g.add(plate, meatMound, yogurt);
    return g;
  }

  // Default ('doner'): Tombul Ekmek Arası Tavuk Döner
  const breadCrustMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 });
  const breadCrumbMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });

  const bottomBun = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 10), breadCrustMat);
  bottomBun.scale.set(1.3, 0.36, 0.82);
  bottomBun.position.y = 0.06;

  const meatFilling = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.07, 0.30),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 })
  );
  meatFilling.position.set(0.03, 0.12, 0);

  const lettuce = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.035, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 })
  );
  lettuce.position.set(0.04, 0.09, 0.02);

  const tomato1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.03, 10),
    new THREE.MeshStandardMaterial({ color: 0xdc2626 })
  );
  tomato1.position.set(0.12, 0.14, 0.07);

  const topBun = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), breadCrustMat);
  topBun.scale.set(1.3, 0.45, 0.82);
  topBun.position.set(0, 0.16, 0);

  const slash = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.05), breadCrumbMat);
  slash.position.set(0.02, 0.27, 0);
  slash.rotation.y = 0.25;

  const wrapper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef2f2, roughness: 0.7 })
  );
  wrapper.rotation.z = Math.PI / 2;
  wrapper.scale.set(0.85, 1.0, 0.85);
  wrapper.position.set(-0.16, 0.12, 0);

  g.add(bottomBun, lettuce, meatFilling, tomato1, topBun, slash, wrapper);
  return g;
}

// ============================================================================
// BUILD 3D WORLD: WOODEN DOOR, PLAYER-ONLY HR ROOM, WC LEMON COLOGNE & MAHALLE
// ============================================================================
let driveThruWallMesh = null;
let barrierArmMesh = null;
let semaverGroup = null;
let activeUnlockPadMesh = null;
let activeUnlockFillMesh = null;
let activeUnlockHoloMesh = null;
let leftDoorPivot = null;
let rightDoorPivot = null;
let mahalleExteriorGroup = null;
let luxuryExteriorGroup = null;
let millionaireSpotlightMesh = null;
let millionaireMagicGroup = null;
let thiefDangerRingMesh = null;
let lineCutterRingMesh = null;
const streetCats = [];
const ambientPedestrians = [];
const seagulls = [];
let bosphorusWaterMesh = null;
let waterReflectionMesh = null;
let bosphorusFerryGroup = null;
let bosphorusBridgeLights = [];
let kizKulesiBeacon = null;
let sunMesh = null;
let moonMesh = null;
let starsGroup = null;
let tavlaDede1 = null;
let tavlaDede2 = null;

function buildWorld3D() {
  const outdoorGround = new THREE.Mesh(
    new THREE.PlaneGeometry(170, 150),
    new THREE.MeshStandardMaterial({ color: 0x293818, roughness: 0.95 })
  );
  outdoorGround.rotation.x = -Math.PI / 2;
  outdoorGround.position.y = -0.15;
  outdoorGround.receiveShadow = true;
  scene.add(outdoorGround);

  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(92, 0.14, 6.6),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 })
  );
  sidewalk.position.set(0, -0.02, to3DZ(740));
  sidewalk.receiveShadow = true;
  scene.add(sidewalk);

  const streetAsphalt = new THREE.Mesh(
    new THREE.BoxGeometry(110, 0.12, 10),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
  );
  streetAsphalt.position.set(0, -0.05, to3DZ(838));
  streetAsphalt.receiveShadow = true;
  scene.add(streetAsphalt);

  const darkFloorMat = new THREE.MeshStandardMaterial({
    map: getDarkFloorTexture(),
    roughness: 0.65,
    metalness: 0.05
  });
  const shopFloor = new THREE.Mesh(new THREE.BoxGeometry(37.5, 0.2, 29.5), darkFloorMat);
  shopFloor.position.set(-0.5, 0, -0.5);
  shopFloor.receiveShadow = true;
  scene.add(shopFloor);

  const kitchenFloor = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 0.22, 29.5),
    new THREE.MeshStandardMaterial({ color: 0x332922, roughness: 0.6 })
  );
  kitchenFloor.position.set(-14.5, 0.01, -0.5);
  kitchenFloor.receiveShadow = true;
  scene.add(kitchenFloor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xdfd3c3, roughness: 0.8 });
  const woodDadoMat = new THREE.MeshStandardMaterial({ map: getNaturalWoodTexture(), roughness: 0.65 });
  const motifMat = new THREE.MeshStandardMaterial({ map: getWallMotifTexture(), roughness: 0.55 });
  const woodTrimMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, transparent: true, opacity: 0.30, roughness: 0.15 });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(37.5, 3.8, 0.8), wallMat);
  backWall.position.set(-0.5, 1.9, -15.2);
  backWall.castShadow = true;
  scene.add(backWall);

  const backDado = new THREE.Mesh(new THREE.BoxGeometry(37.4, 1.15, 0.88), woodDadoMat);
  backDado.position.set(-0.5, 0.58, -15.16);
  scene.add(backDado);

  const backMotifStrip = new THREE.Mesh(new THREE.BoxGeometry(37.4, 0.42, 0.9), motifMat);
  backMotifStrip.position.set(-0.5, 1.35, -15.15);
  scene.add(backMotifStrip);

  // Left Wall Segments — Non-overlapping Z ranges & slightly higher top beam (y=3.18, h=0.68) so there is ZERO Z-fighting!
  const leftWallBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.5, 6.2), wallMat);
  leftWallBack.position.set(-19.1, 1.75, -12.1); // z: -15.20 to -9.00
  const leftWallFront = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.5, 9.5), wallMat);
  leftWallFront.position.set(-19.1, 1.75, 9.4);  // z: +4.65 to +14.15
  const leftWallTopBeam = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.68, 13.62), woodTrimMat);
  leftWallTopBeam.position.set(-19.1, 3.18, -2.175); // Strictly spans the open bay gap z: -8.985 to +4.635!
  scene.add(leftWallBack, leftWallFront, leftWallTopBeam);

  buildWallDecorations3D();
  buildWarmInvisibleLights3D();
  buildHROfficeRoom3D();

  // Front Wall + TRADITIONAL CARVED WOODEN DOUBLE ENTRANCE DOOR
  const frontZ = to3DZ(668);
  const doorCenterX = to3DX(490);

  const frontLeftBase = new THREE.Mesh(new THREE.BoxGeometry(16.2, 1.1, 0.7), woodTrimMat);
  frontLeftBase.position.set(-11.0, 0.55, frontZ);
  const frontLeftGlass = new THREE.Mesh(new THREE.BoxGeometry(15.6, 1.8, 0.25), glassMat);
  frontLeftGlass.position.set(-11.0, 1.9, frontZ);
  scene.add(frontLeftBase, frontLeftGlass);

  const frontRightBase = new THREE.Mesh(new THREE.BoxGeometry(15.8, 1.1, 0.7), woodTrimMat);
  frontRightBase.position.set(9.8, 0.55, frontZ);
  const frontRightGlass = new THREE.Mesh(new THREE.BoxGeometry(15.2, 1.8, 0.25), glassMat);
  frontRightGlass.position.set(9.8, 1.9, frontZ);
  scene.add(frontRightBase, frontRightGlass);

  const postGeo = new THREE.BoxGeometry(0.52, 3.3, 0.85);
  const leftPost = new THREE.Mesh(postGeo, woodTrimMat);
  leftPost.position.set(doorCenterX - 2.3, 1.65, frontZ);
  const rightPost = new THREE.Mesh(postGeo, woodTrimMat);
  rightPost.position.set(doorCenterX + 2.3, 1.65, frontZ);
  const topArch = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 0.95), motifMat);
  topArch.position.set(doorCenterX, 3.15, frontZ);
  scene.add(leftPost, rightPost, topArch);

  const carvedWoodMat = new THREE.MeshStandardMaterial({ map: getNaturalWoodTexture(), color: 0x7c4722, roughness: 0.52 });
  const darkPanelMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.65 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });

  function createWoodenDoorLeaf(dirSign) {
    const leafGroup = new THREE.Group();
    const offset = dirSign * 1.025;

    const plankBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 2.85, 0.20), carvedWoodMat);
    plankBody.position.set(offset, 1.42, 0);
    plankBody.castShadow = true;
    leafGroup.add(plankBody);

    const botPanel = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.82, 0.25), darkPanelMat);
    botPanel.position.set(offset, 0.62, 0);
    const midPanel = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.72, 0.25), darkPanelMat);
    midPanel.position.set(offset, 1.52, 0);
    leafGroup.add(botPanel, midPanel);

    const upperGlass = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.55, 0.23), glassMat);
    upperGlass.position.set(offset, 2.36, 0);
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.58, 0.26), darkPanelMat);
    mullionV.position.set(offset, 2.36, 0);
    leafGroup.add(upperGlass, mullionV);

    const handleX = dirSign * 1.78;
    const brassPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.26), brassMat);
    brassPlate.position.set(handleX, 1.35, 0);
    const brassRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 16), brassMat);
    brassRing.position.set(handleX, 1.32, 0.15);
    leafGroup.add(brassPlate, brassRing);

    return leafGroup;
  }

  leftDoorPivot = new THREE.Group();
  leftDoorPivot.position.set(doorCenterX - 2.1, 0, frontZ);
  leftDoorPivot.add(createWoodenDoorLeaf(1));
  scene.add(leftDoorPivot);

  rightDoorPivot = new THREE.Group();
  rightDoorPivot.position.set(doorCenterX + 2.1, 0, frontZ);
  rightDoorPivot.add(createWoodenDoorLeaf(-1));
  scene.add(rightDoorPivot);

  buildRestroomWC3D();
  buildTrashContainer3D();
  buildKitchenSupplyAndFridge3D();

  const driveRoad = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.18, 36),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
  );
  driveRoad.position.set(22.0, -0.02, 0);
  driveRoad.receiveShadow = true;
  scene.add(driveRoad);

  for (let dz = -14; dz <= 14; dz += 4) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.2, 1.8),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    stripe.position.set(22.0, 0.02, dz);
    scene.add(stripe);
  }

  driveThruWallMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 29.5), woodTrimMat);
  driveThruWallMesh.position.set(17.8, 1.6, -0.5);
  driveThruWallMesh.castShadow = true;
  scene.add(driveThruWallMesh);

  barrierArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, 0.35, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  barrierArmMesh.position.set(22.0, 1.5, to3DZ(195));
  barrierArmMesh.visible = false;
  scene.add(barrierArmMesh);

  // Special Spotlight Floor Rings for Millionaire (VIP), Thief & Line-Cutter (Kaynakçı)!
  millionaireSpotlightMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 1.05, 28),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  millionaireSpotlightMesh.rotation.x = -Math.PI / 2;
  millionaireSpotlightMesh.position.y = 0.16;
  millionaireSpotlightMesh.visible = false;
  scene.add(millionaireSpotlightMesh);

  // Magical 3D Golden Vortex, Light Halos & Gem Storm for the Secret Millionaire Transformation!
  millionaireMagicGroup = new THREE.Group();
  millionaireMagicGroup.visible = false;
  const haloMat1 = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 });
  const haloMat2 = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.75 });
  const magicHalo1 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 12, 32), haloMat1);
  magicHalo1.rotation.x = Math.PI / 2;
  const magicHalo2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.05, 12, 32), haloMat2);
  magicHalo2.rotation.x = Math.PI / 2;
  millionaireMagicGroup.add(magicHalo1, magicHalo2);
  millionaireMagicGroup.userData.halo1 = magicHalo1;
  millionaireMagicGroup.userData.halo2 = magicHalo2;

  const gemColors = [0xfacc15, 0xfef08a, 0x38bdf8, 0x4ade80, 0xf43f5e];
  const magicGems = [];
  for (let i = 0; i < 24; i++) {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12 + (i % 3) * 0.04, 0),
      new THREE.MeshBasicMaterial({ color: gemColors[i % gemColors.length] })
    );
    gem.userData = {
      angleOffset: (i / 24) * Math.PI * 2,
      radius: 0.65 + (i % 4) * 0.25,
      heightOffset: (i / 24) * 2.6,
      speed: 3.5 + (i % 3) * 1.2
    };
    millionaireMagicGroup.add(gem);
    magicGems.push(gem);
  }
  millionaireMagicGroup.userData.gems = magicGems;
  scene.add(millionaireMagicGroup);

  thiefDangerRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.60, 0.95, 24),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  thiefDangerRingMesh.rotation.x = -Math.PI / 2;
  thiefDangerRingMesh.position.y = 0.16;
  thiefDangerRingMesh.visible = false;
  scene.add(thiefDangerRingMesh);

  lineCutterRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.58, 0.92, 24),
    new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide })
  );
  lineCutterRingMesh.rotation.x = -Math.PI / 2;
  lineCutterRingMesh.position.y = 0.16;
  lineCutterRingMesh.visible = false;
  scene.add(lineCutterRingMesh);

  buildIstanbulBosphorusAndSky3D();
  buildExteriorNeighborhood3D();
  buildStreetCats3D();
  initAmbientPedestrians();

  stations.forEach(st => buildStation3D(st));
  Object.values(counters).forEach(cnt => buildCounter3D(cnt));
  tables.forEach(tb => buildTable3D(tb));
  buildSemaver3D();
  buildUnlockPad3D();

  rebuildWorldVisibility();
}

// ============================================================================
// DEDICATED PLAYER-ONLY 3D HR ROOM (x = 340..480, y = 104..180)
// ============================================================================
function buildHROfficeRoom3D() {
  const roomGroup = new THREE.Group();

  const roomFloor = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, 0.24, 3.8),
    new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.45 })
  );
  roomFloor.position.set(to3DX(410), 0.02, to3DZ(142));
  scene.add(roomFloor);

  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.05, 2.4),
    new THREE.MeshStandardMaterial({ map: getKilimCushionTexture(), roughness: 0.85 })
  );
  rug.position.set(to3DX(410), 0.14, to3DZ(148));
  roomGroup.add(rug);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe7ddd0, roughness: 0.7 });
  const woodTrimMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.55 });
  const glassPaneMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, transparent: true, opacity: 0.35 });

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.40, 2.75, 3.8), wallMat);
  leftWall.position.set(to3DX(340), 1.38, to3DZ(142));
  leftWall.castShadow = true;

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.40, 2.75, 3.8), wallMat);
  rightWall.position.set(to3DX(480), 1.38, to3DZ(142));
  rightWall.castShadow = true;

  const frontLeftWall = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 0.40), wallMat);
  frontLeftWall.position.set(to3DX(362), 0.68, to3DZ(180));
  const frontLeftGlass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.15, 0.18), glassPaneMat);
  frontLeftGlass.position.set(to3DX(362), 1.95, to3DZ(180));

  const frontRightWall = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 0.40), wallMat);
  frontRightWall.position.set(to3DX(458), 0.68, to3DZ(180));
  const frontRightGlass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.15, 0.18), glassPaneMat);
  frontRightGlass.position.set(to3DX(458), 1.95, to3DZ(180));

  const doorHeaderBeam = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.38, 0.46), woodTrimMat);
  doorHeaderBeam.position.set(to3DX(410), 2.68, to3DZ(180));

  const hrSign = createSignboard3D('🏢 İK / HR ODASI', 'USTA & GARSON GELİŞTİRME', '#451a03', '#f59e0b', 3.5, 0.78);
  hrSign.position.set(to3DX(410), 3.25, to3DZ(180));

  roomGroup.add(leftWall, rightWall, frontLeftWall, frontLeftGlass, frontRightWall, frontRightGlass, doorHeaderBeam, hrSign);

  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.30, 1.15),
    new THREE.MeshStandardMaterial({ map: getNaturalWoodTexture(), roughness: 0.55 })
  );
  desk.position.set(to3DX(hrOffice.deskX), 0.65, to3DZ(hrOffice.deskY));
  desk.castShadow = true;

  const chair = new THREE.Mesh(
    new THREE.BoxGeometry(0.90, 1.60, 0.80),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.5 })
  );
  chair.position.set(to3DX(hrOffice.deskX), 0.80, to3DZ(110));

  const ledger = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.12, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
  );
  ledger.position.set(to3DX(hrOffice.deskX) - 0.45, 1.36, to3DZ(hrOffice.deskY));

  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.15 })
  );
  bell.position.set(to3DX(hrOffice.deskX) + 0.55, 1.36, to3DZ(hrOffice.deskY));

  const padFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.08, 1.3),
    new THREE.MeshStandardMaterial({ color: 0xb45309, emissive: 0x451a03 })
  );
  padFrame.position.set(to3DX(hrOffice.padX), 0.16, to3DZ(hrOffice.padY));

  roomGroup.add(desk, chair, ledger, bell, padFrame);
  hrOffice.roomGroup = roomGroup;
  scene.add(roomGroup);
}

// ============================================================================
// İSTANBUL BOĞAZI PANORAMA (BOĞAZ KÖPRÜSÜ, KIZ KULESİ, ŞEHİR HATLARI VAPURU,
// UÇUŞAN TATLI MARTILAR & DOĞU-BATI GÜNEŞ / GÜN BATIMI / DOLUNAY GECE GÖKYÜZÜ)
// ============================================================================
function buildIstanbulBosphorusAndSky3D() {
  // 1) Stone Bosphorus Quay Promenade & Wrought-Iron Railing behind the restaurant (z = -16.2)
  const quaySlab = new THREE.Mesh(
    new THREE.BoxGeometry(150, 0.55, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
  );
  quaySlab.position.set(0, -0.08, -16.8);
  scene.add(quaySlab);

  const railMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(120, 0.08, 0.08), railMat);
  topRail.position.set(0, 0.95, -18.0);
  scene.add(topRail);
  for (let rx = -56; rx <= 56; rx += 4) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.95, 8), railMat);
    post.position.set(rx, 0.48, -18.0);
    scene.add(post);
  }

  // 2) Shimmering Istanbul Bosphorus Strait Water (z = -18.2 to -56)
  bosphorusWaterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 42),
    new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.18,
      metalness: 0.35
    })
  );
  bosphorusWaterMesh.rotation.x = -Math.PI / 2;
  bosphorusWaterMesh.position.set(0, -0.06, -38.5);
  scene.add(bosphorusWaterMesh);

  // Sun / Sunset / Full Moon Shimmering Reflection Path on the Bosphorus Water
  waterReflectionMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9.5, 34),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.42
    })
  );
  waterReflectionMesh.rotation.x = -Math.PI / 2;
  waterReflectionMesh.position.set(15, -0.03, -36.0);
  scene.add(waterReflectionMesh);

  // 3) Kız Kulesi (Maiden's Tower) on its Iconic Bosphorus Islet (x = 16.5, z = -26.5)
  const kizKulesi = new THREE.Group();
  kizKulesi.position.set(12.0, 0, -21.0);
  const islet = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 3.1, 0.45, 16),
    new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.85 })
  );
  islet.position.y = 0.15;
  const baseWall = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.1, 2.8),
    new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.7 })
  );
  baseWall.position.y = 0.75;
  const towerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.92, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.5 })
  );
  towerShaft.position.y = 2.65;
  const balcony = new THREE.Mesh(
    new THREE.CylinderGeometry(0.98, 0.98, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0x451a03 })
  );
  balcony.position.y = 4.15;
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.85, 1.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4 })
  );
  spire.position.y = 4.95;
  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
  );
  flagPole.position.y = 5.95;
  const trFlag = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.34, 0.03),
    new THREE.MeshBasicMaterial({ color: 0xdc2626 })
  );
  trFlag.position.set(0.28, 6.22, 0);
  kizKulesiBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  kizKulesiBeacon.position.y = 4.35;
  kizKulesi.add(islet, baseWall, towerShaft, balcony, spire, flagPole, trFlag, kizKulesiBeacon);
  scene.add(kizKulesi);

  // 4) Şehir Hatları Boğaz Vapuru (Classic White & Green Istanbul Ferry with Yellow Funnel)
  bosphorusFerryGroup = new THREE.Group();
  bosphorusFerryGroup.position.set(-8, 0, -24.0);
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.95, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 })
  );
  hull.position.y = 0.40;
  const deck1 = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 0.85, 2.0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  deck1.position.y = 1.25;
  const deck2 = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.72, 1.75),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  deck2.position.y = 1.98;
  const greenStripe = new THREE.Mesh(
    new THREE.BoxGeometry(6.46, 0.20, 2.04),
    new THREE.MeshStandardMaterial({ color: 0x15803d })
  );
  greenStripe.position.y = 0.92;
  const funnel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.38, 1.35, 12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
  );
  funnel.position.set(0, 2.85, 0);
  funnel.rotation.z = -0.12;
  const funnelTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12),
    new THREE.MeshStandardMaterial({ color: 0x111827 })
  );
  funnelTop.position.set(-0.06, 3.45, 0);
  funnelTop.rotation.z = -0.12;
  bosphorusFerryGroup.add(hull, deck1, deck2, greenStripe, funnel, funnelTop);
  bosphorusFerryGroup.userData = { dir: 1, speed: 3.4 };
  scene.add(bosphorusFerryGroup);

  // 5) Iconic Boğaz Köprüsü (15 Temmuz Şehitler Köprüsü) Spanning the Upper Horizon (z = -46)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(0, 0, -46.0);
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });

  [-26, 26].forEach(tx => {
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.95, 16.5, 0.95), towerMat);
    legL.position.set(tx, 8.25, -1.6);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.95, 16.5, 0.95), towerMat);
    legR.position.set(tx, 8.25, 1.6);
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 3.8), towerMat);
    cross1.position.set(tx, 7.5, 0);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 3.8), towerMat);
    cross2.position.set(tx, 15.8, 0);
    bridgeGroup.add(legL, legR, cross1, cross2);
  });

  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(96, 0.55, 3.6), deckMat);
  bridgeDeck.position.set(0, 6.2, 0);
  bridgeGroup.add(bridgeDeck);

  bosphorusBridgeLights = [];
  for (let bx = -24; bx <= 24; bx += 2.4) {
    const norm = bx / 26;
    const cableY = 6.8 + norm * norm * 8.8;
    [-1.55, 1.55].forEach(cz => {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      node.position.set(bx, cableY, cz);
      bridgeGroup.add(node);
      bosphorusBridgeLights.push(node);

      const vWire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, cableY - 6.2, 6),
        towerMat
      );
      vWire.position.set(bx, 6.2 + (cableY - 6.2) / 2, cz);
      bridgeGroup.add(vWire);
    });
  }
  scene.add(bridgeGroup);

  // 6) Opposite Shore Hills & Istanbul Mosque Silhouettes (z = -56)
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x1e3a2f, roughness: 0.9 });
  [[-38, 7.5, 22], [-12, 8.5, 26], [16, 7.8, 24], [42, 8.2, 22]].forEach(([hx, hy, hr]) => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(hr, hy, 12), hillMat);
    hill.position.set(hx, hy / 2 - 0.5, -35);
    scene.add(hill);
  });

  // 7) Sun (East -> West Arc), Full Moon (Dolunay) & 120 Twinkling Night Stars!
  sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 20, 18),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  sunMesh.position.set(20, 8.5, -36);
  scene.add(sunMesh);

  moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 20, 18),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  );
  moonMesh.position.set(-12, 9.0, -35);
  moonMesh.visible = false;
  scene.add(moonMesh);

  starsGroup = new THREE.Group();
  for (let s = 0; s < 110; s++) {
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(0.14 + (s % 3) * 0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: s % 4 === 0 ? 0xfef08a : 0xffffff })
    );
    star.position.set(
      (Math.random() - 0.5) * 130,
      5.5 + Math.random() * 8.5,
      -37 - Math.random() * 4
    );
    starsGroup.add(star);
  }
  starsGroup.visible = false;
  scene.add(starsGroup);

  // 8) 7 Cute Soaring 3D Seagulls (Havada Uçuşan Tatlı Martılar)!
  const gullWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const gullGreyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });

  for (let i = 0; i < 7; i++) {
    const gull = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), gullWhiteMat);
    body.scale.set(0.85, 0.75, 1.65);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), gullWhiteMat);
    head.position.set(0, 0.12, 0.28);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.10, 0.44);

    const leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(-0.14, 0.06, 0.02);
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.28), gullWhiteMat);
    leftWing.position.set(-0.34, 0, 0);
    const leftTip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.042, 0.24), gullGreyMat);
    leftTip.position.set(-0.76, 0, -0.02);
    leftWingPivot.add(leftWing, leftTip);

    const rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(0.14, 0.06, 0.02);
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.28), gullWhiteMat);
    rightWing.position.set(0.34, 0, 0);
    const rightTip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.042, 0.24), gullGreyMat);
    rightTip.position.set(0.76, 0, -0.02);
    rightWingPivot.add(rightWing, rightTip);

    gull.add(body, head, beak, leftWingPivot, rightWingPivot);
    scene.add(gull);

    seagulls.push({
      group: gull,
      leftWingPivot,
      rightWingPivot,
      centerX: -22 + i * 7.5,
      centerZ: -20 + (i % 3) * 5.5,
      radiusX: 7.5 + (i % 3) * 3.0,
      radiusZ: 3.8 + (i % 2) * 2.2,
      baseY: 5.4 + (i % 3) * 1.1,
      angle: i * 0.95,
      speed: 0.55 + (i % 3) * 0.14,
      flapPhase: i * 1.3
    });
  }
}

// ============================================================================
// RAZOR-SHARP "VERESİYE SATAN / PEŞİN SATAN" WALL PAINTING & NAZAR BONCUĞU
// ============================================================================
function buildWallDecorations3D() {
  // 1) Wall Nazar Boncuğu Ornament (Left of HR Room)
  const nazarGroup = new THREE.Group();
  nazarGroup.position.set(to3DX(275), 2.55, -14.72);

  const nail = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 })
  );
  nail.position.y = 0.68;
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0xd97706 })
  );
  cord.position.y = 0.45;
  nazarGroup.add(nail, cord);

  const rings = [
    { r: 0.52, z: 0.00, col: 0x1d4ed8 },
    { r: 0.36, z: 0.02, col: 0xffffff },
    { r: 0.23, z: 0.04, col: 0x38bdf8 },
    { r: 0.10, z: 0.06, col: 0x0f172a }
  ];
  rings.forEach(rg => {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(rg.r, rg.r, 0.06, 24),
       new THREE.MeshStandardMaterial({ color: rg.col, roughness: 0.2, metalness: 0.1 })
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.z = rg.z;
    nazarGroup.add(disc);
  });
  scene.add(nazarGroup);

  // 2) Proportional, Elevated "VERESİYE SATAN / PEŞİN SATAN" Framed Picture on Upper Back Wall (x = 595)
  const frameGroup = new THREE.Group();
  frameGroup.position.set(to3DX(595), 2.62, -14.62);
  frameGroup.rotation.x = 0.12;

  const outerFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3.10, 1.92, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.50 })
  );
  const goldTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.90, 1.72, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.25 })
  );
  frameGroup.add(outerFrame, goldTrim);

  const canvasMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  if (window.VERESIYE_PESIN_DATA_URI) {
    const loader = new THREE.TextureLoader();
    loader.load(window.VERESIYE_PESIN_DATA_URI, tex => {
      applyCrispTextureSettings(tex);
      canvasMat.map = tex;
      canvasMat.needsUpdate = true;
    });
  }
  const picturePlane = new THREE.Mesh(new THREE.PlaneGeometry(2.76, 1.58), canvasMat);
  picturePlane.position.z = 0.10;
  frameGroup.add(picturePlane);

  scene.add(frameGroup);
}

function buildWarmInvisibleLights3D() {
  const lightPositions = [
    [to3DX(220), 2.9, -13.5],
    [to3DX(410), 2.9, -13.5],
    [to3DX(595), 2.9, -13.5],
    [to3DX(635), 3.1, to3DZ(360)]
  ];

  lightPositions.forEach(([lx, ly, lz], idx) => {
    const ptLight = new THREE.PointLight(0xff9800, idx === 3 ? 0.68 : 0.50, 19, 1.5);
    ptLight.position.set(lx, ly, lz);
    scene.add(ptLight);
  });
}

// ============================================================================
// RESTROOM (WC): UNOBSTRUCTED DOORWAY + LEMON-LABELED COLOGNE DISPENSER TO THE SIDE!
// ============================================================================
function buildRestroomWC3D() {
  const wcGroup = new THREE.Group();

  const wcFloor = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 0.24, 5.2),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45 })
  );
  wcFloor.position.set(to3DX(795), 0.02, to3DZ(155));
  scene.add(wcFloor);

  const partMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.6 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.6, 5.2), partMat);
  leftWall.position.set(to3DX(735), 1.3, to3DZ(155));
  const frontStubWall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.42), partMat);
  frontStubWall.position.set(to3DX(752), 1.3, to3DZ(205));
  const rightStubWall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.42), partMat);
  rightStubWall.position.set(to3DX(832), 1.3, to3DZ(205));
  wcGroup.add(leftWall, frontStubWall, rightStubWall);

  // Hinged 3D WC Door (Swings open when someone enters/cleans; locked to customers when WC is dirty!)
  const wcDoorPivot = new THREE.Group();
  wcDoorPivot.position.set(to3DX(770), 0, to3DZ(205));
  const wcDoorLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 2.38, 0.16),
    new THREE.MeshStandardMaterial({ map: getNaturalWoodTexture(), color: 0x7c4722, roughness: 0.5 })
  );
  wcDoorLeaf.position.set(1.125, 1.19, 0);
  wcDoorLeaf.castShadow = true;
  const wcDoorFrosted = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.75, 0.20),
    new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.55, roughness: 0.2 })
  );
  wcDoorFrosted.position.set(1.125, 1.72, 0);
  const wcDoorHandle = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85 })
  );
  wcDoorHandle.position.set(1.95, 1.12, 0.12);
  wcDoorPivot.add(wcDoorLeaf, wcDoorFrosted, wcDoorHandle);
  wcGroup.add(wcDoorPivot);
  restroom.doorPivot = wcDoorPivot;

  const wcSign = createSignboard3D('🚻 TUVALET / WC', 'LİMON KOLONYALI', '#1e293b', '#38bdf8', 2.6, 0.68);
  wcSign.position.set(to3DX(795), 3.1, to3DZ(205));
  wcGroup.add(wcSign);

  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.36, 0.65, 14), ceramicMat);
  bowl.position.set(to3DX(828), 0.35, to3DZ(128));
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 0.75), ceramicMat);
  tank.position.set(to3DX(840), 0.9, to3DZ(128));

  const sinkPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.85, 12), ceramicMat);
  sinkPedestal.position.set(to3DX(775), 0.42, to3DZ(118));
  const sinkBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.36, 0.32, 16), ceramicMat);
  sinkBasin.position.set(to3DX(775), 0.96, to3DZ(118));
  const faucet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 })
  );
  faucet.position.set(to3DX(775), 1.20, to3DZ(111));

  // White Mirror above sink
  const mirrorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 1.28, 0.10),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 })
  );
  mirrorFrame.position.set(to3DX(775), 1.92, to3DZ(106));
  const whiteMirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 1.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x334155, roughness: 0.06, metalness: 0.15 })
  );
  whiteMirror.position.set(to3DX(775), 1.92, to3DZ(106.5));

  // Liquid Soap Dispenser on the washbasin
  const soapGroup = new THREE.Group();
  soapGroup.position.set(to3DX(775) + 0.32, 1.12, to3DZ(116));
  const soapBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.12, 0.28, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.25 })
  );
  soapBottle.position.y = 0.14;
  const soapLabel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.115, 0.10, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7 })
  );
  soapLabel.position.y = 0.14;
  const soapPump = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.09, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  soapPump.position.set(0, 0.31, 0.04);
  soapGroup.add(soapBottle, soapLabel, soapPump);

  // PUMP LEMON COLOGNE DISPENSER (Placed beside the wall at x=745, y=222 so it NEVER blocks WC entry!)
  // Features a crisp Lemon Picture Label ("80° LİMON KOLONYASI") + 3D Yellow Lemon Emblem!
  const cologneStand = new THREE.Group();
  cologneStand.position.set(to3DX(restroom.cologneX), 0, to3DZ(restroom.cologneY));

  const standPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.38, 1.12, 14),
    new THREE.MeshStandardMaterial({ map: getNaturalWoodTexture(), roughness: 0.55 })
  );
  standPedestal.position.y = 0.56;

  const cologneBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.26, 0.58, 16),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, transparent: true, opacity: 0.92, roughness: 0.15 })
  );
  cologneBottle.position.y = 1.42;

  // Front-facing Crisp Lemon Illustration Label on the Cologne Bottle
  const lemonLabelPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.44),
    new THREE.MeshBasicMaterial({ map: getLemonCologneLabelTexture() })
  );
  lemonLabelPlane.position.set(0, 1.42, 0.265);

  // 3D Sculpted Yellow Lemon + Green Leaf sitting right beside the pump nozzle!
  const lemon3D = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
  );
  lemon3D.scale.set(1.35, 0.95, 0.95);
  lemon3D.position.set(-0.14, 1.76, 0.08);

  const colognePumpHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.15, 0.32),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  colognePumpHead.position.set(0.05, 1.78, 0.08);
  cologneStand.add(standPedestal, cologneBottle, lemonLabelPlane, lemon3D, colognePumpHead);
  restroom.colognePumpHead = colognePumpHead;

  wcGroup.add(bowl, tank, sinkPedestal, sinkBasin, faucet, mirrorFrame, whiteMirror, soapGroup, cologneStand);

  const puddleGroup = new THREE.Group();
  puddleGroup.position.set(to3DX(795), 0.16, to3DZ(160));
  const p1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55, roughness: 0.2 })
  );
  puddleGroup.add(p1);
  puddleGroup.visible = false;
  wcGroup.add(puddleGroup);

  // 3D Collectible WC Napkins / Crumpled Paper Towels on the WC Floor (when restroom.trashCount > 0)
  const wcTrashGroup = new THREE.Group();
  wcTrashGroup.position.set(to3DX(795), 0.14, to3DZ(162));
  wcGroup.add(wcTrashGroup);

  const progressRing = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.98, 24),
    new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide })
  );
  progressRing.rotation.x = -Math.PI / 2;
  progressRing.position.set(to3DX(795), 0.2, to3DZ(160));
  progressRing.visible = false;
  wcGroup.add(progressRing);

  const cashGroup = new THREE.Group();
  cashGroup.position.set(to3DX(restroom.cashX), 0.15, to3DZ(restroom.cashY));
  scene.add(cashGroup);

  const wcPad = createActionPadMesh3D(0.88, 0x38bdf8);
  wcPad.position.set(to3DX(restroom.padX), 0, to3DZ(restroom.padY));
  wcGroup.add(wcPad);

  const wcCashPad = createActionPadMesh3D(0.76, 0x4ade80);
  wcCashPad.position.set(to3DX(restroom.cashX), 0, to3DZ(restroom.cashY));
  wcGroup.add(wcCashPad);

  restroom.puddleGroup = puddleGroup;
  restroom.wcTrashGroup = wcTrashGroup;
  restroom.progressRing = progressRing;
  restroom.cashGroup = cashGroup;
  restroom.actionPadMesh = wcPad;
  restroom.cashPadMesh = wcCashPad;
  scene.add(wcGroup);
}

function createWCNapkinClutterMesh() {
  const g = new THREE.Group();
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
  const wetPaperMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.75 });
  const rollMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85 });

  const wad1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), paperMat);
  wad1.scale.set(1.2, 0.65, 1.0);
  wad1.position.set(-0.12, 0.08, 0.05);

  const wad2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), wetPaperMat);
  wad2.scale.set(1.1, 0.6, 1.2);
  wad2.position.set(0.14, 0.06, -0.06);

  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.18), paperMat);
  sheet.rotation.y = 0.45;
  sheet.position.set(0.02, 0.02, 0.12);

  const emptyRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 10), rollMat);
  emptyRoll.rotation.z = Math.PI / 2;
  emptyRoll.rotation.y = -0.35;
  emptyRoll.position.set(-0.04, 0.06, -0.12);

  g.add(wad1, wad2, sheet, emptyRoll);
  return g;
}

function buildTrashContainer3D() {
  const g = new THREE.Group();
  g.position.set(to3DX(trashBin.x), 0, to3DZ(trashBin.y));

  const binMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.55, 1.75), binMat);
  body.position.y = 0.78;
  body.castShadow = true;
  g.add(body);

  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.16, 1.9),
    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
  );
  rim.position.y = 1.56;
  g.add(rim);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 1.62, -0.88);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.18, 1.85),
    new THREE.MeshStandardMaterial({ color: 0x166534 })
  );
  lid.position.set(0, 0.08, 0.88);
  lidPivot.add(lid);
  g.add(lidPivot);

  const trashPad = createActionPadMesh3D(0.86, 0xa3e635);
  trashPad.position.set(to3DX(trashBin.padX) - to3DX(trashBin.x), 0, to3DZ(trashBin.padY) - to3DZ(trashBin.y));
  g.add(trashPad);

  trashBin.lidPivot = lidPivot;
  trashBin.actionPadMesh = trashPad;
  scene.add(g);
}

function buildKitchenSupplyAndFridge3D() {
  const meatPadMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.08, 2.1),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
  );
  meatPadMesh.position.set(to3DX(supplyDock.meatPad.x), 0.12, to3DZ(supplyDock.meatPad.y));
  scene.add(meatPadMesh);
  supplyDock.meatPadMesh = meatPadMesh;

  const meatProgressMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.12, 2.0),
    new THREE.MeshBasicMaterial({ color: 0x4ade80 })
  );
  meatProgressMesh.position.set(to3DX(supplyDock.meatPad.x), 0.16, to3DZ(supplyDock.meatPad.y));
  meatProgressMesh.visible = false;
  scene.add(meatProgressMesh);
  supplyDock.meatProgressMesh = meatProgressMesh;

  const meatTable = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.15, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 })
  );
  meatTable.position.set(to3DX(116), 0.58, to3DZ(supplyDock.meatPad.y));
  scene.add(meatTable);

  const meatSign = createSignboard3D('🍗 TAVUK DEPOSU', 'HAM ET STOĞU', '#451a03', '#f59e0b', 2.3, 0.62);
  meatSign.position.set(to3DX(146), 3.15, to3DZ(supplyDock.meatPad.y));
  scene.add(meatSign);

  supplyDock.meatCrateGroup = new THREE.Group();
  supplyDock.meatCrateGroup.position.set(to3DX(116), 1.18, to3DZ(supplyDock.meatPad.y));
  scene.add(supplyDock.meatCrateGroup);

  const drinkPadMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.08, 2.1),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  drinkPadMesh.position.set(to3DX(supplyDock.drinkPad.x), 0.12, to3DZ(supplyDock.drinkPad.y));
  scene.add(drinkPadMesh);
  supplyDock.drinkPadMesh = drinkPadMesh;

  const drinkProgressMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.12, 2.0),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  drinkProgressMesh.position.set(to3DX(supplyDock.drinkPad.x), 0.16, to3DZ(supplyDock.drinkPad.y));
  drinkProgressMesh.visible = false;
  scene.add(drinkProgressMesh);
  supplyDock.drinkProgressMesh = drinkProgressMesh;

  const fridgeGroup = new THREE.Group();
  fridgeGroup.position.set(to3DX(116), 0, to3DZ(supplyDock.drinkPad.y));

  const fridgeBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 3.1, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.4 })
  );
  fridgeBody.position.y = 1.55;
  fridgeBody.castShadow = true;

  const fridgeInterior = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.6, 2.35),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
  );
  fridgeInterior.position.set(0.12, 1.50, 0);

  for (let s = 0; s < 3; s++) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.38, 0.06, 2.32),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 })
    );
    shelf.position.set(0.15, 0.65 + s * 0.75, 0);
    fridgeGroup.add(shelf);
  }

  const glassDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 2.65, 2.42),
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.28, roughness: 0.08 })
  );
  glassDoor.position.set(0.84, 1.50, 0);

  const doorHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9 })
  );
  doorHandle.position.set(0.92, 1.50, 0.95);

  const fridgeSign = createSignboard3D('❄️ İÇECEK DOLABI', 'AYRAN & ŞALGAM', '#0c4a6e', '#38bdf8', 2.4, 0.62);
  fridgeSign.position.set(1.45, 3.45, 0);

  fridgeGroup.add(fridgeBody, fridgeInterior, glassDoor, doorHandle, fridgeSign);
  scene.add(fridgeGroup);
  supplyDock.fridgeGroup = fridgeGroup;

  supplyDock.fridgeBottleGroup = new THREE.Group();
  supplyDock.fridgeBottleGroup.position.set(to3DX(116) + 0.35, 0, to3DZ(supplyDock.drinkPad.y));
  scene.add(supplyDock.fridgeBottleGroup);

  // Two-lane logistics road on the left (-X) so Meat Truck (Lane 1: x=-21.0) and Drink Truck (Lane 2: x=-26.6) NEVER collide or clip!
  const bayAsphalt = new THREE.Mesh(
    new THREE.BoxGeometry(13.5, 0.15, 220.0),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
  );
  bayAsphalt.position.set(-23.8, -0.02, 0);
  scene.add(bayAsphalt);

  for (let dz = -85; dz <= 85; dz += 10) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 4.2),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    dash.position.set(-23.8, 0.08, dz);
    scene.add(dash);
  }

  supplyDock.meatTruckGroup = createSupplyTruckMesh('meat');
  supplyDock.meatTruckGroup.position.set(-21.0, 0, supplyDock.meatTruckZ);
  supplyDock.meatTruckGroup.visible = false;
  scene.add(supplyDock.meatTruckGroup);

  supplyDock.drinkTruckGroup = createSupplyTruckMesh('drink');
  supplyDock.drinkTruckGroup.position.set(-26.6, 0, supplyDock.drinkTruckZ);
  supplyDock.drinkTruckGroup.visible = false;
  scene.add(supplyDock.drinkTruckGroup);

  syncKitchenRawStorage3D();
}

function createSupplyTruckMesh(type) {
  const isMeat = type === 'meat';
  const truck = new THREE.Group();

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.5, 9.8),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5 })
  );
  chassis.position.set(0, 0.70, 0);
  truck.add(chassis);

  const tireGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.5, 14);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
  const rimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.54, 10);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });

  [[-2.1, 0.7, -3.2], [2.1, 0.7, -3.2], [-2.1, 0.7, 2.6], [2.1, 0.7, 2.6]].forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(wx, wy, wz);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(wx, wy, wz);
    truck.add(tire, rim);
  });

  const cargoColor = isMeat ? 0xfef3c7 : 0xf0f9ff;
  const stripeColor = isMeat ? 0xd97706 : 0x0284c7;
  const cabColor = isMeat ? 0xb45309 : 0x0d9488;

  const cargoBox = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 3.6, 6.4),
    new THREE.MeshStandardMaterial({ color: cargoColor, roughness: 0.35 })
  );
  cargoBox.position.set(0, 2.75, 1.3);
  cargoBox.castShadow = true;

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(4.58, 0.55, 6.45),
    new THREE.MeshStandardMaterial({ color: stripeColor })
  );
  stripe.position.set(0, 3.1, 1.3);

  const openBay = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 2.4, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b })
  );
  openBay.position.set(2.2, 2.5, 1.3);

  const crateMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.45 });
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const cr = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 1.3), crateMat);
      cr.position.set(1.95, 1.65 + r * 0.8, 0.3 + c * 1.7);
      truck.add(cr);
    }
  }

  const cabBody = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 2.9, 2.8),
    new THREE.MeshStandardMaterial({ color: cabColor, roughness: 0.35, metalness: 0.2 })
  );
  cabBody.position.set(0, 2.4, -3.4);
  cabBody.castShadow = true;

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 1.1, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.1, metalness: 0.5 })
  );
  windshield.position.set(0, 2.8, -4.82);

  const truckSign = createSignboard3D(
    isMeat ? '🍗 TAVUK TEDARİK' : '🥛 AYRAN & İÇECEK',
    isMeat ? 'TAZE DÖNER ETİ' : 'SOĞUK ZİNCİR',
    isMeat ? '#451a03' : '#0c4a6e',
    isMeat ? '#f59e0b' : '#38bdf8',
    3.6,
    0.72
  );
  truckSign.rotation.y = Math.PI / 2;
  truckSign.position.set(2.35, 4.95, 1.3);
  truck.add(truckSign);

  if (!isMeat) {
    const giantAyran = createFoodMesh('ayran');
    giantAyran.scale.set(2.6, 2.6, 2.6);
    giantAyran.position.set(0, 4.55, 0.2);
    truck.add(giantAyran);
  }

  truck.add(cargoBox, stripe, openBay, cabBody, windshield);
  return truck;
}

function syncKitchenRawStorage3D() {
  if (supplyDock.meatCrateGroup) {
    const targetMeatVis = Math.min(state.rawMeat, 10);
    while (supplyDock.meatCrateGroup.children.length > targetMeatVis) {
      supplyDock.meatCrateGroup.remove(supplyDock.meatCrateGroup.children[supplyDock.meatCrateGroup.children.length - 1]);
    }
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    while (supplyDock.meatCrateGroup.children.length < targetMeatVis) {
      const idx = supplyDock.meatCrateGroup.children.length;
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.95), crateMat);
      tray.position.set(0, Math.floor(idx / 2) * 0.26, (idx % 2 === 0 ? -0.55 : 0.55));
      supplyDock.meatCrateGroup.add(tray);
    }
  }

  if (supplyDock.fridgeBottleGroup) {
    const targetDrinkVis = Math.min(state.rawDrink, 15);
    while (supplyDock.fridgeBottleGroup.children.length > targetDrinkVis) {
      supplyDock.fridgeBottleGroup.remove(supplyDock.fridgeBottleGroup.children[supplyDock.fridgeBottleGroup.children.length - 1]);
    }
    while (supplyDock.fridgeBottleGroup.children.length < targetDrinkVis) {
      const idx = supplyDock.fridgeBottleGroup.children.length;
      const shelfRow = Math.floor(idx / 5);
      const col = idx % 5;
      const bMesh = createFoodMesh(idx % 3 === 2 ? 'salgam' : 'ayran');
      bMesh.scale.set(0.85, 0.85, 0.85);
      bMesh.position.set(0, 0.68 + shelfRow * 0.75, -0.88 + col * 0.44);
      supplyDock.fridgeBottleGroup.add(bMesh);
    }
  }
}


// ============================================================================
// RICH TURKISH "MAHALLE KÜLTÜRÜ" EXTERIOR (SİMİTÇİ ARABASI, TAŞ ÇEŞME, KIRAATHANE, MANAV)
// + 5 WANDERING STREET CATS MODELED AFTER THE 4 UPLOADED REFERENCE PHOTOS
// ============================================================================
function buildExteriorNeighborhood3D() {
  mahalleExteriorGroup = new THREE.Group();
  luxuryExteriorGroup = new THREE.Group();

  // --- 1) AUTHENTIC TURKISH MAHALLE CULTURE (Levels 1-5) ---
  function createMahalleShop(x, z, w, h, d, wallColor, awningColor, title, sub) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 })
    );
    body.position.y = h / 2;
    body.castShadow = true;

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.75, 1.9, 4),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = h + 0.95;

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.92, 0.35, 1.8),
      new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.5 })
    );
    awning.position.set(0, 2.2, d / 2 + 0.6);
    awning.rotation.x = 0.25;

    const sign = createSignboard3D(title, sub, '#1e293b', '#facc15', w * 0.82, 0.68);
    sign.position.set(0, 2.95, d / 2 + 0.35);

    g.add(body, roof, awning, sign);
    return g;
  }

  mahalleExteriorGroup.add(
    createMahalleShop(-30, -9, 7.5, 5.2, 6.5, 0xfef3c7, 0xdc2626, '🥖 KARDEŞLER FIRIN', 'SICAK EKMEK & PİDE'),
    createMahalleShop(-30, 2, 7.2, 4.8, 6.2, 0xe0f2fe, 0x0284c7, '🛒 BEREKET BAKKAL', 'VERESİYE YOKTUR'),
    createMahalleShop(24.2, -7.5, 7.2, 4.8, 6.0, 0xfde68a, 0x15803d, '☕ ÇINAR KIRAATHANESİ', 'TAZE DEMLİ ÇAY'),
    createMahalleShop(31, 4, 7.2, 4.8, 6.0, 0xfecdd3, 0xb91c1c, '💈 MAHALLE BERBERİ', 'SIHHATLER OLSUN')
  );

  // A) Geleneksel Kırmızı Tekerlekli SİMİTÇİ ARABASI (Moved completely outside the shop at x=-16.5, y=732 so it never clips the front wall!)
  const simitCart = new THREE.Group();
  simitCart.position.set(-16.5, 0, to3DZ(732));
  const cartRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const cartGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5, roughness: 0.3 });
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.15, 1.25), cartRedMat);
  cartBody.position.y = 0.95;
  cartBody.castShadow = true;
  const cartGoldStripe = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.16, 1.28), cartGoldMat);
  cartGoldStripe.position.y = 0.95;
  const glassCase = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.85, 1.15),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, transparent: true, opacity: 0.35, roughness: 0.1 })
  );
  glassCase.position.y = 1.95;
  const cartCanopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.85, 0.85, 8),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
  );
  cartCanopy.position.y = 2.95;

  const simitMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
  for (let stack = 0; stack < 3; stack++) {
    for (let s = 0; s < 5; s++) {
      const simit = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 8, 14), simitMat);
      simit.rotation.x = Math.PI / 2;
      simit.position.set(-0.55 + stack * 0.55, 1.60 + s * 0.095, 0);
      simitCart.add(simit);
    }
  }
  [-0.75, 0.75].forEach(wx => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 14), cartGoldMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.42, 0.66);
    const wheelBack = wheel.clone();
    wheelBack.position.z = -0.66;
    simitCart.add(wheel, wheelBack);
  });
  const simitSign = createSignboard3D('🥯 ÇITIR SİMİT', 'SICAK SUSAMLI', '#991b1b', '#facc15', 2.0, 0.52);
  simitSign.position.set(0, 2.55, 0.65);
  simitCart.add(cartBody, cartGoldStripe, glassCase, cartCanopy, simitSign);
  mahalleExteriorGroup.add(simitCart);

  // B) Tarihi Taş MAHALLE ÇEŞMESİ (Positioned along upper right facade y=684 so sidewalk lanes are 100% clear!)
  const cesmeGroup = new THREE.Group();
  cesmeGroup.position.set(16.2, 0, to3DZ(726));
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.75 });
  const cesmePillar = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.35, 1.15), stoneMat);
  cesmePillar.position.y = 1.18;
  cesmePillar.castShadow = true;
  const cesmeArch = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.35, 1.30),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 })
  );
  cesmeArch.position.y = 2.42;
  const basin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 0.95), stoneMat);
  basin.position.set(0, 0.24, 0.72);
  const waterPool = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.38, 0.68),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15 })
  );
  waterPool.position.set(0, 0.32, 0.72);
  const brassTap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 })
  );
  brassTap.rotation.x = Math.PI / 2;
  brassTap.position.set(0, 1.05, 0.68);
  const catWaterBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.20, 0.10, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7 })
  );
  catWaterBowl.position.set(-1.15, 0.06, 0.55);
  const catFoodBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.20, 0.10, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  catFoodBowl.position.set(-1.68, 0.06, 0.55);
  cesmeGroup.add(cesmePillar, cesmeArch, basin, waterPool, brassTap, catWaterBowl, catFoodBowl);
  mahalleExteriorGroup.add(cesmeGroup);

  // C) Manav Karpuz & Meyve Kasaları (Greengrocer Watermelon Crates outside Bakkal)
  const crateGroup = new THREE.Group();
  crateGroup.position.set(-25.2, 0, 3.2);
  const woodCrateMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
  const melonMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
  for (let c = 0; c < 3; c++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 1.2), woodCrateMat);
    crate.position.set(0, 0.33, c * 1.4);
    crateGroup.add(crate);
    for (let m = 0; m < 3; m++) {
      const melon = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), melonMat);
      melon.scale.set(1.25, 0.95, 0.95);
      melon.position.set((m - 1) * 0.28, 0.78, c * 1.4 + (m % 2 === 0 ? 0.12 : -0.12));
      crateGroup.add(melon);
    }
  }
  mahalleExteriorGroup.add(crateGroup);

  // D) Çınar Kıraathanesi Dış Çay Masası, Tavla & Karşılıklı Tavla Oynayan İki Tonton Dede!
  const kiraatOutdoor = new THREE.Group();
  kiraatOutdoor.position.set(19.8, 0, -1.8);
  const kTable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.92, 0.88, 16),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
  );
  kTable.position.y = 0.44;
  const tavlaBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.09, 0.58),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
  );
  tavlaBox.position.y = 0.92;
  const tavlaBorder = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.07, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x451a03 })
  );
  tavlaBorder.position.y = 0.91;
  const cay1 = createInceBelliCayMesh(false);
  cay1.position.set(-0.44, 0.89, 0.32);
  const cay2 = createInceBelliCayMesh(false);
  cay2.position.set(0.44, 0.89, -0.32);
  kiraatOutdoor.add(kTable, tavlaBorder, tavlaBox, cay1, cay2);

  // Two stools + Two Chubby Mustachioed Tonton Dedes playing Backgammon (Tavla) across from each other!
  function createTavlaDede(zOffset, facingY, vestColor, capColor) {
    const stool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.46, 0.58, 12),
      new THREE.MeshStandardMaterial({ color: 0x5c3415 })
    );
    stool.position.set(0, 0.29, zOffset);
    kiraatOutdoor.add(stool);

    const dedeRig = createCharacterRig({
      role: 'customer',
      gender: 'male',
      scale: 0.94,
      topColor: vestColor,
      pantsColor: 0x334155,
      skinColor: 0xfde68a,
      hair: 'mustache',
      hairColor: 0xe2e8f0 // White-haired & white-mustachioed grandpa!
    });
    // Chubby Tonton belly & traditional flat cap (kasket)
    dedeRig.torso.scale.set(1.22, 1.0, 1.25);
    const kasket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.36, 0.14, 14),
      new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.7 })
    );
    kasket.position.set(0, 0.34, 0.04);
    dedeRig.headGroup.add(kasket);

    // Seated pose at the Kıraathane table
    dedeRig.leftHipPivot.rotation.x = -Math.PI / 2;
    dedeRig.rightHipPivot.rotation.x = -Math.PI / 2;
    dedeRig.torso.position.y = 0.96;
    dedeRig.headGroup.position.y = 1.88;
    dedeRig.leftArmPivot.position.y = 1.36;
    dedeRig.rightArmPivot.position.y = 1.36;
    dedeRig.leftArmPivot.rotation.x = -0.85;
    dedeRig.rightArmPivot.rotation.x = -0.95;

    // Move from global scene into kiraatOutdoor group
    scene.remove(dedeRig.group);
    dedeRig.group.position.set(0, 0, zOffset);
    dedeRig.group.rotation.y = facingY;
    kiraatOutdoor.add(dedeRig.group);
    return dedeRig;
  }

  tavlaDede1 = createTavlaDede(-1.35, 0, 0x78350f, 0x3f2e21);
  tavlaDede2 = createTavlaDede(1.35, Math.PI, 0x1e3a8a, 0x475569);
  mahalleExteriorGroup.add(kiraatOutdoor);

  [-15.5, -5.5, 5.5, 15.5].forEach(lx => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lx, 0, to3DZ(705));
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.13, 3.6, 10),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 })
    );
    pole.position.y = 1.8;
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.6 })
    );
    lantern.position.y = 3.7;
    lampGroup.add(pole, lantern);
    mahalleExteriorGroup.add(lampGroup);
  });

  // --- 2) LUXURY RESIDENCES, PLAZAS & AVM (Levels 6-10) ---
  function createLuxuryTower(x, z, w, h, d, glassColor, title, sub) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: glassColor, roughness: 0.15, metalness: 0.65 })
    );
    tower.position.y = h / 2;
    tower.castShadow = true;
    g.add(tower);

    for (let y = 2.0; y < h - 0.8; y += 1.6) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.16, 0.22, d + 0.16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 })
      );
      band.position.y = y;
      g.add(band);
    }

    const sign = createSignboard3D(title, sub, '#0f172a', '#38bdf8', w * 0.85, 0.78);
    sign.position.set(0, 3.4, d / 2 + 0.4);
    g.add(sign);
    return g;
  }

  luxuryExteriorGroup.add(
    createLuxuryTower(-31, -9, 8.8, 11.5, 7.5, 0x0284c7, '🏙️ SAFİR REZİDANS', 'VIP KONUTLAR'),
    createLuxuryTower(-31, 3, 8.5, 9.8, 7.2, 0x1e293b, '💎 ALTIN AVM', 'LÜKS ALIŞVERİŞ MERKEZİ'),
    createLuxuryTower(32, -8, 9.0, 12.2, 7.5, 0x0f172a, '🏢 SKY PLAZA', 'İŞ & FİNANS MERKEZİ'),
    createLuxuryTower(32, 4, 8.4, 9.5, 7.0, 0x0369a1, '🌟 ROYAL SUITES', 'PENTHOUSE & LOFT')
  );

  // All trees placed strictly OUTSIDE the restaurant walls, supply bay, and drive-thru lane!
  const treePositions = [
    [-35.5, -14.5], [36.5, -14.5],
    [-35.5, 9.5], [36.5, 9.5],
    [-15.5, -18.5], [-5.0, -18.5], [5.0, -18.5], [15.5, -18.5],
    [-27.5, 15.2], [28.0, 15.2],
    [-22.0, 29.0], [-8.0, 29.0], [8.0, 29.0], [22.0, 29.0]
  ];
  treePositions.forEach(([tx, tz]) => {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.48, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c4033 })
    );
    trunk.position.set(tx, 1.1, tz);
    trunk.castShadow = true;
    const leaves = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.75, 1),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
    );
    leaves.position.set(tx, 3.1, tz);
    leaves.castShadow = true;
    scene.add(trunk, leaves);
  });

  scene.add(mahalleExteriorGroup);
  scene.add(luxuryExteriorGroup);
}

// ============================================================================
// 5 WANDERING STREET CATS MODELED AFTER THE 4 UPLOADED TURKISH CAT PHOTOS!
// 1. Fluffy White Ankara Cat with Amber Eyes (media_1793297116948_552cee47.png)
// 2. Brown/Black Striped Tekir with Green Eyes (media_1793297125934_9860e910.png)
// 3. Odd-Eyed Blue + Amber White Van Cat (media_1793297146721_b7756879.png)
// 4. Long-Haired Ginger & White Sarman Cat (media_1793297160474_ac4b9bc1.png)
// 5. Three-Color Calico Mahalle Cat
// ============================================================================
function buildStreetCats3D() {
  const catSpecs = [
    {
      name: 'Ankara Kedisi (Beyaz Kehribar Gözlü)',
      coat: 0xffffff,
      stripeColor: null,
      chestBib: true,
      fluffy: true,
      leftEyeCol: 0xd97706,
      rightEyeCol: 0xd97706,
      x: 365,
      y: 692,
      minX: 295,
      maxX: 435,
      minY: 682,
      maxY: 706
    },
    {
      name: 'Tekir Kedi (Çizgili Yeşil Gözlü)',
      coat: 0x8c7355,
      stripeColor: 0x1c1917,
      chestBib: false,
      fluffy: false,
      leftEyeCol: 0x4ade80,
      rightEyeCol: 0x4ade80,
      x: 575,
      y: 694,
      minX: 540,
      maxX: 660,
      minY: 682,
      maxY: 706
    },
    {
      name: 'Van Kedisi (Mavi & Kehribar Gözlü)',
      coat: 0xffffff,
      stripeColor: null,
      chestBib: true,
      fluffy: true,
      leftEyeCol: 0xf59e0b,
      rightEyeCol: 0x38bdf8,
      x: 745,
      y: 692,
      minX: 705,
      maxX: 805,
      minY: 682,
      maxY: 706
    },
    {
      name: 'Sarman Kedi (Uzun Tüylü Turuncu-Beyaz)',
      coat: 0xea580c,
      stripeColor: 0x9a3412,
      chestBib: true,
      fluffy: true,
      leftEyeCol: 0xfbbf24,
      rightEyeCol: 0xfbbf24,
      x: 225,
      y: 694,
      minX: 195,
      maxX: 265,
      minY: 682,
      maxY: 706
    },
    {
      name: 'Alacalı Mahalle Kedisi',
      coat: 0xfef3c7,
      stripeColor: 0xd97706,
      chestBib: true,
      fluffy: false,
      leftEyeCol: 0x22c55e,
      rightEyeCol: 0x22c55e,
      x: 845,
      y: 692,
      minX: 815,
      maxX: 905,
      minY: 682,
      maxY: 706
    }
  ];

  catSpecs.forEach((spec, idx) => {
    const catGroup = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: spec.coat, roughness: 0.65 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: spec.chestBib ? 0xffffff : spec.coat, roughness: 0.6 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.5 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.30, 0.72), coatMat);
    body.position.y = 0.28;
    body.castShadow = true;
    catGroup.add(body);

    if (spec.stripeColor !== null) {
      const stripeMat = new THREE.MeshStandardMaterial({ color: spec.stripeColor, roughness: 0.7 });
      [-0.18, 0.0, 0.18].forEach(sz => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.31, 0.08), stripeMat);
        stripe.position.set(0, 0.285, sz);
        catGroup.add(stripe);
      });
    }

    if (spec.chestBib) {
      const ruff = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), whiteMat);
      ruff.scale.set(1.05, 0.95, 0.85);
      ruff.position.set(0, 0.31, 0.32);
      catGroup.add(ruff);
    }

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), coatMat);
    head.position.set(0, 0.48, 0.38);
    catGroup.add(head);

    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), spec.chestBib ? whiteMat : coatMat);
    muzzle.scale.set(1.1, 0.8, 0.9);
    muzzle.position.set(0, 0.44, 0.55);
    const pinkNose = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), pinkMat);
    pinkNose.position.set(0, 0.47, 0.64);
    catGroup.add(muzzle, pinkNose);

    const leftEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshBasicMaterial({ color: spec.leftEyeCol })
    );
    leftEye.position.set(-0.085, 0.52, 0.565);
    const rightEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshBasicMaterial({ color: spec.rightEyeCol })
    );
    rightEye.position.set(0.085, 0.52, 0.565);

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.055, 0.02), pupilMat);
    leftPupil.position.set(-0.085, 0.52, 0.602);
    const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.055, 0.02), pupilMat);
    rightPupil.position.set(0.085, 0.52, 0.602);
    catGroup.add(leftEye, rightEye, leftPupil, rightPupil);

    const earGeo = new THREE.ConeGeometry(0.085, 0.19, 4);
    const earL = new THREE.Mesh(earGeo, coatMat);
    earL.position.set(-0.12, 0.68, 0.36);
    const earR = new THREE.Mesh(earGeo, coatMat);
    earR.position.set(0.12, 0.68, 0.36);
    catGroup.add(earL, earR);

    const tailRadius = spec.fluffy ? 0.068 : 0.042;
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(tailRadius, tailRadius * 0.75, 0.52, 8), coatMat);
    tail.position.set(0, 0.46, -0.38);
    tail.rotation.x = -0.6;
    catGroup.add(tail);

    const pawMat = spec.chestBib ? whiteMat : coatMat;
    const legGeo = new THREE.CylinderGeometry(0.052, 0.046, 0.24, 8);
    const legs = [];
    [[-0.14, 0.12, 0.22], [0.14, 0.12, 0.22], [-0.14, 0.12, -0.22], [0.14, 0.12, -0.22]].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, pawMat);
      leg.position.set(lx, ly, lz);
      catGroup.add(leg);
      legs.push(leg);
    });

    catGroup.scale.set(1.12, 1.12, 1.12);
    catGroup.position.set(to3DX(spec.x), 0, to3DZ(spec.y));
    scene.add(catGroup);

    streetCats.push({
      mesh: catGroup,
      tail,
      legs,
      head,
      x: spec.x,
      y: spec.y,
      targetX: spec.x + (idx % 2 === 0 ? 40 : -40),
      targetY: spec.y,
      minX: spec.minX,
      maxX: spec.maxX,
      minY: spec.minY,
      maxY: spec.maxY,
      pauseTimer: 0,
      phase: idx * 1.4
    });
  });
}

function initAmbientPedestrians() {
  const colors = [0x0284c7, 0xd97706, 0x16a34a, 0x9333ea];
  const lanes = [726, 762, 738, 752];
  for (let i = 0; i < 4; i++) {
    const startX = 140 + i * 220;
    const startY = lanes[i];
    const rig = createCharacterRig({
      role: 'customer',
      gender: i % 2 === 0 ? 'male' : 'female',
      topColor: colors[i % colors.length],
      pantsColor: 0x1e293b,
      hair: i % 2 === 0 ? 'short' : 'headscarf',
      skinColor: 0xfde68a
    });
    ambientPedestrians.push({
      x: startX,
      y: startY,
      laneY: startY,
      dir: i % 2 === 0 ? 1 : -1,
      speed: 48 + i * 5,
      walkCycle: i * 1.5,
      facingAngle: i % 2 === 0 ? Math.PI / 2 : -Math.PI / 2,
      tray: [],
      rig
    });
  }
}

function updateExteriorLife(dt) {
  const outdoorBoxes = [
    { x: 170, y: 732, hw: 28, hh: 18 }, // Simit Cart (completely outside on left plaza)
    { x: 824, y: 726, hw: 24, hh: 18 }  // Stone Fountain (completely outside on right plaza)
  ];

  // Only include customers who are walking horizontally on the sidewalk (NEVER clamp customers entering/exiting the door!)
  const sidewalkHumans = [player, ...ambientPedestrians];
  customers.forEach(c => {
    if (!c.remove && (c.state === 'walking_sidewalk' || c.state === 'leaving_sidewalk') && Math.abs(c.x - doorWay.x) > 36) {
      sidewalkHumans.push(c);
    }
  });

  // 0A) Animate 7 Soaring Bosphorus Seagulls (Flapping wings & figure-8 gliding)
  seagulls.forEach(g => {
    g.angle += g.speed * dt;
    g.flapPhase += dt * 7.5;
    const gx = g.centerX + Math.cos(g.angle) * g.radiusX;
    const gz = g.centerZ + Math.sin(g.angle * 2) * g.radiusZ;
    const gy = g.baseY + Math.sin(g.angle * 1.5) * 0.45;
    const nextGx = g.centerX + Math.cos(g.angle + 0.05) * g.radiusX;
    const nextGz = g.centerZ + Math.sin((g.angle + 0.05) * 2) * g.radiusZ;
    g.group.position.set(gx, gy, gz);
    g.group.rotation.y = Math.atan2(nextGx - gx, nextGz - gz);
    const flap = Math.sin(g.flapPhase) * 0.48;
    g.leftWingPivot.rotation.z = flap;
    g.rightWingPivot.rotation.z = -flap;
  });

  // 0B) Animate Bosphorus Ferry (Şehir Hatları Vapuru)
  if (bosphorusFerryGroup) {
    bosphorusFerryGroup.position.x += bosphorusFerryGroup.userData.dir * bosphorusFerryGroup.userData.speed * dt;
    bosphorusFerryGroup.position.y = Math.sin(gameTime * 2.2) * 0.06;
    if (bosphorusFerryGroup.position.x > 48) {
      bosphorusFerryGroup.userData.dir = -1;
      bosphorusFerryGroup.rotation.y = Math.PI;
    } else if (bosphorusFerryGroup.position.x < -48) {
      bosphorusFerryGroup.userData.dir = 1;
      bosphorusFerryGroup.rotation.y = 0;
    }
  }

  // 0C) Animate Two Tonton Dedes Playing Backgammon (Tavla) at Çınar Kıraathanesi!
  if (tavlaDede1 && tavlaDede2) {
    const turn1 = Math.sin(gameTime * 1.6) > 0;
    if (turn1) {
      tavlaDede1.rightArmPivot.rotation.x = -1.05 + Math.sin(gameTime * 9) * 0.35;
      tavlaDede1.headGroup.rotation.x = 0.18 + Math.sin(gameTime * 4) * 0.06;
      tavlaDede2.rightArmPivot.rotation.x = -0.75;
      tavlaDede2.headGroup.rotation.y = Math.sin(gameTime * 2) * 0.15;
    } else {
      tavlaDede2.rightArmPivot.rotation.x = -1.05 + Math.sin(gameTime * 9) * 0.35;
      tavlaDede2.headGroup.rotation.x = 0.18 + Math.sin(gameTime * 4) * 0.06;
      tavlaDede1.rightArmPivot.rotation.x = -0.75;
      tavlaDede1.headGroup.rotation.y = Math.sin(gameTime * 2) * 0.15;
    }
  }

  // 1) Update Street Cats with Strict Cat-vs-Cat, Cat-vs-Human & Cat-vs-Obstacle Separation (Zero Passing Through!)
  streetCats.forEach((cat, cIdx) => {
    cat.phase += dt * 5.2;
    cat.tail.rotation.z = Math.sin(cat.phase) * 0.42;
    cat.head.rotation.y = Math.sin(cat.phase * 0.45) * 0.22;

    if (cat.pauseTimer > 0) {
      cat.pauseTimer -= dt;
      cat.legs.forEach(leg => { leg.rotation.x = 0; });
    } else {
      const dx = cat.targetX - cat.x;
      const dy = cat.targetY - cat.y;
      const d = Math.hypot(dx, dy);

      if (d < 7) {
        cat.pauseTimer = 1.4 + Math.random() * 1.8;
        cat.targetX = cat.minX + Math.random() * (cat.maxX - cat.minX);
        cat.targetY = cat.minY + Math.random() * (cat.maxY - cat.minY);
      } else {
        const catSpeed = 32;
        cat.x += (dx / d) * catSpeed * dt;
        cat.y += (dy / d) * catSpeed * dt;
        cat.mesh.rotation.y = Math.atan2(dx, dy);
        cat.legs.forEach((leg, lIdx) => {
          leg.rotation.x = Math.sin(cat.phase * 1.8 + (lIdx % 2) * Math.PI) * 0.45;
        });
      }
    }

    // Repel from outdoor obstacles (Simit Cart, Fountain, Doorway)
    outdoorBoxes.forEach(ob => {
      const cx = Math.max(ob.x - ob.hw, Math.min(cat.x, ob.x + ob.hw));
      const cy = Math.max(ob.y - ob.hh, Math.min(cat.y, ob.y + ob.hh));
      const odx = cat.x - cx;
      const ody = cat.y - cy;
      const od = Math.hypot(odx, ody);
      if (od < 14 && od > 0.0001) {
        cat.x += (odx / od) * (14 - od);
        cat.y += (ody / od) * (14 - od);
      }
    });

    // Repel from humans so cats never walk through people
    sidewalkHumans.forEach(h => {
      const hdx = cat.x - h.x;
      const hdy = cat.y - h.y;
      const hd = Math.hypot(hdx, hdy);
      if (hd < 20 && hd > 0.0001) {
        cat.x += (hdx / hd) * (20 - hd) * 0.6;
        cat.y += (hdy / hd) * (20 - hd) * 0.6;
      }
    });

    // Repel from other cats so cats NEVER pass through each other!
    for (let j = 0; j < streetCats.length; j++) {
      if (j === cIdx) continue;
      const other = streetCats[j];
      const cdx = cat.x - other.x;
      const cdy = cat.y - other.y;
      const cd = Math.hypot(cdx, cdy);
      const minCatDist = 22;
      if (cd < minCatDist && cd > 0.0001) {
        const push = (minCatDist - cd) * 0.55;
        cat.x += (cdx / cd) * push;
        cat.y += (cdy / cd) * push;
        other.x -= (cdx / cd) * push;
        other.y -= (cdy / cd) * push;
        // Pick a fresh non-colliding target
        cat.targetX = cat.minX + Math.random() * (cat.maxX - cat.minX);
      }
    }

    cat.x = Math.max(cat.minX, Math.min(cat.maxX, cat.x));
    cat.y = Math.max(cat.minY, Math.min(cat.maxY, cat.y));
    cat.mesh.position.set(to3DX(cat.x), 0, to3DZ(cat.y));
  });

  // 2) Update Ambient Pedestrians along dedicated non-overlapping sidewalk lanes
  ambientPedestrians.forEach(ped => {
    ped.x += ped.dir * ped.speed * dt;
    ped.y += (ped.laneY - ped.y) * Math.min(1, dt * 4.0);
    ped.facingAngle = ped.dir > 0 ? Math.PI / 2 : -Math.PI / 2;

    if (ped.x > 895) {
      ped.dir = -1;
    } else if (ped.x < 85) {
      ped.dir = 1;
    }
  });

  // 3) Smooth Y-Axis Lane Sidestepping so exterior people NEVER get stuck on each other or on assets!
  for (let i = 0; i < sidewalkHumans.length; i++) {
    const a = sidewalkHumans[i];
    if (a !== player) {
      outdoorBoxes.forEach(ob => {
        if (Math.abs(a.x - ob.x) < ob.hw + 14 && a.y < ob.y + ob.hh + 14) {
          a.y = Math.max(a.y, ob.y + ob.hh + 15);
        }
      });
    }
    for (let j = i + 1; j < sidewalkHumans.length; j++) {
      const b = sidewalkHumans[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.hypot(dx, dy);
      const minDist = 22;
      if (d < minDist && d > 0.0001) {
        // Primarily separate along Y (sidewalk width) so horizontal walking progress is never blocked!
        const pushY = ((minDist - d) * 0.55) * (dy >= 0 ? 1 : -1);
        const pushX = (dx / d) * (minDist - d) * 0.20;
        if (a !== player) {
          a.y = Math.max(714, Math.min(768, a.y + pushY));
          a.x += pushX;
        }
        if (b !== player) {
          b.y = Math.max(714, Math.min(768, b.y - pushY));
          b.x -= pushX;
        }
      }
    }
  }

  ambientPedestrians.forEach(ped => {
    ped.y = Math.max(716, Math.min(768, ped.y));
    updateCharacterAnimation(ped, dt, true, false);
  });
}

// ============================================================================
// BUILD 3D STATIONS, +X QUEUE COUNTERS, TRADITIONAL TABLES & SEMAVER
// ============================================================================
function buildStation3D(st) {
  const group = new THREE.Group();
  group.position.set(to3DX(st.x), 0, to3DZ(st.y));

  const mCfg = MENU_CONFIG[st.itemKey];
  const baseMat = new THREE.MeshStandardMaterial({ color: mCfg.color, roughness: 0.45 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.35, 2.2), baseMat);
  base.position.y = 0.675;
  base.castShadow = true;
  group.add(base);

  const topSlab = new THREE.Mesh(
    new THREE.BoxGeometry(2.75, 0.16, 2.35),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25 })
  );
  topSlab.position.y = 1.42;
  group.add(topSlab);

  const signBoard = createSignboard3D(st.signTitle, st.signSub, '#3b1d0a', '#f59e0b', 2.4, 0.62);
  signBoard.position.set(0, 3.25, 0);
  group.add(signBoard);

  let coneMesh = null;
  if (mCfg.type === 'food') {
    const grillBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.55, 1.45),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 })
    );
    grillBack.position.set(-0.68, 2.22, 0);
    group.add(grillBack);

    for (let i = 0; i < 3; i++) {
      const burner = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.36, 1.15),
        new THREE.MeshBasicMaterial({ color: 0xff5500 })
      );
      burner.position.set(-0.48, 1.82 + i * 0.45, 0);
      group.add(burner);
    }

    const spitPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.85, 10),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
    );
    spitPole.position.set(-0.1, 2.35, 0);
    group.add(spitPole);

    const coneColor = st.itemKey === 'iskender' ? 0x991b1b : 0xd97706;
    coneMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.54, 0.34, 1.25, 18),
      new THREE.MeshStandardMaterial({ color: coneColor, roughness: 0.5 })
    );
    coneMesh.position.set(-0.1, 2.30, 0);
    coneMesh.castShadow = true;
    group.add(coneMesh);
  } else {
    const disp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.58, 1.25, 18),
      new THREE.MeshStandardMaterial({
        color: st.itemKey === 'ayran' ? 0xf8fafc : 0x881337,
        roughness: 0.25
      })
    );
    disp.position.set(-0.15, 2.05, 0);
    disp.castShadow = true;
    group.add(disp);
  }

  const stockGroup = new THREE.Group();
  stockGroup.position.set(0.65, 1.50, 0);
  group.add(stockGroup);

  // Dedicated Floor Action Pad right in front of the station (st.padX, st.padY)
  const actionPad = createActionPadMesh3D(0.92, 0xfacc15);
  actionPad.position.set(to3DX(st.padX) - to3DX(st.x), 0, to3DZ(st.padY) - to3DZ(st.y));
  actionPad.rotation.y = st.carveFacing || 0;
  group.add(actionPad);

  scene.add(group);
  st.meshGroup = group;
  st.coneMesh = coneMesh;
  st.stockGroup = stockGroup;
  st.actionPadMesh = actionPad;
}

function createCounterTraySlotTexture(label, bgHex, borderHex) {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.beginPath();
  ctx.roundRect(6, 6, 148, 148, 26);
  ctx.fill();
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '82px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 80, 86);
  return applyCrispTextureSettings(new THREE.CanvasTexture(c));
}

function buildCounter3D(cnt) {
  const group = new THREE.Group();
  group.position.set(to3DX(cnt.x), 0, to3DZ(cnt.y));

  // Generous counter top so Ekmek Döner, Zurna Dürüm, İskender, Ayran & Şalgam each have their own distinct slot!
  const w = 2.75;
  const d = 4.65;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(w, 1.38, d),
    new THREE.MeshStandardMaterial({ map: getNaturalWoodTexture(), roughness: 0.55 })
  );
  base.position.y = 0.69;
  base.castShadow = true;
  group.add(base);

  const topMat = new THREE.MeshStandardMaterial({
    color: cnt.id === 'dineIn' ? 0xf59e0b : (cnt.id === 'lineUp' ? 0xa855f7 : 0x06b6d4),
    roughness: 0.35
  });
  const topSlab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.22, 0.16, d + 0.22), topMat);
  topSlab.position.y = 1.44;
  group.add(topSlab);

  let signTitle = '🍽️ SALON SİPARİŞ';
  let signSub = 'MASA SERVİS BANKOSU';
  let signBg = '#451a03';
  let signBorder = '#f59e0b';
  if (cnt.id === 'lineUp') {
    signTitle = '🥡 PAKET SERVİS';
    signSub = 'AL-GÖTÜR SIRA BANKOSU';
    signBg = '#3b0764';
    signBorder = '#c084fc';
  } else if (cnt.id === 'driveThru') {
    signTitle = '🚗 ARAÇLA SERVİS';
    signSub = 'DRIVE-THRU GİŞESİ';
    signBg = '#083344';
    signBorder = '#22d3ee';
  }

  const signBoard = createSignboard3D(signTitle, signSub, signBg, signBorder, 3.3, 0.72);
  signBoard.position.set(0, 3.35, 0);
  group.add(signBoard);

  if (cnt.id === 'dineIn' || cnt.id === 'lineUp') {
    const carpetColor = cnt.id === 'dineIn' ? 0xb45309 : 0x7e22ce;
    const queueCarpet = new THREE.Mesh(
      new THREE.BoxGeometry(9.8, 0.04, 1.75),
      new THREE.MeshStandardMaterial({ color: carpetColor, roughness: 0.85 })
    );
    queueCarpet.position.set(6.2, 0.12, 0);
    group.add(queueCarpet);

    for (let s = 0; s < 6; s++) {
      const spotX = 2.6 + s * 1.6;
      const footprintDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.05, 20),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      footprintDisc.position.set(spotX, 0.13, 0);
      const outerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.42, 0.52, 20),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
      );
      outerRing.rotation.x = -Math.PI / 2;
      outerRing.position.set(spotX, 0.155, 0);
      group.add(footprintDisc, outerRing);
    }
  }

  // Create dedicated 3D Serving Trays & Stack Groups for each item type on the counter!
  cnt.stackGroups = {};
  cnt.traySlots3D = {};
  Object.keys(COUNTER_SLOT_OFFSETS_3D).forEach(itemKey => {
    const slotCfg = COUNTER_SLOT_OFFSETS_3D[itemKey];
    const trayGroup = new THREE.Group();
    trayGroup.position.set(slotCfg.x, 1.52, slotCfg.z);

    const trayRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.05, 0.84),
      new THREE.MeshStandardMaterial({ color: MENU_CONFIG[itemKey].color, roughness: 0.4 })
    );
    const trayTop = new THREE.Mesh(
      new THREE.PlaneGeometry(0.80, 0.76),
      new THREE.MeshBasicMaterial({ map: createCounterTraySlotTexture(slotCfg.label, slotCfg.bg, slotCfg.border), transparent: true })
    );
    trayTop.rotation.x = -Math.PI / 2;
    trayTop.position.y = 0.028;
    trayGroup.add(trayRim, trayTop);
    group.add(trayGroup);
    cnt.traySlots3D[itemKey] = trayGroup;

    const stGroup = new THREE.Group();
    stGroup.position.set(slotCfg.x, slotCfg.y, slotCfg.z);
    group.add(stGroup);
    cnt.stackGroups[itemKey] = stGroup;
  });

  const cashGroup = new THREE.Group();
  cashGroup.position.set(to3DX(cnt.cashX) - to3DX(cnt.x), 0.15, to3DZ(cnt.cashY) - to3DZ(cnt.y));

  // Dedicated Floor Drop Pad (left/kitchen side of counter) & Cash Pickup Pad
  const dropPad = createActionPadMesh3D(0.90, 0x38bdf8);
  dropPad.position.set(to3DX(cnt.dropPadX) - to3DX(cnt.x), 0, to3DZ(cnt.dropPadY) - to3DZ(cnt.y));
  dropPad.rotation.y = Math.PI / 2;

  const cashPad = createActionPadMesh3D(0.80, 0x4ade80);
  cashPad.position.set(to3DX(cnt.cashX) - to3DX(cnt.x), 0, to3DZ(cnt.cashY) - to3DZ(cnt.y));

  group.add(cashGroup, dropPad, cashPad);
  scene.add(group);

  cnt.meshGroup = group;
  cnt.cashGroup = cashGroup;
  cnt.dropPadMesh = dropPad;
  cnt.cashPadMesh = cashPad;
}

function buildTable3D(tb) {
  const group = new THREE.Group();
  group.position.set(to3DX(tb.x), 0, to3DZ(tb.y));

  const naturalWoodMat = new THREE.MeshStandardMaterial({
    map: getNaturalWoodTexture(),
    roughness: 0.52,
    metalness: 0.05
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x5c3415, roughness: 0.6 });
  const kilimMat = new THREE.MeshStandardMaterial({
    map: getKilimCushionTexture(),
    roughness: 0.82
  });

  const rugUnderlay = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 0.04, 3.8),
    new THREE.MeshStandardMaterial({ map: getKilimCushionTexture(), roughness: 0.9 })
  );
  rugUnderlay.position.y = 0.12;
  group.add(rugUnderlay);

  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.15, 2.05), naturalWoodMat);
  tableTop.position.y = 1.24;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  const apron = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.18, 1.85), darkTrimMat);
  apron.position.y = 1.12;
  group.add(apron);

  const legGeo = new THREE.BoxGeometry(0.18, 1.12, 0.18);
  [[-1.22, -0.82], [1.22, -0.82], [-1.22, 0.82], [1.22, 0.82]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, naturalWoodMat);
    leg.position.set(lx, 0.56, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  function createTraditionalChair(cx, cz, rotY) {
    const chair = new THREE.Group();
    chair.position.set(cx, 0, cz);
    chair.rotation.y = rotY;

    const seatFrame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.10, 0.92), naturalWoodMat);
    seatFrame.position.y = 0.62;
    seatFrame.castShadow = true;
    chair.add(seatFrame);

    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.12, 0.84), kilimMat);
    cushion.position.y = 0.72;
    chair.add(cushion);

    const fLegGeo = new THREE.BoxGeometry(0.11, 0.62, 0.11);
    const fLegL = new THREE.Mesh(fLegGeo, naturalWoodMat);
    fLegL.position.set(-0.38, 0.31, 0.38);
    const fLegR = new THREE.Mesh(fLegGeo, naturalWoodMat);
    fLegR.position.set(0.38, 0.31, 0.38);
    chair.add(fLegL, fLegR);

    const bPostGeo = new THREE.BoxGeometry(0.12, 1.72, 0.12);
    const bPostL = new THREE.Mesh(bPostGeo, naturalWoodMat);
    bPostL.position.set(-0.38, 0.86, -0.38);
    bPostL.castShadow = true;
    const bPostR = new THREE.Mesh(bPostGeo, naturalWoodMat);
    bPostR.position.set(0.38, 0.86, -0.38);
    bPostR.castShadow = true;
    chair.add(bPostL, bPostR);

    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.14, 0.10), naturalWoodMat);
    topRail.position.set(0, 1.62, -0.38);
    const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.10, 0.09), naturalWoodMat);
    midRail.position.set(0, 1.24, -0.38);
    const botRail = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.10, 0.09), naturalWoodMat);
    botRail.position.set(0, 0.92, -0.38);
    chair.add(topRail, midRail, botRail);

    const latticeV1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.68, 0.07), darkTrimMat);
    latticeV1.position.set(-0.16, 1.26, -0.38);
    const latticeV2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.68, 0.07), darkTrimMat);
    latticeV2.position.set(0.16, 1.26, -0.38);
    const motifCenter = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.11), kilimMat);
    motifCenter.rotation.z = Math.PI / 4;
    motifCenter.position.set(0, 1.42, -0.38);
    chair.add(latticeV1, latticeV2, motifCenter);

    return chair;
  }

  group.add(createTraditionalChair(0, -1.75, 0));
  group.add(createTraditionalChair(0, 1.75, Math.PI));
  group.add(createTraditionalChair(-2.15, 0, Math.PI / 2));
  group.add(createTraditionalChair(2.15, 0, -Math.PI / 2));

  const placeSettingsGroup = new THREE.Group();
  placeSettingsGroup.position.y = 1.32;
  placeSettingsGroup.visible = false;
  group.add(placeSettingsGroup);

  const trashGroup = new THREE.Group();
  trashGroup.position.y = 1.32;
  group.add(trashGroup);

  const cleanRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.65, 24),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  cleanRing.rotation.x = -Math.PI / 2;
  cleanRing.position.y = 0.16;
  cleanRing.visible = false;
  group.add(cleanRing);

  const cashGroup = new THREE.Group();
  cashGroup.position.set(0, 0.15, 2.05);
  group.add(cashGroup);

  const tableActionPad = createActionPadMesh3D(0.84, 0xf59e0b);
  tableActionPad.position.set(to3DX(tb.padX) - to3DX(tb.x), 0, to3DZ(tb.padY) - to3DZ(tb.y));
  group.add(tableActionPad);

  scene.add(group);
  tb.meshGroup = group;
  tb.placeSettingsGroup = placeSettingsGroup;
  tb.trashGroup = trashGroup;
  tb.cleanRing = cleanRing;
  tb.cashGroup = cashGroup;
  tb.actionPadMesh = tableActionPad;
}

function buildSemaver3D() {
  semaverGroup = new THREE.Group();
  semaverGroup.position.set(to3DX(semaverStation.x), 0, to3DZ(semaverStation.y));

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 1.1, 16),
    new THREE.MeshStandardMaterial({ map: getNaturalWoodTexture(), roughness: 0.5 })
  );
  stand.position.y = 0.55;
  semaverGroup.add(stand);

  const urn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.55, 1.35, 18),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.18 })
  );
  urn.position.y = 1.75;
  urn.castShadow = true;
  semaverGroup.add(urn);

  const teapot = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.25 })
  );
  teapot.position.y = 2.65;
  semaverGroup.add(teapot);

  // 4 Ready-to-Serve Waisted Tea Glasses on Red-and-Gold Porcelain Saucers around the Semaver!
  [[-0.58, 0.42], [0.58, 0.42], [-0.45, 0.65], [0.45, 0.65]].forEach(([gx, gz]) => {
    const gMesh = createInceBelliCayMesh(false);
    gMesh.position.set(gx, 1.10, gz);
    semaverGroup.add(gMesh);
  });

  const semaverSign = createSignboard3D('🫖 SEMAVER ÇAYI', 'TAVŞAN KANI DEMLİ ÇAY', '#451a03', '#facc15', 2.4, 0.62);
  semaverSign.position.set(0, 3.35, 0);
  semaverGroup.add(semaverSign);

  scene.add(semaverGroup);
}

function buildUnlockPad3D() {
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.12, 2.8),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0x78350f, roughness: 0.3 })
  );
  frame.position.y = 0.14;
  group.add(frame);

  const innerBg = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.14, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  innerBg.position.y = 0.15;
  group.add(innerBg);

  activeUnlockFillMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.16, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x14532d })
  );
  activeUnlockFillMesh.position.y = 0.16;
  group.add(activeUnlockFillMesh);

  activeUnlockHoloMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x166534, wireframe: true })
  );
  activeUnlockHoloMesh.position.y = 1.4;
  group.add(activeUnlockHoloMesh);

  scene.add(group);
  activeUnlockPadMesh = group;
}

function rebuildWorldVisibility() {
  stations.forEach(st => {
    if (st.meshGroup) st.meshGroup.visible = st.unlocked;
  });
  const anyDrinkUnlocked = stations.some(s => s.unlocked && MENU_CONFIG[s.itemKey].type === 'drink');
  if (supplyDock.fridgeGroup) supplyDock.fridgeGroup.visible = anyDrinkUnlocked;
  if (supplyDock.drinkPadMesh) supplyDock.drinkPadMesh.visible = anyDrinkUnlocked;
  if (supplyDock.fridgeBottleGroup) supplyDock.fridgeBottleGroup.visible = anyDrinkUnlocked;
  if (supplyDock.drinkTruckGroup) {
    supplyDock.drinkTruckGroup.visible = anyDrinkUnlocked && Math.abs(supplyDock.drinkTruckZ) < 68;
  }

  if (counters.dineIn.meshGroup) counters.dineIn.meshGroup.visible = true;
  if (counters.lineUp.meshGroup) counters.lineUp.meshGroup.visible = state.lineUpUnlocked;
  if (counters.driveThru.meshGroup) counters.driveThru.meshGroup.visible = state.driveThruUnlocked;

  const orderedSlotKeys = ['doner', 'ayran', 'durum', 'salgam', 'iskender'];
  const unlockedSlotKeys = orderedSlotKeys.filter(k => {
    const st = stations.find(s => s.itemKey === k);
    return st ? st.unlocked : (k === 'doner');
  });
  const slotSpacingZ = 0.90;
  unlockedSlotKeys.forEach((k, idx) => {
    const zOff = (idx - (unlockedSlotKeys.length - 1) / 2) * slotSpacingZ;
    if (COUNTER_SLOT_OFFSETS_3D[k]) {
      COUNTER_SLOT_OFFSETS_3D[k].x = 0.0;
      COUNTER_SLOT_OFFSETS_3D[k].z = zOff;
    }
  });

  Object.values(counters).forEach(cnt => {
    if (!cnt.traySlots3D) return;
    orderedSlotKeys.forEach(k => {
      const showSlot = unlockedSlotKeys.includes(k);
      const slotCfg = COUNTER_SLOT_OFFSETS_3D[k];
      if (cnt.traySlots3D[k]) {
        cnt.traySlots3D[k].visible = showSlot;
        if (showSlot && slotCfg) {
          cnt.traySlots3D[k].position.set(slotCfg.x, 1.52, slotCfg.z);
        }
      }
      if (cnt.stackGroups && cnt.stackGroups[k]) {
        cnt.stackGroups[k].visible = showSlot;
        if (showSlot && slotCfg) {
          cnt.stackGroups[k].position.set(slotCfg.x, slotCfg.y, slotCfg.z);
        }
      }
    });
  });

  tables.forEach(tb => {
    if (tb.meshGroup) tb.meshGroup.visible = tb.unlocked;
  });
  if (hrOffice.roomGroup) hrOffice.roomGroup.visible = state.hrUnlocked;
  const hrBtnEl = document.getElementById('open-hr-modal');
  if (hrBtnEl) {
    hrBtnEl.style.opacity = state.hrUnlocked ? '1' : '0.55';
  }
  if (semaverGroup) semaverGroup.visible = state.semaverUnlocked;
  if (driveThruWallMesh) driveThruWallMesh.visible = !state.driveThruUnlocked;
  if (barrierArmMesh) barrierArmMesh.visible = state.barrierUnlocked;

  const isLuxuryZone = state.levelIndex >= 5;
  if (mahalleExteriorGroup) mahalleExteriorGroup.visible = !isLuxuryZone;
  if (luxuryExteriorGroup) luxuryExteriorGroup.visible = isLuxuryZone;
}

// ============================================================================
// ACTORS: USTA (PLAYER), STAFF (GARSONLAR), CUSTOMERS, MILLIONAIRE, THIEF & GUARD
// ============================================================================
const player = {
  x: 410,
  y: 350,
  tray: [],
  isCarving: false,
  pickupCooldown: 0,
  dropCooldown: 0,
  facingAngle: 0,
  walkCycle: 0,
  rig: createCharacterRig({
    role: 'usta',
    gender: 'male',
    topColor: 0xffffff,
    pantsColor: 0x1e293b,
    skinColor: 0xfde68a
  })
};

const staffList = [];
const customers = [];
const driveThruCars = [];

const millionaire = {
  active: false,
  isSecretMillionaire: false,
  x: 490,
  y: 775,
  targetX: 465,
  targetY: 325,
  state: 'idle',
  timer: 45.0,
  revealTimer: 8.0,
  disguised: true,
  wantFood: 'doner',
  lastTipAmount: 80,
  facingAngle: Math.PI,
  walkCycle: 0,
  tray: [],
  rig: null
};

const thiefNPC = {
  active: false,
  isCaught: false,
  x: 490,
  y: 775,
  state: 'idle',
  stealPauseTimer: 8.5,
  stunTimer: 0,
  stolenAmount: 0,
  facingAngle: Math.PI,
  walkCycle: 0,
  tray: [],
  moneyBagMesh: null,
  dizzyGroup: null,
  rig: null
};

const policeCar = {
  active: false,
  x: 1040,
  y: 808,
  pickupX: 490,
  state: 'idle',
  sirenPhase: 0,
  mesh: null,
  redBeacon: null,
  blueBeacon: null
};

const slapEffects3D = [];

const guardNPC = {
  active: false,
  x: 455,
  y: 625,
  slapTimer: 0,
  facingAngle: Math.PI,
  walkCycle: 0,
  tray: [],
  rig: null
};

const lineCutterNPC = {
  active: false,
  mode: 'dineIn',
  x: 490,
  y: 775,
  targetX: 294,
  targetY: 224,
  state: 'idle',
  facingAngle: -Math.PI / 2,
  walkCycle: 0,
  tray: [],
  rig: null
};

let queueArrivalSeq = 0;

function syncStaffCount() {
  const targetCount = HR_UPGRADES.count.values[HR_UPGRADES.count.star] || 0;
  while (staffList.length < targetCount) {
    const idx = staffList.length;
    const rig = createCharacterRig({
      role: 'waiter',
      gender: idx % 2 === 0 ? 'male' : 'female',
      topColor: 0xffffff,
      pantsColor: 0x1e293b,
      skinColor: 0xfde68a
    });
    staffList.push({
      id: idx,
      x: 410 + (idx % 2 === 0 ? -25 : 25),
      y: 235 + idx * 18,
      tray: [],
      facingAngle: 0,
      walkCycle: idx * 1.3,
      rig
    });
  }

  const guardUnlocked = HR_UPGRADES.guard.values[HR_UPGRADES.guard.star];
  if (guardUnlocked && !guardNPC.active) {
    guardNPC.active = true;
    guardNPC.rig = createCharacterRig({
      role: 'guard',
      gender: 'male',
      topColor: 0x1e3a8a,
      pantsColor: 0x0f172a,
      skinColor: 0xfde68a
    });
  }
}

function getUstaSpeed() {
  const base = USTA_UPGRADES.speed.values[USTA_UPGRADES.speed.star - 1] || 120;
  return state.bereketTimer > 0 ? base * 1.30 : base;
}
function getUstaCapacity() {
  return USTA_UPGRADES.capacity.values[USTA_UPGRADES.capacity.star - 1] || 3;
}
function getUstaSliceMult() {
  const base = USTA_UPGRADES.sliceSpeed.values[USTA_UPGRADES.sliceSpeed.star - 1] || 1.00;
  return state.bereketTimer > 0 ? base * 1.65 : base;
}
function getStaffSpeed() {
  return HR_UPGRADES.speed.values[HR_UPGRADES.speed.star - 1] || 84;
}
function getStaffCapacity() {
  return HR_UPGRADES.capacity.values[HR_UPGRADES.capacity.star - 1] || 2;
}

function canActorCarryKey(actor, itemKey, maxCap) {
  if (actor.tray.length >= maxCap) return false;
  if (actor.tray.length === 0) return true;
  const heldKey = actor.tray[0].key;
  if ((heldKey === 'trash' || heldKey === 'wc_trash') && (itemKey === 'trash' || itemKey === 'wc_trash')) {
    return true;
  }
  return heldKey === itemKey;
}

// FAILSAFE AUTO-RETURN: Whenever Usta approaches a different food/drink station or dirty table while holding items,
// automatically return the held items to their source station so Usta NEVER gets stuck holding Ayran!
function autoReturnHeldItemsToSource(actor) {
  if (!actor.tray || actor.tray.length === 0) return;
  const heldKey = actor.tray[0].key;
  if (heldKey === 'trash' || heldKey === 'wc_trash') {
    actor.tray = [];
    syncTray3D(actor);
    return;
  }
  const srcSt = stations.find(s => s.itemKey === heldKey);
  while (actor.tray.length > 0) {
    actor.tray.pop();
    if (srcSt && srcSt.stock < srcSt.maxStock) {
      srcSt.stock++;
    }
  }
  syncTray3D(actor);
}

function syncTray3D(actor) {
  if (!actor.rig || !actor.rig.trayGroup) return;
  const tg = actor.rig.trayGroup;
  while (tg.children.length > actor.tray.length) {
    tg.remove(tg.children[tg.children.length - 1]);
  }
  while (tg.children.length < actor.tray.length) {
    const idx = tg.children.length;
    const item = actor.tray[idx];
    const mesh = createFoodMesh(item.key);
    mesh.position.set(0, idx * 0.25, 0);
    tg.add(mesh);
  }
}

function syncCashPile3D(cashGroup, billCount) {
  if (!cashGroup) return;
  const targetCount = Math.min(Math.max(0, Math.round(billCount)), 18);
  while (cashGroup.children.length > targetCount) {
    cashGroup.remove(cashGroup.children[cashGroup.children.length - 1]);
  }
  const billGeo = new THREE.BoxGeometry(0.55, 0.10, 0.32);
  const billMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x14532d, roughness: 0.4 });
  while (cashGroup.children.length < targetCount) {
    const idx = cashGroup.children.length;
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const mesh = new THREE.Mesh(billGeo, billMat);
    mesh.position.set((col - 1) * 0.62, row * 0.11, 0);
    cashGroup.add(mesh);
  }
}

// 3D Flying Item Arc Animation (for sequential "Tık - Tık - Tık" pickup & counter drop!)
function spawnFlyingItem3D(itemKey, sx, sy, sz, getTx, getTy, getTz) {
  const mesh = createFoodMesh(itemKey);
  mesh.position.set(sx, sy, sz);
  scene.add(mesh);
  state.flyingItems3D.push({
    mesh,
    sx,
    sy,
    sz,
    getTx,
    getTy,
    getTz,
    t: 0,
    duration: 0.18
  });
}

function updateFlyingItems3D(dt) {
  for (let i = state.flyingItems3D.length - 1; i >= 0; i--) {
    const f = state.flyingItems3D[i];
    f.t += dt / f.duration;
    if (f.t >= 1) {
      scene.remove(f.mesh);
      state.flyingItems3D.splice(i, 1);
      continue;
    }
    const tx = f.getTx();
    const ty = f.getTy();
    const tz = f.getTz();
    f.mesh.position.x = f.sx + (tx - f.sx) * f.t;
    f.mesh.position.z = f.sz + (tz - f.sz) * f.t;
    f.mesh.position.y = f.sy + (ty - f.sy) * f.t + Math.sin(f.t * Math.PI) * 0.85;
    f.mesh.rotation.y += dt * 10;
  }
}

// ============================================================================
// CHARACTER ANIMATION CONTROLLER (PROPORTIONATE RIG AT 0.76x SCALE)
// ============================================================================
function updateCharacterAnimation(actor, dt, isMoving, isCarving = false) {
  const rig = actor.rig;
  if (!rig) return;

  rig.group.position.x = to3DX(actor.x);
  rig.group.position.z = to3DZ(actor.y);

  let diff = actor.facingAngle - rig.group.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  rig.group.rotation.y += diff * Math.min(1, dt * 14);

  const isSeated = actor.state === 'eating' && actor.mode === 'dineIn';

  if (isSeated) {
    rig.leftHipPivot.rotation.x = -Math.PI / 2;
    rig.rightHipPivot.rotation.x = -Math.PI / 2;
    rig.torso.position.y = 0.96;
    rig.headGroup.position.y = 1.88;
    rig.leftArmPivot.position.y = 1.36;
    rig.rightArmPivot.position.y = 1.36;

    actor.walkCycle += dt * 5;
    rig.leftArmPivot.rotation.x = -0.65 + Math.sin(actor.walkCycle) * 0.20;
    rig.rightArmPivot.rotation.x = -0.65 + Math.cos(actor.walkCycle) * 0.20;
    return;
  } else {
    rig.torso.position.y = 1.24;
    rig.headGroup.position.y = 2.16;
    rig.leftArmPivot.position.y = 1.64;
    rig.rightArmPivot.position.y = 1.64;
  }

  if (isMoving) {
    actor.walkCycle += dt * 13;
    const swing = Math.sin(actor.walkCycle) * 0.65;
    rig.leftHipPivot.rotation.x = swing;
    rig.rightHipPivot.rotation.x = -swing;
    rig.torso.position.y = 1.24 + Math.abs(Math.cos(actor.walkCycle * 2)) * 0.05;
    rig.headGroup.position.y = 2.16 + Math.abs(Math.cos(actor.walkCycle * 2)) * 0.05;
  } else {
    rig.leftHipPivot.rotation.x *= 0.8;
    rig.rightHipPivot.rotation.x *= 0.8;
  }

  const carrying = actor.tray && actor.tray.length > 0;
  const holdingTea = actor.teaGlassMesh && actor.teaGlassMesh.visible;
  if (rig.knifeGroup) rig.knifeGroup.visible = isCarving;

  if (actor.slapTimer && actor.slapTimer > 0) {
    actor.slapTimer = Math.max(0, actor.slapTimer - dt);
    const slapProg = 1.0 - (actor.slapTimer / 0.45);
    const slapSwing = Math.sin(slapProg * Math.PI * 2.2);
    rig.rightArmPivot.rotation.x = -1.45;
    rig.rightArmPivot.rotation.z = -slapSwing * 1.35;
    rig.leftArmPivot.rotation.x = -0.45;
    rig.torso.rotation.y = slapSwing * 0.45;
  } else {
    rig.torso.rotation.y = 0;
  }

  if (actor.slapTimer && actor.slapTimer > 0) {
    // Handled above by slap swing pose
  } else if (isCarving) {
    actor.walkCycle += dt * 20;
    rig.leftArmPivot.rotation.x = -0.6;
    rig.rightArmPivot.rotation.x = -1.1 + Math.sin(actor.walkCycle) * 0.55;
    rig.rightArmPivot.rotation.z = Math.cos(actor.walkCycle) * 0.25;
  } else if (carrying) {
    rig.leftArmPivot.rotation.x = -1.15;
    rig.rightArmPivot.rotation.x = -1.15;
    rig.rightArmPivot.rotation.z = 0;
  } else if (holdingTea) {
    // Customer holds the waisted Turkish tea glass + red-gold reference saucer in hand while sipping!
    actor.walkCycle += dt * 3.5;
    rig.rightArmPivot.rotation.x = -1.10 + Math.sin(actor.walkCycle) * 0.12;
    rig.leftArmPivot.rotation.x = 0;
    rig.rightArmPivot.rotation.z = 0;
  } else if (isMoving) {
    const armSwing = Math.sin(actor.walkCycle) * 0.5;
    rig.leftArmPivot.rotation.x = -armSwing;
    rig.rightArmPivot.rotation.x = armSwing;
    rig.rightArmPivot.rotation.z = 0;
  } else {
    rig.leftArmPivot.rotation.x *= 0.85;
    rig.rightArmPivot.rotation.x *= 0.85;
    rig.rightArmPivot.rotation.z = 0;
  }
}

// ============================================================================
// HUD, MODALS (HR, AREA, MENU, TEST) & AUDIO MIXER CONTROLS
// ============================================================================
function spawnFloatingText(text, x, y, color = '#fde047') {
  state.floatingPopups2D.push({ text, x, y, color, alpha: 1.0, vy: -36, life: 1.15 });
}

function showAlert(msg) {
  const containerEl = document.getElementById('alert-container');
  if (!containerEl) return;
  const div = document.createElement('div');
  div.className = 'event-toast';
  div.textContent = msg;
  containerEl.appendChild(div);
  setTimeout(() => {
    if (div.parentNode) div.parentNode.removeChild(div);
  }, 3400);
}

function getMillionaireTipAmount() {
  // Satisfying ("göz doyuran") yet balanced ("oyun akışını bozmayan") Millionaire reward:
  // Roughly ~22-25% of the current level's unlock pad cost (enough for 1 nice HR upgrade without skipping levels!)
  const levelTips = [240, 340, 480, 650, 880, 1150, 1500, 2100, 2900, 3800];
  return levelTips[Math.min(state.levelIndex, levelTips.length - 1)] || 240;
}

function addCash(amount, x, y, label = '', applyBereketMult = true) {
  const mult = (applyBereketMult && state.bereketTimer > 0) ? 1.5 : 1.0;
  const total = Math.round(amount * mult);
  state.cash += total;
  // Cap single-event XP gain at 45 XP so a generous Millionaire cash reward never skips XP levels!
  const xpGain = Math.min(45, Math.max(4, Math.round(total * 0.25)));
  state.xp += xpGain;
  if (label !== 'TEST') {
    state.dailyStats.grossRevenue += total;
  }
  spawnFloatingText(label ? `${label} +${total} ₺` : `+${total} ₺`, x, y, '#4ade80');
  if (window.SFX) window.SFX.playCash();
  updateHUD();
}

function updateDayNightCycle(dt) {
  if (state.isNightClosed) return;
  state.dayTime = Math.min(DAY_DURATION, state.dayTime + dt);
  const progress = state.dayTime / DAY_DURATION; // 0.0 (08:00) -> 1.0 (22:00)

  // Compute clock time (08:00 to 22:00 = 14 hours = 840 minutes)
  const totalMins = Math.floor(8 * 60 + progress * 14 * 60);
  const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
  const mm = String((totalMins % 60) - ((totalMins % 60) % 10)).padStart(2, '0');

  let phaseIcon = '☀️';
  let phaseName = 'Sabah';
  const skyColor = new THREE.Color();

  if (progress < 0.28) {
    // Morning (08:00 - 12:00): Crisp sunny Bosphorus morning
    phaseIcon = '🌅';
    phaseName = 'Sabah';
    skyColor.setHex(0x7dd3fc).lerp(new THREE.Color(0x38bdf8), progress / 0.28);
    hemiLight.intensity = 0.62;
    dirLight.intensity = 0.78;
    dirLight.color.setHex(0xfffbeb);
  } else if (progress < 0.58) {
    // Midday / Afternoon (12:00 - 16:00): Bright sunny afternoon
    phaseIcon = '☀️';
    phaseName = 'Öğle';
    skyColor.setHex(0x38bdf8).lerp(new THREE.Color(0x60a5fa), (progress - 0.28) / 0.30);
    hemiLight.intensity = 0.65;
    dirLight.intensity = 0.82;
    dirLight.color.setHex(0xffedd5);
  } else if (progress < 0.80) {
    // Sunset over the Bosphorus (16:00 - 19:15): Golden-Orange-Crimson Sunset!
    const sp = (progress - 0.58) / 0.22;
    phaseIcon = '🌇';
    phaseName = 'Boğaz Gün Batımı';
    if (sp < 0.5) {
      skyColor.setHex(0x60a5fa).lerp(new THREE.Color(0xf97316), sp * 2);
    } else {
      skyColor.setHex(0xf97316).lerp(new THREE.Color(0x9d174d), (sp - 0.5) * 2);
    }
    hemiLight.intensity = 0.50;
    dirLight.intensity = 0.68;
    dirLight.color.setHex(0xfb923c);
  } else {
    // Night & Full Moon over the Bosphorus (19:15 - 22:00): Starry Night Blue!
    const np = (progress - 0.80) / 0.20;
    phaseIcon = '🌙';
    phaseName = 'Gece';
    skyColor.setHex(0x9d174d).lerp(new THREE.Color(0x0b1528), Math.min(1, np * 1.6));
    hemiLight.intensity = 0.36;
    dirLight.intensity = 0.42;
    dirLight.color.setHex(0x93c5fd);
  }

  scene.background.copy(skyColor);
  if (scene.fog) scene.fog.color.copy(skyColor);

  // Move Sun from East (+X = +36) across the sky to West (-X = -36)
  if (sunMesh) {
    const sunVis = progress < 0.82;
    sunMesh.visible = sunVis;
    if (sunVis) {
      const sunProg = progress / 0.82;
      const sunX = 22 - sunProg * 44; // East (+22) -> West (-22)
      const sunY = 4.2 + Math.sin(sunProg * Math.PI) * 6.8;
      sunMesh.position.set(sunX, sunY, -36);
      sunMesh.material.color.setHex(progress > 0.58 ? 0xf97316 : 0xfef08a);
      if (waterReflectionMesh) {
        waterReflectionMesh.position.x = sunX * 0.55;
        waterReflectionMesh.material.color.setHex(progress > 0.58 ? 0xfb923c : 0xfef08a);
      }
    }
  }

  // Show Full Moon (Dolunay) & Twinkling Stars at Night (progress >= 0.78)
  if (moonMesh && starsGroup) {
    const nightVis = progress >= 0.78;
    moonMesh.visible = nightVis;
    starsGroup.visible = nightVis;
    if (nightVis) {
      const mProg = (progress - 0.78) / 0.22;
      moonMesh.position.set(-12 + mProg * 6, 8.2 + mProg * 2.5, -35);
      if (waterReflectionMesh) {
        waterReflectionMesh.position.x = moonMesh.position.x * 0.55;
        waterReflectionMesh.material.color.setHex(0xe2e8f0);
      }
    }
  }

  // Bosphorus water color & Bridge LED lights at Sunset/Night
  if (bosphorusWaterMesh) {
    if (progress < 0.58) bosphorusWaterMesh.material.color.setHex(0x0284c7);
    else if (progress < 0.80) bosphorusWaterMesh.material.color.setHex(0x0369a1);
    else bosphorusWaterMesh.material.color.setHex(0x0f172a);
  }
  const bridgeGlowOn = progress >= 0.58;
  bosphorusBridgeLights.forEach((node, idx) => {
    node.visible = bridgeGlowOn;
    if (bridgeGlowOn) {
      const col = (Math.floor(gameTime * 2 + idx) % 2 === 0) ? 0xef4444 : 0x38bdf8;
      node.material.color.setHex(col);
    }
  });
  if (kizKulesiBeacon) {
    kizKulesiBeacon.visible = bridgeGlowOn;
  }

  const iconEl = document.getElementById('day-time-icon');
  const lblEl = document.getElementById('day-time-label');
  if (iconEl) iconEl.textContent = phaseIcon;
  if (lblEl) lblEl.textContent = `GÜN ${state.dayNumber} • ${hh}:${mm} (${phaseName})`;

  // Trigger End-of-Day Night Closing Summary at 22:00!
  if (state.dayTime >= DAY_DURATION && !state.isNightClosed) {
    openDaySummaryModal();
  }
}

function openDaySummaryModal() {
  state.isNightClosed = true;

  // Sweep any remaining cash bills on counters/tables into player's register before closing!
  let sweptCash = 0;
  Object.values(counters).forEach(cnt => {
    if (cnt.cashBills > 0) {
      sweptCash += cnt.cashBills * BILL_VALUE;
      cnt.cashBills = 0;
      syncCashPile3D(cnt.cashGroup, 0);
    }
  });
  tables.forEach(tb => {
    if (tb.cashBills > 0) {
      sweptCash += tb.cashBills * BILL_VALUE;
      tb.cashBills = 0;
      syncCashPile3D(tb.cashGroup, 0);
    }
  });
  if (sweptCash > 0) {
    addCash(sweptCash, player.x, player.y - 20, 'KASA KAPANIŞI', false);
  }

  const titleEl = document.getElementById('summary-modal-title');
  if (titleEl) titleEl.textContent = `🌙 GÜN ${state.dayNumber} SONU — Kapanış & Z-Raporu`;

  const custEl = document.getElementById('sum-customers');
  if (custEl) custEl.textContent = `${state.dailyStats.customersServed} Kişi`;

  const itemsEl = document.getElementById('sum-items');
  if (itemsEl) itemsEl.textContent = `${state.dailyStats.itemsSold} Adet`;

  const grossEl = document.getElementById('sum-gross');
  if (grossEl) grossEl.textContent = `+${state.dailyStats.grossRevenue.toLocaleString('tr-TR')} ₺`;

  const costEl = document.getElementById('sum-cost');
  if (costEl) costEl.textContent = `-${state.dailyStats.supplyCost.toLocaleString('tr-TR')} ₺`;

  const netProfit = state.dailyStats.grossRevenue - state.dailyStats.supplyCost;
  const netEl = document.getElementById('sum-net');
  if (netEl) netEl.textContent = `${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString('tr-TR')} ₺`;

  const modalEl = document.getElementById('day-summary-modal');
  if (modalEl) modalEl.classList.remove('hidden');
  if (window.SFX) window.SFX.playFanfare();
}

function startNextMorningDay() {
  state.dayNumber++;
  state.dayTime = 0;
  state.isNightClosed = false;
  state.dailyStats = {
    customersServed: 0,
    itemsSold: 0,
    grossRevenue: 0,
    supplyCost: 0
  };
  const modalEl = document.getElementById('day-summary-modal');
  if (modalEl) modalEl.classList.add('hidden');
  showAlert(`☀️ GÜN ${state.dayNumber} Başladı! İstanbul Boğazı'nda Güneş Doğuyor, Hayırlı İşler Ustam!`);
  if (window.SFX) window.SFX.playPop();
  updateHUD();
}

function triggerBereketMode(seconds = 30) {
  state.bereketTimer = Math.max(state.bereketTimer, seconds);
  showAlert(`🔥 BEREKET MODU BAŞLADI! (${seconds}sn 2x Hız & Kâr)`);
  if (window.SFX) window.SFX.playFanfare();
  updateHUD();
}

function checkLevelProgression() {
  const unlockedCount = unlockPads.filter(p => p.unlocked).length;
  let newIdx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (unlockedCount >= LEVELS[i].reqPads) newIdx = i;
  }
  if (newIdx > state.levelIndex) {
    state.levelIndex = newIdx;
    const lvlObj = LEVELS[state.levelIndex];
    showAlert(`🎉 ${lvlObj.title}`);
    if (window.SFX) window.SFX.playFanfare();
    rebuildWorldVisibility();
  }
  updateHUD();
}

function updateHUD() {
  const cashEl = document.getElementById('cash-amount');
  if (cashEl) cashEl.textContent = state.cash.toLocaleString('tr-TR');

  const lvlObj = LEVELS[state.levelIndex] || LEVELS[0];
  const titleEl = document.getElementById('level-title');
  if (titleEl) titleEl.textContent = lvlObj.title;

  const xpEl = document.getElementById('xp-display');
  if (xpEl) xpEl.textContent = `${state.xp} XP`;

  const unlockedCount = unlockPads.filter(p => p.unlocked).length;
  const pct = Math.min(100, Math.max(10, Math.round((unlockedCount / unlockPads.length) * 100)));
  const fillEl = document.getElementById('level-progress-fill');
  if (fillEl) fillEl.style.width = `${pct}%`;

  const meatEl = document.getElementById('raw-meat-count');
  if (meatEl) meatEl.textContent = state.rawMeat;
  const drinkEl = document.getElementById('raw-drink-count');
  if (drinkEl) drinkEl.textContent = state.rawDrink;
  const drinkPillEl = document.getElementById('drink-stock-pill');
  if (drinkPillEl) {
    const anyDrinkUnlocked = stations.some(s => s.unlocked && MENU_CONFIG[s.itemKey].type === 'drink');
    drinkPillEl.style.display = anyDrinkUnlocked ? '' : 'none';
  }

  const bereketBanner = document.getElementById('bereket-banner');
  const bereketTimerEl = document.getElementById('bereket-timer');
  if (bereketBanner) {
    if (state.bereketTimer > 0) {
      bereketBanner.classList.remove('hidden');
      if (bereketTimerEl) bereketTimerEl.textContent = Math.ceil(state.bereketTimer);
    } else {
      bereketBanner.classList.add('hidden');
    }
  }
}

function renderHRModal() {
  const ustaHeader = document.getElementById('usta-lv-header');
  if (ustaHeader) ustaHeader.textContent = `👨‍🍳 Usta (Oyuncu) — Seviye ${getUstaOverallLevel()} (Kapasite: ${getUstaCapacity()} | Hız: ${Math.round(getUstaSpeed())})`;
  const staffHeader = document.getElementById('staff-lv-header');
  if (staffHeader) staffHeader.textContent = `🧑‍🍳 Garsonlar & Güvenlik — Seviye ${getStaffOverallLevel()} (Kapasite: ${getStaffCapacity()} | Hız: ${Math.round(getStaffSpeed())})`;

  const ustaList = document.getElementById('usta-upgrade-list');
  if (ustaList) {
    ustaList.innerHTML = '';
    Object.keys(USTA_UPGRADES).forEach(k => {
      const u = USTA_UPGRADES[k];
      const maxStar = u.costs.length;
      const allowedStar = getMaxAllowedUpgradeStar(maxStar);
      const isMax = u.star >= maxStar;
      const isLevelLocked = !isMax && u.star >= allowedStar;
      const nextCost = isMax ? 0 : u.costs[u.star];
      const starsStr = '⭐'.repeat(u.star) + '☆'.repeat(maxStar - u.star);
      const curVal = u.values[u.star - 1];
      const nextVal = !isMax ? u.values[u.star] : curVal;

      let btnLabel = `Yükselt (${nextCost} ₺)`;
      if (isMax) btnLabel = 'MAKSİMUM';
      else if (isLevelLocked) btnLabel = `🔒 Dükkan Sv.${u.star} Gerekli`;

      const row = document.createElement('div');
      row.className = 'upgrade-item';
      row.innerHTML = `
        <div class="upg-info">
          <strong>${u.name} <span style="color:#facc15">${starsStr}</span></strong>
          <small>${u.desc} — <b>${curVal}${!isMax ? ` ➡️ ${nextVal}` : ''}</b></small>
        </div>
        <button class="buy-btn" ${isMax || isLevelLocked || state.cash < nextCost ? 'disabled' : ''}>
          ${btnLabel}
        </button>
      `;
      row.querySelector('.buy-btn').addEventListener('click', () => {
        if (!isMax && !isLevelLocked && state.cash >= nextCost) {
          state.cash -= nextCost;
          u.star++;
          if (window.SFX) window.SFX.playPop();
          updateHUD();
          renderHRModal();
        }
      });
      ustaList.appendChild(row);
    });
  }

  const hrList = document.getElementById('hr-upgrade-list');
  if (hrList) {
    hrList.innerHTML = '';
    Object.keys(HR_UPGRADES).forEach(k => {
      const u = HR_UPGRADES[k];
      const maxStar = u.maxStar || u.costs.length;
      const allowedStar = u.maxStar ? maxStar : getMaxAllowedUpgradeStar(maxStar);
      const isMax = u.star >= maxStar;
      const isLevelLocked = !isMax && !u.maxStar && u.star >= allowedStar;
      const nextCost = isMax ? 0 : u.costs[u.star];
      const starsStr = '⭐'.repeat(u.star) + '☆'.repeat(maxStar - u.star);

      let btnLabel = `Satın Al (${nextCost} ₺)`;
      if (isMax) btnLabel = 'MAKSİMUM';
      else if (isLevelLocked) btnLabel = `🔒 Dükkan Sv.${u.star} Gerekli`;

      const row = document.createElement('div');
      row.className = 'upgrade-item';
      row.innerHTML = `
        <div class="upg-info">
          <strong>${u.name} <span style="color:#facc15">${starsStr}</span></strong>
          <small>${u.desc}</small>
        </div>
        <button class="buy-btn" ${isMax || isLevelLocked || state.cash < nextCost ? 'disabled' : ''}>
          ${btnLabel}
        </button>
      `;
      row.querySelector('.buy-btn').addEventListener('click', () => {
        if (!isMax && !isLevelLocked && state.cash >= nextCost) {
          state.cash -= nextCost;
          u.star++;
          syncStaffCount();
          if (window.SFX) window.SFX.playPop();
          updateHUD();
          renderHRModal();
        }
      });
      hrList.appendChild(row);
    });
  }
}

function renderAreaModal() {
  const list = document.getElementById('area-upgrade-list');
  if (!list) return;
  list.innerHTML = '';

  unlockPads.forEach((pad, idx) => {
    const rem = Math.max(0, pad.cost - pad.paid);
    const canBuyNow = !pad.unlocked && idx === unlockPads.findIndex(p => !p.unlocked) && state.cash >= rem;

    const row = document.createElement('div');
    row.className = 'upgrade-item';
    row.innerHTML = `
      <div class="upg-info">
        <strong>${pad.name}</strong>
        <small>${pad.desc}</small>
      </div>
      <button class="buy-btn" ${pad.unlocked || !canBuyNow ? 'disabled' : ''}>
        ${pad.unlocked ? '✅ AÇILDI' : `İnşa Et (${rem} ₺)`}
      </button>
    `;
    row.querySelector('.buy-btn').addEventListener('click', () => {
      if (!pad.unlocked && state.cash >= rem) {
        state.cash -= rem;
        pad.paid = pad.cost;
        pad.unlocked = true;
        pad.onUnlock();
        checkLevelProgression();
        renderAreaModal();
      }
    });
    list.appendChild(row);
  });
}

function renderMenuModal() {
  const list = document.getElementById('menu-upgrade-list');
  if (!list) return;
  list.innerHTML = '';

  Object.keys(MENU_CONFIG).forEach(key => {
    const m = MENU_CONFIG[key];
    const isMax = m.tier >= 3;
    const nextCost = isMax ? 0 : m.upgradeCosts[m.tier];
    const curPrice = m.prices[m.tier - 1];

    const row = document.createElement('div');
    row.className = 'upgrade-item';
    row.innerHTML = `
      <div class="upg-info">
        <strong>${m.name} (Kalite Lv.${m.tier})</strong>
        <small>Satış Fiyatı: <strong>${curPrice} ₺</strong></small>
      </div>
      <button class="buy-btn" ${isMax || state.cash < nextCost ? 'disabled' : ''}>
        ${isMax ? 'MAKSİMUM KALİTE' : `Kalite Artır (${nextCost} ₺)`}
      </button>
    `;
    row.querySelector('.buy-btn').addEventListener('click', () => {
      if (!isMax && state.cash >= nextCost) {
        state.cash -= nextCost;
        m.tier++;
        if (window.SFX) window.SFX.playPop();
        updateHUD();
        renderMenuModal();
      }
    });
    list.appendChild(row);
  });
}

function setupUIAndAudioEvents() {
  const openModal = (id, renderFn) => {
    if (window.SFX) window.SFX.init();
    if (renderFn) renderFn();
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  };

  const hrBtn = document.getElementById('open-hr-modal');
  if (hrBtn) {
    hrBtn.addEventListener('click', () => {
      if (!state.hrUnlocked) {
        showAlert("🔒 İK (HR) Odası Seviye 3'te (🏢 İK Odası & 1. Çırak Garson alanı açıldığında) hizmete girer!");
        return;
      }
      openModal('hr-modal', renderHRModal);
    });
  }
  const areaBtn = document.getElementById('open-area-modal');
  if (areaBtn) areaBtn.addEventListener('click', () => openModal('area-modal', renderAreaModal));
  const menuBtn = document.getElementById('open-menu-modal');
  if (menuBtn) menuBtn.addEventListener('click', () => openModal('menu-modal', renderMenuModal));
  const testBtn = document.getElementById('open-test-modal');
  if (testBtn) testBtn.addEventListener('click', () => openModal('test-modal'));

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      const modal = document.getElementById(targetId);
      if (modal) modal.classList.add('hidden');
    });
  });

  // Audio Controls
  const musicMuteBtn = document.getElementById('music-mute-btn');
  if (musicMuteBtn) {
    musicMuteBtn.addEventListener('click', () => {
      if (!window.SFX) return;
      window.SFX.init();
      const muted = window.SFX.toggleMusicMute();
      musicMuteBtn.textContent = muted ? '🔇' : '🎵';
    });
  }
  const musicSlider = document.getElementById('music-vol-slider');
  if (musicSlider) {
    musicSlider.addEventListener('input', e => {
      if (!window.SFX) return;
      window.SFX.init();
      const pct = Number(e.target.value);
      window.SFX.setMusicVolume(pct / 100);
      const lbl = document.getElementById('music-vol-pct');
      if (lbl) lbl.textContent = `${pct}%`;
    });
  }
  const musicNextBtn = document.getElementById('music-next-btn');
  if (musicNextBtn) {
    musicNextBtn.addEventListener('click', () => {
      if (!window.SFX) return;
      window.SFX.init();
      const title = window.SFX.nextTrack();
      const trackLbl = document.getElementById('current-track-label');
      if (trackLbl) trackLbl.textContent = `🎼 ${title}`;
    });
  }
  const sizzleMuteBtn = document.getElementById('sizzle-mute-btn');
  if (sizzleMuteBtn) {
    sizzleMuteBtn.addEventListener('click', () => {
      if (!window.SFX) return;
      window.SFX.init();
      const muted = window.SFX.toggleSizzleMute();
      sizzleMuteBtn.textContent = muted ? '🔕' : '🔥';
    });
  }
  const sizzleSlider = document.getElementById('sizzle-vol-slider');
  if (sizzleSlider) {
    sizzleSlider.addEventListener('input', e => {
      if (!window.SFX) return;
      window.SFX.init();
      const pct = Number(e.target.value);
      window.SFX.setSizzleVolume(pct / 100);
      const lbl = document.getElementById('sizzle-vol-pct');
      if (lbl) lbl.textContent = `${pct}%`;
    });
  }

  // Test Sandbox Buttons
  const simCash = document.getElementById('sim-add-cash');
  if (simCash) {
    simCash.addEventListener('click', () => {
      addCash(2500, player.x, player.y - 20, 'TEST');
      document.getElementById('test-modal').classList.add('hidden');
    });
  }
  const simNext = document.getElementById('sim-unlock-next');
  if (simNext) {
    simNext.addEventListener('click', () => {
      const nextPad = unlockPads.find(p => !p.unlocked);
      if (nextPad) {
        nextPad.paid = nextPad.cost;
        nextPad.unlocked = true;
        nextPad.onUnlock();
        checkLevelProgression();
      }
      document.getElementById('test-modal').classList.add('hidden');
    });
  }
  const simAll = document.getElementById('sim-unlock-all');
  if (simAll) {
    simAll.addEventListener('click', () => {
      unlockPads.forEach(p => {
        if (!p.unlocked) {
          p.paid = p.cost;
          p.unlocked = true;
          p.onUnlock();
        }
      });
      checkLevelProgression();
      document.getElementById('test-modal').classList.add('hidden');
    });
  }
  const simAngry = document.getElementById('sim-spawn-angry');
  if (simAngry) {
    simAngry.addEventListener('click', () => {
      spawnLineCutter(true);
      document.getElementById('test-modal').classList.add('hidden');
    });
  }
  const simMillionaire = document.getElementById('sim-spawn-millionaire');
  if (simMillionaire) {
    simMillionaire.addEventListener('click', () => {
      spawnMillionaire();
      document.getElementById('test-modal').classList.add('hidden');
    });
  }
  const simThief = document.getElementById('sim-spawn-thief');
  if (simThief) {
    simThief.addEventListener('click', () => {
      spawnThief(true);
      document.getElementById('test-modal').classList.add('hidden');
    });
  }
  const simDriveThief = document.getElementById('sim-spawn-drivethief');
  if (simDriveThief) {
    simDriveThief.addEventListener('click', () => {
      state.driveThruUnlocked = true;
      state.barrierUnlocked = true;
      rebuildWorldVisibility();
      spawnDriveThruCar(true);
      document.getElementById('test-modal').classList.add('hidden');
    });
  }
  const barrierBtn = document.getElementById('barrier-emergency-btn');
  if (barrierBtn) {
    barrierBtn.addEventListener('click', () => {
      const thiefCar = driveThruCars.find(c => c.isThiefCar && c.state === 'fleeing_drivethru');
      if (thiefCar) {
        thiefCar.state = 'caught_by_barrier';
        barrierBtn.classList.add('hidden');
        const bonus = 80 + state.levelIndex * 25;
        addCash(bonus, counters.driveThru.x, counters.driveThru.y, '🚧 KAPAN YAKALADI!', false);
        showAlert(`🚧 Drive-Thru Hırsızı Kapanla Durduruldu! (+${bonus} ₺)`);
        if (window.SFX) window.SFX.playSlap();
      }
    });
  }
  const simEmptyStock = document.getElementById('sim-empty-stock');
  if (simEmptyStock) {
    simEmptyStock.addEventListener('click', () => {
      state.rawMeat = 0;
      state.rawDrink = 0;
      syncKitchenRawStorage3D();
      updateHUD();
      showAlert('🚚 Tedarik Kamyonları Yanaştı! Sol Cepheden Tavuk ve İçecek Al!');
      document.getElementById('test-modal').classList.add('hidden');
    });
  }
  const simCycleTime = document.getElementById('sim-cycle-time');
  if (simCycleTime) {
    simCycleTime.addEventListener('click', () => {
      document.getElementById('test-modal').classList.add('hidden');
      const prog = state.dayTime / DAY_DURATION;
      if (prog < 0.60) {
        state.dayTime = DAY_DURATION * 0.64; // Jump to Bosphorus Sunset!
        showAlert("🌇 Saat 17:00 — İstanbul Boğazı'nda Gün Batımı Başladı!");
      } else if (prog < 0.82) {
        state.dayTime = DAY_DURATION * 0.85; // Jump to Starry Full Moon Night!
        showAlert("🌙 Saat 20:00 — Boğaz'da Dolunay ve Yıldızlar Yükseldi!");
      } else {
        state.dayTime = DAY_DURATION; // Trigger 22:00 End-of-Day Z-Raporu!
        openDaySummaryModal();
      }
    });
  }
  const nextDayBtn = document.getElementById('start-next-day-btn');
  if (nextDayBtn) {
    nextDayBtn.addEventListener('click', () => {
      startNextMorningDay();
    });
  }
}

// ============================================================================
// KEYBOARD & MOUSE / TOUCH DRAG INPUT
// ============================================================================
const keys = {};
const pointerDrag = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (window.SFX) {
    window.SFX.init();
    const hint = document.getElementById('audio-start-hint');
    if (hint) hint.classList.add('hidden');
  }
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function bindDragEvents(el) {
  if (!el) return;
  el.addEventListener('pointerdown', e => {
    if (window.SFX) {
      window.SFX.init();
      const hint = document.getElementById('audio-start-hint');
      if (hint) hint.classList.add('hidden');
    }
    pointerDrag.active = true;
    pointerDrag.startX = e.clientX;
    pointerDrag.startY = e.clientY;
    pointerDrag.dx = 0;
    pointerDrag.dy = 0;
  });
}
bindDragEvents(renderer.domElement);
bindDragEvents(hudCanvas);

window.addEventListener('pointermove', e => {
  if (!pointerDrag.active) return;
  const dx = e.clientX - pointerDrag.startX;
  const dy = e.clientY - pointerDrag.startY;
  const len = Math.hypot(dx, dy);
  if (len > 8) {
    pointerDrag.dx = dx / len;
    pointerDrag.dy = dy / len;
  } else {
    pointerDrag.dx = 0;
    pointerDrag.dy = 0;
  }
});
window.addEventListener('pointerup', () => {
  pointerDrag.active = false;
  pointerDrag.dx = 0;
  pointerDrag.dy = 0;
});

// ============================================================================
// SPAWNERS: CUSTOMERS (WITH QUANTITY 1..3), DRIVE-THRU CARS, THIEF & MILLIONAIRE
// ============================================================================
const doorWay = { x: 490, y: 668, outsideY: 712, insideY: 618 };

// Strictly proportional station selector so Zurna Dürüm, Ekmek Döner & İskender are ordered in balanced ratios!
function getRandomUnlockedStation(type) {
  const avail = stations.filter(s => s.unlocked && MENU_CONFIG[s.itemKey].type === type);
  if (avail.length === 0) return null;
  if (avail.length === 1) return avail[0];

  const counts = {};
  avail.forEach(s => { counts[s.itemKey] = 0; });

  customers.forEach(c => {
    if (!c.remove && (c.state === 'walking_sidewalk' || c.state === 'entering_door' || c.state === 'queuing')) {
      const k = type === 'food' ? c.wantFood : c.wantDrink;
      if (k && counts[k] !== undefined) counts[k]++;
    }
  });
  driveThruCars.forEach(car => {
    if (!car.remove && (car.state === 'driving_in' || car.state === 'waiting')) {
      const k = type === 'food' ? car.wantFood : car.wantDrink;
      if (k && counts[k] !== undefined) counts[k]++;
    }
  });

  let minCount = Infinity;
  avail.forEach(s => {
    if (counts[s.itemKey] < minCount) minCount = counts[s.itemKey];
  });
  const candidates = avail.filter(s => counts[s.itemKey] <= minCount);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Rebalances existing queued customers immediately when Zurna Dürüm or another station is unlocked!
function rebalanceQueuedCustomerOrders() {
  const unlockedFoods = stations.filter(s => s.unlocked && MENU_CONFIG[s.itemKey].type === 'food');
  const unlockedDrinks = stations.filter(s => s.unlocked && MENU_CONFIG[s.itemKey].type === 'drink');

  if (unlockedFoods.length > 1) {
    let fIdx = 0;
    customers.forEach(c => {
      if (!c.remove && (c.state === 'queuing' || c.state === 'entering_door' || c.state === 'walking_sidewalk') && !c.gotFood && c.gotFoodCount === 0) {
        c.wantFood = unlockedFoods[fIdx % unlockedFoods.length].itemKey;
        fIdx++;
      }
    });
    driveThruCars.forEach(car => {
      if (!car.remove && (car.state === 'waiting' || car.state === 'driving_in') && !car.gotFood && car.gotFoodCount === 0) {
        car.wantFood = unlockedFoods[fIdx % unlockedFoods.length].itemKey;
        fIdx++;
      }
    });
  }

  if (unlockedDrinks.length > 0) {
    let dIdx = 0;
    customers.forEach(c => {
      if (!c.remove && (c.state === 'queuing' || c.state === 'entering_door' || c.state === 'walking_sidewalk') && c.gotDrinkCount === 0) {
        if (c.wantDrink || Math.random() < 0.65) {
          c.wantDrink = unlockedDrinks[dIdx % unlockedDrinks.length].itemKey;
          c.wantDrinkQty = Math.max(1, c.wantDrinkQty || 1);
          c.gotDrink = false;
          dIdx++;
        }
      }
    });
  }
}

function getFreeTableSeat(tb) {
  for (let i = 0; i < tb.seats.length; i++) {
    const s = tb.seats[i];
    // Seat must have NO occupant AND NO uncleaned trash!
    if ((!s.occupant || s.occupant.remove) && !s.hasTrash) return s;
  }
  return null;
}

function spawnCustomerGroup(mode = 'dineIn') {
  if (mode === 'lineUp' && !state.lineUpUnlocked) return;
  const queuedInMode = customers.filter(c => c.mode === mode && (c.state === 'walking_sidewalk' || c.state === 'entering_door' || c.state === 'queuing'));
  if (queuedInMode.length >= 6) return;

  const groupSize = mode === 'dineIn'
    ? (Math.random() < 0.45 ? 1 : (Math.random() < 0.75 ? 2 : 3))
    : 1;

  const shirtPalette = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x14b8a6];
  const spawnFromLeft = Math.random() < 0.5;
  const baseStartX = spawnFromLeft ? 130 : 850;
  const isLuxury = state.levelIndex >= 5;

  for (let i = 0; i < groupSize; i++) {
    if (queuedInMode.length + i >= 6) break;
    const foodSt = getRandomUnlockedStation('food');
    const drinkSt = Math.random() < 0.72 ? getRandomUnlockedStation('drink') : null;

    const maxFoodOrder = state.levelIndex < 2 ? 1 : (state.levelIndex < 5 ? 2 : 3);
    const wantFoodQty = 1 + Math.floor(Math.random() * maxFoodOrder);
    const wantDrinkQty = drinkSt ? (state.levelIndex >= 5 && Math.random() < 0.35 ? 2 : 1) : 0;
    const gender = Math.random() < 0.48 ? 'female' : 'male';

    const rig = createCharacterRig({
      role: isLuxury && Math.random() < 0.55 ? 'whiteCollar' : 'customer',
      gender,
      topColor: shirtPalette[Math.floor(Math.random() * shirtPalette.length)],
      pantsColor: 0x1e293b,
      skinColor: 0xfde68a,
      hair: gender === 'female' && Math.random() < 0.45 ? 'headscarf' : 'short'
    });

    // Attach 3D Waisted Tea Glass + Reference Red-Gold Porcelain Saucer to right hand!
    const teaGlassMesh = createInceBelliCayMesh(true);
    teaGlassMesh.position.set(0, -0.58, 0.24);
    teaGlassMesh.visible = false;
    rig.rightArmPivot.add(teaGlassMesh);

    customers.push({
      id: Math.random(),
      queueSeq: 0,
      mode,
      x: baseStartX + (spawnFromLeft ? -i * 34 : i * 34),
      y: 735 + (i % 2) * 14,
      state: 'walking_sidewalk',
      wantFood: foodSt ? foodSt.itemKey : 'doner',
      wantFoodQty,
      gotFoodCount: 0,
      wantDrink: drinkSt ? drinkSt.itemKey : null,
      wantDrinkQty,
      gotDrinkCount: 0,
      gotFood: false,
      gotDrink: !drinkSt,
      pickupTimer: 0,
      eatTimer: 0,
      eatDuration: 8.5 + Math.random() * 4.0,
      teaTimer: 0,
      wcTimer: 0,
      table: null,
      seat: null,
      facingAngle: spawnFromLeft ? Math.PI / 2 : -Math.PI / 2,
      walkCycle: Math.random() * 6,
      tray: [],
      teaGlassMesh,
      rig
    });
  }
}

function createVehicle3DMesh(type, colorHex) {
  const carGroup = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.25, metalness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.1, metalness: 0.6 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.45, 6.6), darkMat);
  chassis.position.y = 0.55;
  carGroup.add(chassis);

  const tireGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.45, 14);
  const rimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.48, 10);
  [[-1.75, 0.58, -2.0], [1.75, 0.58, -2.0], [-1.75, 0.58, 2.0], [1.75, 0.58, 2.0]].forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(tireGeo, darkMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(wx, wy, wz);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(wx, wy, wz);
    carGroup.add(tire, rim);
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.15, 6.2), paintMat);
  body.position.set(0, 1.12, 0);
  body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.95, 3.2), paintMat);
  cabin.position.set(0, 2.0, 0.2);
  cabin.castShadow = true;
  const wind = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.78, 3.35), glassMat);
  wind.position.set(0, 2.0, 0.2);
  carGroup.add(body, cabin, wind);

  if (type === 'taxi') {
    const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.45), lightMat);
    taxiSign.position.set(0, 2.65, 0.2);
    carGroup.add(taxiSign);
  }

  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.15), lightMat);
  hlL.position.set(-1.15, 1.15, -3.22);
  const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.15), lightMat);
  hlR.position.set(1.15, 1.15, -3.22);
  const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.15), tailLightMat);
  tlL.position.set(-1.15, 1.15, 3.22);
  const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.15), tailLightMat);
  tlR.position.set(1.15, 1.15, 3.22);
  carGroup.add(hlL, hlR, tlL, tlR);

  return carGroup;
}

function spawnDriveThruCar(forceThiefCar = false) {
  if (!state.driveThruUnlocked) return;
  if (driveThruCars.length >= 3 && !forceThiefCar) return;

  const foodSt = getRandomUnlockedStation('food');
  const drinkSt = Math.random() < 0.75 ? getRandomUnlockedStation('drink') : null;
  const specs = [
    { type: 'taxi', color: 0xfacc15 },
    { type: 'sedan', color: 0xef4444 },
    { type: 'suv', color: 0x0284c7 },
    { type: 'sedan', color: 0x16a34a }
  ];
  const isThiefCar = Boolean(forceThiefCar);
  const spec = isThiefCar ? { type: 'sedan', color: 0x111827 } : specs[Math.floor(Math.random() * specs.length)];
  const carMesh = createVehicle3DMesh(spec.type, spec.color);
  scene.add(carMesh);

  if (isThiefCar) {
    showAlert('🏎️ Drive-Thru Hattına Şüpheli Modifiyeli Araç Girdi!');
    if (window.SFX) window.SFX.playAlarm();
  }

  driveThruCars.push({
    x: 940,
    y: 780,
    targetY: 365 + driveThruCars.length * 155,
    state: 'driving_in',
    isThiefCar,
    fleeTimer: 3.5,
    wantFood: foodSt ? foodSt.itemKey : 'doner',
    wantFoodQty: 1 + Math.floor(Math.random() * 2),
    gotFoodCount: 0,
    wantDrink: drinkSt ? drinkSt.itemKey : null,
    wantDrinkQty: drinkSt ? 1 : 0,
    gotDrinkCount: 0,
    gotFood: false,
    gotDrink: !drinkSt,
    mesh: carMesh
  });
}

function createPoliceCar3DMesh() {
  const carGroup = createVehicle3DMesh('sedan', 0xffffff);

  // Police Blue Side Stripes & Doors
  const blueDoorMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.25, metalness: 0.35 });
  const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(3.46, 0.52, 3.6), blueDoorMat);
  sideStripe.position.set(0, 1.10, 0);
  const hoodStripe = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.4), blueDoorMat);
  hoodStripe.position.set(0, 1.68, -2.1);
  carGroup.add(sideStripe, hoodStripe);

  // Police Roof Lightbar (Flashing Red & Blue Siren Beacons)
  const barBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.14, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
  );
  barBase.position.set(0, 2.54, 0.1);

  const redLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.24, 0.42),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  redLight.position.set(-0.55, 2.66, 0.1);

  const blueLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.24, 0.42),
    new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
  );
  blueLight.position.set(0.55, 2.66, 0.1);

  const policeSign = createSignboard3D('🚓 POLİS 155', 'ASAYİŞ EKİBİ', '#1e3a8a', '#facc15', 2.4, 0.50);
  policeSign.position.set(0, 3.25, 0.1);

  carGroup.add(barBase, redLight, blueLight, policeSign);
  carGroup.userData.redBeacon = redLight;
  carGroup.userData.blueBeacon = blueLight;

  // Rotate +Math.PI / 2 so the Police Car's front headlights face strictly along the -X street direction!
  carGroup.rotation.y = Math.PI / 2;
  return carGroup;
}

function dispatchPoliceCar() {
  if (!policeCar.mesh) {
    policeCar.mesh = createPoliceCar3DMesh();
    policeCar.redBeacon = policeCar.mesh.userData.redBeacon;
    policeCar.blueBeacon = policeCar.mesh.userData.blueBeacon;
    scene.add(policeCar.mesh);
  }
  if (!policeCar.officer1) {
    policeCar.officer1 = {
      x: 472,
      y: 804,
      facingAngle: 0,
      walkCycle: 0,
      tray: [],
      rig: createCharacterRig({
        role: 'guard',
        gender: 'male',
        scale: 0.90,
        topColor: 0x1e3a8a,
        pantsColor: 0x0f172a,
        skinColor: 0xfde68a
      })
    };
    policeCar.officer2 = {
      x: 508,
      y: 804,
      facingAngle: 0,
      walkCycle: 1.5,
      tray: [],
      rig: createCharacterRig({
        role: 'guard',
        gender: 'male',
        scale: 0.90,
        topColor: 0x1e3a8a,
        pantsColor: 0x0f172a,
        skinColor: 0xfde68a
      })
    };
  }
  policeCar.officer1.rig.group.visible = false;
  policeCar.officer2.rig.group.visible = false;

  policeCar.active = true;
  policeCar.mesh.visible = true;
  policeCar.x = 1020;
  policeCar.y = 808;
  policeCar.pickupX = doorWay.x;
  policeCar.state = 'arriving_left';
  policeCar.sirenPhase = 0;
  policeCar.mesh.position.set(to3DX(policeCar.x), 0, to3DZ(policeCar.y));
  if (window.SFX) window.SFX.playPoliceSiren();
}

function spawnSlapBurst3D(x2d, y2d) {
  const group = new THREE.Group();
  group.position.set(to3DX(x2d), 1.65, to3DZ(y2d));

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.25, 0.65, 16),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 1.0 })
  );
  ring.rotation.x = -Math.PI / 3;
  group.add(ring);

  const sparks = [];
  const colors = [0xfacc15, 0xef4444, 0xf97316, 0xffffff];
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const spark = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
    );
    spark.userData = {
      vx: Math.cos(ang) * (3.2 + (i % 3) * 0.8),
      vy: 1.2 + (i % 2) * 1.1,
      vz: Math.sin(ang) * (3.2 + (i % 3) * 0.8)
    };
    group.add(spark);
    sparks.push(spark);
  }

  scene.add(group);
  slapEffects3D.push({ group, ring, sparks, life: 0.55, maxLife: 0.55 });
}

function spawnThief(forceReset = false) {
  if (thiefNPC.active && !forceReset) return;
  if (thiefNPC.rig) scene.remove(thiefNPC.rig.group);

  thiefNPC.rig = createCharacterRig({
    role: 'thief',
    gender: 'male',
    scale: 0.86,
    pantsColor: 0x09090b,
    skinColor: 0xe2e8f0
  });
  const moneyBag = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  moneyBag.position.set(0, 1.25, -0.38);
  thiefNPC.rig.group.add(moneyBag);
  thiefNPC.moneyBagMesh = moneyBag;

  // Spinning 3D Dizzy Stars Halo (shown after Usta or Guard slaps the thief!)
  const dizzyGroup = new THREE.Group();
  dizzyGroup.position.set(0, 0.55, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.10, 0),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfacc15 : 0xef4444 })
    );
    star.position.set(Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36);
    dizzyGroup.add(star);
  }
  dizzyGroup.visible = false;
  thiefNPC.rig.headGroup.add(dizzyGroup);
  thiefNPC.dizzyGroup = dizzyGroup;

  // 3D Silver Handcuffs behind Thief's back (shown when Police Officers handcuff him outside!)
  const handcuffGroup = new THREE.Group();
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
  const cuffL = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 8, 16), chromeMat);
  cuffL.position.set(-0.15, 0, 0);
  const cuffR = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 8, 16), chromeMat);
  cuffR.position.set(0.15, 0, 0);
  const cuffChain = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), chromeMat);
  handcuffGroup.add(cuffL, cuffR, cuffChain);
  handcuffGroup.position.set(0, 0.95, -0.36);
  handcuffGroup.visible = false;
  thiefNPC.rig.group.add(handcuffGroup);
  thiefNPC.handcuffMesh = handcuffGroup;

  thiefNPC.active = true;
  thiefNPC.isCaught = false;
  thiefNPC.x = 490;
  thiefNPC.y = 775;
  thiefNPC.state = 'sneaking_in';
  thiefNPC.stealPauseTimer = 8.5;
  thiefNPC.stunTimer = 0;
  thiefNPC.stolenAmount = 0;

  showAlert('🚨 DİKKAT: Maskeli Hırsız Dükkana Sızdı! Üzerine Yürüyüp Tokatla!');
  if (window.SFX) window.SFX.playAlarm();
}

function spawnMillionaire(forceReset = true) {
  if (millionaire.active && !forceReset) return;
  if (millionaire.rig) scene.remove(millionaire.rig.group);

  const isFemale = Math.random() < 0.5;
  millionaire.rig = createCharacterRig({
    role: 'millionaire',
    gender: isFemale ? 'female' : 'male',
    scale: 0.92,
    topColor: 0x78716c,
    pantsColor: 0x44403c,
    skinColor: 0xfde68a
  });

  // Royal Golden Crown for the Magical Millionaire Transformation (ONLY shown if this beggar is the 30% Secret Millionaire!)
  const crownGroup = new THREE.Group();
  const crownBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.24, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.1, emissive: 0x854d0e })
  );
  crownGroup.add(crownBase);
  for (let p = 0; p < 6; p++) {
    const ang = (p / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.18, 6),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.95, roughness: 0.1, emissive: 0xa16207 })
    );
    spike.position.set(Math.cos(ang) * 0.24, 0.14, Math.sin(ang) * 0.24);
    const ruby = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.045, 0),
      new THREE.MeshBasicMaterial({ color: p % 2 === 0 ? 0xef4444 : 0x38bdf8 })
    );
    ruby.position.set(Math.cos(ang) * 0.26, 0.02, Math.sin(ang) * 0.26);
    crownGroup.add(spike, ruby);
  }
  crownGroup.position.set(0, 0.44, 0);
  crownGroup.visible = false;
  millionaire.rig.headGroup.add(crownGroup);
  millionaire.rig.group.userData.goldCrownGroup = crownGroup;

  const foodSt = getRandomUnlockedStation('food');
  millionaire.wantFood = foodSt ? foodSt.itemKey : 'doner';
  // 30% chance to be a Disguised Millionaire, 70% chance to be a Real Beggar (Conscience Test!)
  millionaire.isSecretMillionaire = Math.random() < 0.30;

  millionaire.active = true;
  millionaire.x = 490;
  millionaire.y = 775;
  millionaire.targetX = 465;
  millionaire.targetY = 325;
  millionaire.state = 'entering_door';
  millionaire.timer = 45.0;
  millionaire.revealTimer = 6.5;
  millionaire.disguised = true;

  showAlert('🥺 Dükkana Bir Dilenci Geldi! İkram Edecek misin? (%30 Gizli Milyoner / %70 Gerçek İhtiyaç Sahibi)');
}

function spawnLineCutter(forceSpawn = false) {
  if (lineCutterNPC.active && !forceSpawn) return;

  const dineInQueue = customers.filter(c => c.mode === 'dineIn' && c.state === 'queuing');
  const lineUpQueue = state.lineUpUnlocked ? customers.filter(c => c.mode === 'lineUp' && c.state === 'queuing') : [];

  const eligibleModes = [];
  if (dineInQueue.length >= 2) eligibleModes.push('dineIn');
  if (state.lineUpUnlocked && lineUpQueue.length >= 2) eligibleModes.push('lineUp');

  if (eligibleModes.length === 0) {
    if (!forceSpawn) return;
    const chosenMode = (state.lineUpUnlocked && Math.random() < 0.5) ? 'lineUp' : 'dineIn';
    spawnCustomerGroup(chosenMode);
    eligibleModes.push(chosenMode);
  }

  const targetMode = eligibleModes[Math.floor(Math.random() * eligibleModes.length)];
  const targetCnt = targetMode === 'lineUp' ? counters.lineUp : counters.dineIn;

  if (lineCutterNPC.rig) scene.remove(lineCutterNPC.rig.group);

  lineCutterNPC.rig = createCharacterRig({
    role: 'customer',
    gender: Math.random() < 0.4 ? 'female' : 'male',
    topColor: 0xf97316,
    pantsColor: 0x1e1b4b,
    skinColor: 0xfde68a,
    hair: 'short'
  });

  lineCutterNPC.active = true;
  lineCutterNPC.mode = targetMode;
  lineCutterNPC.x = 490;
  lineCutterNPC.y = 765;
  lineCutterNPC.targetX = targetCnt.x + 38;
  lineCutterNPC.targetY = targetCnt.y - 24;
  lineCutterNPC.state = 'sneaking_in';
  lineCutterNPC.talkTimer = 0;
  lineCutterNPC.talkDuration = 3.0;
  lineCutterNPC.facingAngle = -Math.PI / 2;

  const queueLabel = targetMode === 'lineUp' ? 'Paket Servis (Line-Up)' : 'Salon Servis';
  showAlert(`💢 SIRA İHLALİ: ${queueLabel} Kuyruğuna Kaynak Yapan Müşteri Var! Yanına Gidip Sıranın En Arkasına Gönder!`);
  if (window.SFX) window.SFX.playAlarm();
}

// ============================================================================
// MAIN UPDATE LOOP: SEQUENTIAL "TIK-TIK-TIK" PICKUP, SMART WAITERS & +X QUEUE
// ============================================================================
let gameTime = 0;
let spawnCustomerTimer = 1.5;
let spawnDriveTimer = 4.0;
let specialEventTimer = 28.0;
let lineCutterTimer = 22.0;

function moveTowards(actor, tx, ty, speed, dt) {
  const finalDx = tx - actor.x;
  const finalDy = ty - actor.y;
  const finalDist = Math.hypot(finalDx, finalDy);
  if (finalDist <= 4.0) {
    actor.x = tx;
    actor.y = ty;
    actor._stuckTime = 0;
    return true;
  }

  // 1) Smart Corridor Waypoint Routing when crossing the service counter line (x ~ 348)
  let effTx = tx;
  let effTy = ty;
  const crossingCounters = (actor.x > 362 && tx < 334) || (actor.x < 334 && tx > 362);
  if (crossingCounters && actor.y < 655) {
    const inDineInBand = (actor.y > 205 && actor.y < 285) || (ty > 205 && ty < 285);
    const inLineUpBand = state.lineUpUnlocked && ((actor.y > 445 && actor.y < 525) || (ty > 445 && ty < 525));
    if (inDineInBand || inLineUpBand) {
      // Route cleanly through the 192-unit central corridor at y = 365 (or top corridor y = 192)
      const passY = (actor.y < 215 && ty < 215) ? 192 : 365;
      if (Math.abs(actor.y - passY) > 16) {
        effTx = actor.x > 348 ? 382 : 312;
        effTy = passY;
      }
    }
  }

  const dx = effTx - actor.x;
  const dy = effTy - actor.y;
  const d = Math.hypot(dx, dy) || 1;
  let dirX = dx / d;
  let dirY = dy / d;

  // 2) Corner-Aware Tangential Obstacle Avoidance
  if (actor.y < 660 && finalDist > 7) {
    const obstacles = getSolidObstacles();
    const avoidMargin = 14;
    for (let i = 0; i < obstacles.length; i++) {
      const ob = obstacles[i];
      const expW = ob.hw + avoidMargin;
      const expH = ob.hh + avoidMargin;

      const lookAhead = Math.min(d, 24);
      const nextX = actor.x + dirX * lookAhead;
      const nextY = actor.y + dirY * lookAhead;

      if (Math.abs(nextX - ob.x) < expW && Math.abs(nextY - ob.y) < expH) {
        const ox = actor.x - ob.x;
        const oy = actor.y - ob.y;
        const od = Math.hypot(ox, oy) || 1;
        const nx = ox / od;
        const ny = oy / od;

        const t1x = -ny, t1y = nx;
        const t2x = ny, t2y = -nx;
        // Break symmetry when directly opposite obstacle center so actor never oscillates!
        const toTargetX = effTx - ob.x;
        const toTargetY = effTy - ob.y;
        const dot1 = t1x * toTargetX + t1y * toTargetY + 0.05;
        const dot2 = t2x * toTargetX + t2y * toTargetY;
        const tangX = dot1 >= dot2 ? t1x : t2x;
        const tangY = dot1 >= dot2 ? t1y : t2y;

        dirX = tangX * 0.88 + nx * 0.42;
        dirY = tangY * 0.88 + ny * 0.42;
        const len = Math.hypot(dirX, dirY) || 1;
        dirX /= len;
        dirY /= len;
      }
    }
  }

  const prevX = actor.x;
  const prevY = actor.y;
  const step = Math.min(finalDist, speed * dt);
  actor.x += dirX * step;
  actor.y += dirY * step;

  // 3) Anti-Stuck Escape: If an obstacle clamp ever slows movement, slide perpendicular around it
  if (actor._lastCheckX !== undefined) {
    const movedDist = Math.hypot(actor.x - actor._lastCheckX, actor.y - actor._lastCheckY);
    if (movedDist < step * 0.30 && finalDist > 8) {
      actor._stuckTime = (actor._stuckTime || 0) + dt;
      if (actor._stuckTime > 0.12) {
        const slideSign = ((actor.id || 0.5) > 0.5) ? 1 : -1;
        actor.x += (-dirY * slideSign) * speed * dt * 1.15;
        actor.y += (dirX * slideSign) * speed * dt * 1.15;
      }
      if (actor._stuckTime > 0.45) {
        // Direct bypass nudge toward clear corridor
        actor.x += (tx - actor.x) * 0.18;
        actor.y += (ty - actor.y) * 0.18;
        actor._stuckTime = 0;
      }
    } else {
      actor._stuckTime = Math.max(0, (actor._stuckTime || 0) - dt * 2);
    }
  }
  actor._lastCheckX = prevX;
  actor._lastCheckY = prevY;

  actor.facingAngle = Math.atan2(dirX, dirY);
  return Math.hypot(tx - actor.x, ty - actor.y) <= 6.0;
}

function update(dt) {
  gameTime += dt;
  updateDayNightCycle(dt);
  if (state.isNightClosed) return;

  if (state.bereketTimer > 0) {
    state.bereketTimer = Math.max(0, state.bereketTimer - dt);
    updateHUD();
  }

  // 1) Player Movement
  let vx = 0, vy = 0;
  if (keys['w'] || keys['arrowup']) vy -= 1;
  if (keys['s'] || keys['arrowdown']) vy += 1;
  if (keys['a'] || keys['arrowleft']) vx -= 1;
  if (keys['d'] || keys['arrowright']) vx += 1;

  if (vx !== 0 && vy !== 0) {
    vx *= 0.7071;
    vy *= 0.7071;
  }
  if (pointerDrag.active) {
    vx = pointerDrag.dx;
    vy = pointerDrag.dy;
  }

  const moving = Math.hypot(vx, vy) > 0.05;
  const uSpeed = getUstaSpeed();
  if (moving) {
    player.x += vx * uSpeed * dt;
    player.y += vy * uSpeed * dt;
    player.facingAngle = Math.atan2(vx, vy);

    resolveObstacleCollision(player, 14, true);
    resolvePlayerCharacterCollision(player);
  }

  // 2) Wooden Entrance Door Swing Animation
  let someoneAtDoor = Math.hypot(player.x - doorWay.x, player.y - doorWay.y) < 58;
  if (!someoneAtDoor) {
    someoneAtDoor = customers.some(c => Math.hypot(c.x - doorWay.x, c.y - doorWay.y) < 58) ||
                    (millionaire.active && Math.hypot(millionaire.x - doorWay.x, millionaire.y - doorWay.y) < 58) ||
                    (thiefNPC.active && Math.hypot(thiefNPC.x - doorWay.x, thiefNPC.y - doorWay.y) < 58) ||
                    (lineCutterNPC.active && Math.hypot(lineCutterNPC.x - doorWay.x, lineCutterNPC.y - doorWay.y) < 58);
  }
  state.doorOpenAmount += ((someoneAtDoor ? 1 : 0) - state.doorOpenAmount) * Math.min(1, dt * 8);
  if (leftDoorPivot && rightDoorPivot) {
    leftDoorPivot.rotation.y = state.doorOpenAmount * 1.25;
    rightDoorPivot.rotation.y = -state.doorOpenAmount * 1.25;
  }

  // 3) Supply Trucks: Both drive ONE-WAY FORWARD from +Y (+95, South) toward -Y (-95, North) in SEPARATE PARALLEL LANES!
  //    - Meat Truck (Lane 1: x = -21.0): Arrives from +Y (+95), docks at z = -8.0, then drives forward to -Y (-95).
  //    - Drink Truck (Lane 2: x = -26.6): Arrives from +Y (+95), docks at z = +1.0, then drives forward to -Y (-95).
  //    Because they use separate lanes (-21.0 vs -26.6) AND one-way +Y -> -Y flow, they NEVER reverse or collide!
  const anyDrinkUnlocked = stations.some(s => s.unlocked && MENU_CONFIG[s.itemKey].type === 'drink');
  const needMeatTruck = state.rawMeat <= 5;
  const needDrinkTruck = anyDrinkUnlocked && state.rawDrink <= 6;

  const meatDockZ = -8.0;
  if (needMeatTruck) {
    if (supplyDock.meatTruckZ < meatDockZ - 1.0) {
      // Already passed the dock going north; wrap back to +95 (+Y) while off-screen
      if (supplyDock.meatTruckZ <= -75.0) supplyDock.meatTruckZ = 95.0;
      else supplyDock.meatTruckZ -= 28.0 * dt;
    } else {
      supplyDock.meatTruckZ = Math.max(meatDockZ, supplyDock.meatTruckZ - 26.0 * dt);
    }
  } else {
    if (supplyDock.meatTruckZ < 90.0 && supplyDock.meatTruckZ > -95.0) {
      supplyDock.meatTruckZ -= 26.0 * dt;
      if (supplyDock.meatTruckZ <= -90.0) supplyDock.meatTruckZ = 95.0;
    } else {
      supplyDock.meatTruckZ = 95.0;
    }
  }
  if (supplyDock.meatTruckGroup) {
    supplyDock.meatTruckGroup.position.set(-21.0, 0, supplyDock.meatTruckZ);
    supplyDock.meatTruckGroup.visible = supplyDock.meatTruckZ > -72.0 && supplyDock.meatTruckZ < 72.0;
  }

  const drinkDockZ = 1.0;
  if (needDrinkTruck) {
    if (supplyDock.drinkTruckZ < drinkDockZ - 1.0) {
      if (supplyDock.drinkTruckZ <= -75.0) supplyDock.drinkTruckZ = 95.0;
      else supplyDock.drinkTruckZ -= 28.0 * dt;
    } else {
      supplyDock.drinkTruckZ = Math.max(drinkDockZ, supplyDock.drinkTruckZ - 26.0 * dt);
    }
  } else {
    if (supplyDock.drinkTruckZ < 90.0 && supplyDock.drinkTruckZ > -95.0) {
      supplyDock.drinkTruckZ -= 26.0 * dt;
      if (supplyDock.drinkTruckZ <= -90.0) supplyDock.drinkTruckZ = 95.0;
    } else {
      supplyDock.drinkTruckZ = 95.0;
    }
  }
  if (supplyDock.drinkTruckGroup) {
    supplyDock.drinkTruckGroup.position.set(-26.6, 0, supplyDock.drinkTruckZ);
    supplyDock.drinkTruckGroup.visible = anyDrinkUnlocked && supplyDock.drinkTruckZ > -72.0 && supplyDock.drinkTruckZ < 72.0;
  }

  supplyDock.meatPad.cooldown = Math.max(0, supplyDock.meatPad.cooldown - dt);
  supplyDock.drinkPad.cooldown = Math.max(0, supplyDock.drinkPad.cooldown - dt);

  // A) Chicken Doner Raw Meat Renewal (3.0s Timed Wait on Pad)
  const onMeatPad = Math.hypot(player.x - supplyDock.meatPad.x, player.y - supplyDock.meatPad.y) < 38;
  const canRefillMeat = state.rawMeat < SUPPLY_CONFIG.meatMaxStock && supplyDock.meatPad.cooldown <= 0 && (state.cash >= SUPPLY_CONFIG.meatCrateCost || state.rawMeat === 0);
  if (onMeatPad && canRefillMeat) {
    player.facingAngle = -Math.PI / 2;
    supplyDock.meatPad.fillTimer += dt;
    supplyDock.meatPad.tickTimer += dt;
    if (supplyDock.meatPad.tickTimer >= 0.38) {
      supplyDock.meatPad.tickTimer = 0;
      if (window.SFX) window.SFX.playPadTick(supplyDock.meatPad.fillTimer / supplyDock.meatPad.fillDuration);
    }
    if (supplyDock.meatPad.fillTimer >= supplyDock.meatPad.fillDuration) {
      if (state.cash >= SUPPLY_CONFIG.meatCrateCost) {
        state.cash -= SUPPLY_CONFIG.meatCrateCost;
        state.dailyStats.supplyCost += SUPPLY_CONFIG.meatCrateCost;
      }
      state.rawMeat = SUPPLY_CONFIG.meatMaxStock;
      supplyDock.meatPad.fillTimer = 0;
      supplyDock.meatPad.cooldown = 1.4;
      syncKitchenRawStorage3D();
      updateHUD();
      spawnFloatingText('🍗✅', player.x, player.y - 30, '#fbbf24');
      if (window.SFX) window.SFX.playTruckCrate();
    }
  } else {
    supplyDock.meatPad.fillTimer = Math.max(0, supplyDock.meatPad.fillTimer - dt * 1.8);
  }
  if (supplyDock.meatProgressMesh) {
    const mProg = supplyDock.meatPad.fillTimer / supplyDock.meatPad.fillDuration;
    supplyDock.meatProgressMesh.visible = mProg > 0.02;
    supplyDock.meatProgressMesh.scale.x = Math.max(0.05, Math.min(1, mProg));
  }

  // B) Beverage Fridge Restocking (2.6s Timed Wait on Pad)
  const onDrinkPad = anyDrinkUnlocked && Math.hypot(player.x - supplyDock.drinkPad.x, player.y - supplyDock.drinkPad.y) < 38;
  const canRefillDrink = state.rawDrink < SUPPLY_CONFIG.drinkMaxStock && supplyDock.drinkPad.cooldown <= 0 && (state.cash >= SUPPLY_CONFIG.drinkCrateCost || state.rawDrink === 0);
  if (onDrinkPad && canRefillDrink) {
    player.facingAngle = -Math.PI / 2;
    supplyDock.drinkPad.fillTimer += dt;
    supplyDock.drinkPad.tickTimer += dt;
    if (supplyDock.drinkPad.tickTimer >= 0.35) {
      supplyDock.drinkPad.tickTimer = 0;
      if (window.SFX) window.SFX.playPadTick(supplyDock.drinkPad.fillTimer / supplyDock.drinkPad.fillDuration);
    }
    if (supplyDock.drinkPad.fillTimer >= supplyDock.drinkPad.fillDuration) {
      if (state.cash >= SUPPLY_CONFIG.drinkCrateCost) {
        state.cash -= SUPPLY_CONFIG.drinkCrateCost;
        state.dailyStats.supplyCost += SUPPLY_CONFIG.drinkCrateCost;
      }
      state.rawDrink = SUPPLY_CONFIG.drinkMaxStock;
      supplyDock.drinkPad.fillTimer = 0;
      supplyDock.drinkPad.cooldown = 1.4;
      syncKitchenRawStorage3D();
      updateHUD();
      spawnFloatingText('❄️✅', player.x, player.y - 30, '#38bdf8');
      if (window.SFX) window.SFX.playTruckCrate();
    }
  } else {
    supplyDock.drinkPad.fillTimer = Math.max(0, supplyDock.drinkPad.fillTimer - dt * 1.8);
  }
  if (supplyDock.drinkProgressMesh) {
    const dProg = supplyDock.drinkPad.fillTimer / supplyDock.drinkPad.fillDuration;
    supplyDock.drinkProgressMesh.visible = dProg > 0.02;
    supplyDock.drinkProgressMesh.scale.x = Math.max(0.05, Math.min(1, dProg));
  }

  // 4) Stations Production + DEDICATED ACTION PAD ("Belirli Noktalardan Kesim ve Toplama")
  let carvingNow = false;
  player.pickupCooldown = Math.max(0, player.pickupCooldown - dt);
  const maxUstaCap = getUstaCapacity();
  const sliceMult = getUstaSliceMult();

  stations.forEach(st => {
    if (!st.unlocked) return;
    const mCfg = MENU_CONFIG[st.itemKey];
    const dist = Math.hypot(player.x - st.padX, player.y - st.padY);
    const playerAtStation = dist <= 25;
    const staffAtStation = staffList.some(w => Math.hypot(w.x - st.padX, w.y - st.padY) <= 25);

    setActionPadHighlight(st.actionPadMesh, playerAtStation || staffAtStation);

    const hasRawStock = mCfg.type === 'food' ? state.rawMeat > 0 : state.rawDrink > 0;
    if (st.coneMesh) {
      st.coneMesh.visible = hasRawStock || st.stock > 0;
      const sRatio = Math.max(0.35, state.rawMeat / SUPPLY_CONFIG.meatMaxStock);
      st.coneMesh.scale.set(sRatio, 1, sRatio);
    }

    if (playerAtStation && mCfg.type === 'food' && hasRawStock) {
      carvingNow = true;
      player.facingAngle = st.carveFacing !== undefined ? st.carveFacing : -Math.PI / 2;
    }

    // Balanced production rate: active carving is responsive, passive auto-prep is steady & unhurried
    const speedBoost = (playerAtStation || staffAtStation) ? sliceMult * 1.25 : sliceMult * 0.42;
    if (st.stock < st.maxStock && hasRawStock) {
      st.timer += (dt / st.baseInterval) * speedBoost;
      if (st.coneMesh) st.coneMesh.rotation.y += dt * (playerAtStation ? 5.0 : 1.5);
      if (st.timer >= 1) {
        st.timer = 0;
        st.stock++;
        if (mCfg.type === 'food') state.rawMeat = Math.max(0, state.rawMeat - 1);
        else state.rawDrink = Math.max(0, state.rawDrink - 1);
        syncKitchenRawStorage3D();
        updateHUD();
      }
    }

    while (st.stockGroup.children.length > st.stock) {
      st.stockGroup.remove(st.stockGroup.children[st.stockGroup.children.length - 1]);
    }
    while (st.stockGroup.children.length < st.stock) {
      const idx = st.stockGroup.children.length;
      const m = createFoodMesh(st.itemKey);
      m.position.set(0, idx * 0.24, 0);
      st.stockGroup.add(m);
    }

    if (playerAtStation && st.stock > 0) {
      player.facingAngle = st.carveFacing !== undefined ? st.carveFacing : -Math.PI / 2;

      if (canActorCarryKey(player, st.itemKey, maxUstaCap) && player.pickupCooldown <= 0) {
        st.stock--;
        const price = mCfg.prices[mCfg.tier - 1];
        player.tray.push({
          key: st.itemKey,
          type: mCfg.type,
          price
        });
        player.pickupCooldown = 0.14;
        const currentCount = player.tray.length;

        if (window.SFX) window.SFX.playPickupTik(currentCount);
        spawnFloatingText(`${currentCount}`, player.x + 12, player.y - 28, '#fde047');
        spawnFlyingItem3D(
          st.itemKey,
          to3DX(st.x + 12),
          1.55 + st.stock * 0.22,
          to3DZ(st.y),
          () => to3DX(player.x),
          () => 1.25 + currentCount * 0.22,
          () => to3DZ(player.y)
        );
        syncTray3D(player);
      }
    }
  });

  player.isCarving = carvingNow;
  if (window.SFX) window.SFX.setSizzleActive(carvingNow);

  // 5) Counters: DEDICATED PER-ITEM SLOTS (Ekmek Döner, Zurna Dürüm, İskender, Ayran, Şalgam each in its own tray!)
  player.dropCooldown = Math.max(0, player.dropCooldown - dt);

  Object.values(counters).forEach(cnt => {
    const isUnlocked = cnt.id === 'dineIn' ||
                       (cnt.id === 'lineUp' && state.lineUpUnlocked) ||
                       (cnt.id === 'driveThru' && state.driveThruUnlocked);
    if (!isUnlocked) return;

    const dropDist = Math.hypot(player.x - cnt.dropPadX, player.y - cnt.dropPadY);
    const staffOnDropPad = staffList.some(w => Math.hypot(w.x - cnt.dropPadX, w.y - cnt.dropPadY) <= 25);
    setActionPadHighlight(cnt.dropPadMesh, dropDist <= 26 || staffOnDropPad);

    if (dropDist <= 26 && player.tray.length > 0 && player.dropCooldown <= 0) {
      player.facingAngle = Math.PI / 2;
      const topItem = player.tray[player.tray.length - 1];
      const slotArr = cnt.stacks[topItem.key];
      if (slotArr && slotArr.length < 18) {
        const it = player.tray.pop();
        slotArr.push(it);
        player.dropCooldown = 0.10;
        if (window.SFX) window.SFX.playDropPop(slotArr.length);
        const slotOff = COUNTER_SLOT_OFFSETS_3D[it.key] || { x: 0, y: 1.54, z: 0 };
        spawnFlyingItem3D(
          it.key,
          to3DX(player.x),
          1.35 + player.tray.length * 0.22,
          to3DZ(player.y),
          () => to3DX(cnt.x) + slotOff.x,
          () => slotOff.y + Math.min(slotArr.length, 8) * 0.20,
          () => to3DZ(cnt.y) + slotOff.z
        );
        syncTray3D(player);
      }
    }

    // Sync each item's dedicated 3D stack on the service counter
    Object.keys(cnt.stacks).forEach(itemKey => {
      const arr = cnt.stacks[itemKey];
      const stGroup = cnt.stackGroups[itemKey];
      if (!stGroup) return;
      const visCount = Math.min(arr.length, 8);
      while (stGroup.children.length > visCount) {
        stGroup.remove(stGroup.children[stGroup.children.length - 1]);
      }
      while (stGroup.children.length < visCount) {
        const idx = stGroup.children.length;
        const m = createFoodMesh(itemKey);
        m.position.set(0, idx * 0.20, 0);
        stGroup.add(m);
      }
    });

    syncCashPile3D(cnt.cashGroup, cnt.cashBills);

    const cashDist = Math.hypot(player.x - cnt.cashX, player.y - cnt.cashY);
    setActionPadHighlight(cnt.cashPadMesh, cashDist <= 26 && cnt.cashBills > 0);
    if (cashDist <= 26 && cnt.cashBills > 0) {
      const amt = cnt.cashBills * BILL_VALUE;
      cnt.cashBills = 0;
      addCash(amt, cnt.cashX, cnt.cashY);
    }
  });

  // 6) Tables: Per-Seat Dirty Plates! Can be cleaned ANYTIME (even while other seats at the table are occupied!),
  //    and new customers can ONLY sit on clean seats (!seat.hasTrash)!
  tables.forEach(tb => {
    if (!tb.unlocked) return;

    syncTableTrashCount(tb);
    if (tb.cleanRing) tb.cleanRing.visible = tb.trashCount > 0;

    // Render dirty plate meshes at the exact seats that have seat.hasTrash === true
    while (tb.trashGroup.children.length > 0) {
      tb.trashGroup.remove(tb.trashGroup.children[0]);
    }
    const seatTrashPositions = [
      [0, -0.58, 0.15],      // N seat (index 0)
      [0, 0.58, Math.PI],    // S seat (index 1)
      [-0.78, 0, Math.PI/2], // W seat (index 2)
      [0.78, 0, -Math.PI/2]  // E seat (index 3)
    ];
    tb.seats.forEach((s, idx) => {
      if (s.hasTrash) {
        const sp = seatTrashPositions[idx];
        const m = createFoodMesh('trash');
        m.position.set(sp[0], 0, sp[1]);
        m.rotation.y = sp[2];
        tb.trashGroup.add(m);
      }
    });

    syncCashPile3D(tb.cashGroup, tb.cashBills);

    const dist = Math.hypot(player.x - tb.padX, player.y - tb.padY);
    const staffOnTablePad = staffList.some(w => Math.hypot(w.x - tb.padX, w.y - tb.padY) <= 26);
    setActionPadHighlight(tb.actionPadMesh, dist <= 32 || staffOnTablePad);

    if (dist <= 32) {
      if (tb.cashBills > 0) {
        const amt = tb.cashBills * BILL_VALUE;
        tb.cashBills = 0;
        addCash(amt, tb.x, tb.y + 20, 'BAHŞİŞ');
      }

      // Collect dirty plates from any dirty seat at this table — even while other seats are occupied!
      const dirtySeat = tb.seats.find(s => s.hasTrash);
      if (dirtySeat && canActorCarryKey(player, 'trash', maxUstaCap) && player.pickupCooldown <= 0) {
        dirtySeat.hasTrash = false;
        syncTableTrashCount(tb);
        player.tray.push({ key: 'trash', type: 'trash' });
        player.pickupCooldown = 0.14;
        if (window.SFX) window.SFX.playTrashPickup();
        spawnFloatingText(`${player.tray.length}`, tb.x, tb.y - 25, '#a3e635');
        syncTray3D(player);
      }
    }
  });

  // 7) Trash Container Dedicated Action Pad (trashBin.padX, trashBin.padY)
  const distToBin = Math.hypot(player.x - trashBin.padX, player.y - trashBin.padY);
  let staffNearBin = staffList.some(w => Math.hypot(w.x - trashBin.padX, w.y - trashBin.padY) <= 28);
  setActionPadHighlight(trashBin.actionPadMesh, distToBin <= 26 || staffNearBin);

  if (distToBin <= 26 && player.tray.length > 0) {
    const heldKey = player.tray[0].key;
    const count = player.tray.length;
    if (heldKey === 'trash' || heldKey === 'wc_trash') {
      player.tray = [];
      syncTray3D(player);
      state.xp += count * 3;
      spawnFloatingText(`♻️ +${count * 3} XP`, trashBin.x, trashBin.y - 25, '#4ade80');
      updateHUD();
    } else {
      autoReturnHeldItemsToSource(player);
      spawnFloatingText('♻️✅', trashBin.x, trashBin.y - 25, '#38bdf8');
    }
    if (window.SFX) window.SFX.playTrashToss();
  }

  const lidTargetRot = (distToBin <= 32 || staffNearBin) ? -1.1 : 0;
  if (trashBin.lidPivot) {
    trashBin.lidPivot.rotation.x += (lidTargetRot - trashBin.lidPivot.rotation.x) * dt * 10;
  }

  // 8) Restroom (WC) Door Swing & Crumpled Napkin ('wc_trash') Cleanup!
  const someoneAtWCDoor = Math.hypot(player.x - restroom.doorX, player.y - restroom.doorY) < 42 ||
    staffList.some(w => Math.hypot(w.x - restroom.doorX, w.y - restroom.doorY) < 42) ||
    customers.some(c => (c.state === 'going_to_wc' || c.state === 'using_wc') && Math.hypot(c.x - restroom.doorX, c.y - restroom.doorY) < 42);
  restroom.doorOpenAmount += ((someoneAtWCDoor ? 1 : 0) - restroom.doorOpenAmount) * Math.min(1, dt * 8);
  if (restroom.doorPivot) {
    restroom.doorPivot.rotation.y = -restroom.doorOpenAmount * 1.35;
  }

  if (restroom.puddleGroup) {
    restroom.puddleGroup.visible = restroom.dirty;
  }
  if (restroom.progressRing) {
    restroom.progressRing.visible = restroom.dirty;
    restroom.progressRing.material.color.setHex(0xef4444);
  }
  if (restroom.wcTrashGroup) {
    const wcSpots = [
      [-1.15, 0.35, 0.2],
      [-0.55, 0.65, -0.8],
      [-0.85, 0.10, 1.1]
    ];
    while (restroom.wcTrashGroup.children.length > restroom.trashCount) {
      restroom.wcTrashGroup.remove(restroom.wcTrashGroup.children[restroom.wcTrashGroup.children.length - 1]);
    }
    while (restroom.wcTrashGroup.children.length < restroom.trashCount) {
      const idx = restroom.wcTrashGroup.children.length;
      const sp = wcSpots[idx % wcSpots.length];
      const m = createWCNapkinClutterMesh();
      m.position.set(sp[0], 0, sp[1]);
      m.rotation.y = sp[2];
      restroom.wcTrashGroup.add(m);
    }
  }
  syncCashPile3D(restroom.cashGroup, restroom.cashBills);

  const wcCleanDist = Math.hypot(player.x - restroom.padX, player.y - restroom.padY);
  setActionPadHighlight(restroom.actionPadMesh, wcCleanDist <= 30 && restroom.trashCount > 0);

  if (wcCleanDist <= 30 && restroom.trashCount > 0) {
    if (canActorCarryKey(player, 'wc_trash', maxUstaCap) && player.pickupCooldown <= 0) {
      restroom.trashCount--;
      // Push 'wc_trash' so Usta carries 3D crumpled tissues/napkins instead of a doner plate!
      player.tray.push({ key: 'wc_trash', type: 'trash' });
      player.pickupCooldown = 0.14;
      if (window.SFX) window.SFX.playTrashPickup();
      spawnFloatingText(`🧻x${player.tray.length}`, restroom.padX, restroom.padY - 25, '#38bdf8');
      syncTray3D(player);

      if (restroom.trashCount <= 0) {
        restroom.trashCount = 0;
        restroom.dirty = false;
        restroom.useCount = 0;
        restroom.cashBills += 2;
        showAlert('✨🚻 Tuvalet Temizlendi! Müşteriler Tekrar Kullanabilir!');
        if (window.SFX) window.SFX.playPop();
      }
    }
  }

  const wcCashDist = Math.hypot(player.x - restroom.cashX, player.y - restroom.cashY);
  setActionPadHighlight(restroom.cashPadMesh, wcCashDist <= 26 && restroom.cashBills > 0);
  if (wcCashDist <= 26 && restroom.cashBills > 0) {
    const amt = restroom.cashBills * BILL_VALUE;
    restroom.cashBills = 0;
    addCash(amt, restroom.cashX, restroom.cashY, 'WC BAHŞİŞ');
  }

  // 9) Dedicated Player-Only HR Room Auto-Modal Trigger (Only active once HR Room is unlocked at Level 3!)
  hrOffice.modalCooldown = Math.max(0, hrOffice.modalCooldown - dt);
  const distToHR = Math.hypot(player.x - hrOffice.padX, player.y - hrOffice.padY);
  if (state.hrUnlocked && distToHR < 34) {
    hrOffice.dwellTimer += dt;
    if (hrOffice.dwellTimer >= 0.45 && hrOffice.modalCooldown <= 0) {
      hrOffice.modalCooldown = 6.0;
      renderHRModal();
      const hrModalEl = document.getElementById('hr-modal');
      if (hrModalEl && hrModalEl.classList.contains('hidden')) {
        hrModalEl.classList.remove('hidden');
      }
    }
  } else {
    hrOffice.dwellTimer = 0;
  }

  // 10) Unlock Pad Continuous Cash Drain
  const nextPad = unlockPads.find(p => !p.unlocked);
  if (nextPad && activeUnlockPadMesh) {
    activeUnlockPadMesh.visible = true;
    activeUnlockPadMesh.position.set(to3DX(nextPad.x), 0, to3DZ(nextPad.y));
    activeUnlockHoloMesh.rotation.y += dt * 2.5;

    const ratio = Math.max(0.02, nextPad.paid / nextPad.cost);
    activeUnlockFillMesh.scale.x = ratio;
    activeUnlockFillMesh.position.x = -1.9 * (1 - ratio);

    const dPad = Math.hypot(player.x - nextPad.x, player.y - nextPad.y);
    if (dPad < 52 && state.cash > 0) {
      // Pizza Ready! smooth 3.5-second cash drain into unlock pad
      const drainRate = Math.max(55, nextPad.cost * 0.30);
      const step = Math.min(state.cash, nextPad.cost - nextPad.paid, Math.max(1, Math.ceil(drainRate * dt)));
      if (step > 0) {
        state.cash -= step;
        nextPad.paid += step;
        updateHUD();
        if (nextPad.paid >= nextPad.cost) {
          nextPad.unlocked = true;
          nextPad.onUnlock();
          checkLevelProgression();
        }
      }
    }
  } else if (activeUnlockPadMesh) {
    activeUnlockPadMesh.visible = false;
  }

  // 11) Update AI, Customers, Drive-Thru, Special NPCs, Flying Items & Exterior Life
  updateStaffAI(dt);
  updateCustomers(dt);
  updateDriveThru(dt);
  updateSpecialNPCs(dt);
  updateFlyingItems3D(dt);
  updateExteriorLife(dt);

  spawnCustomerTimer -= dt;
  if (spawnCustomerTimer <= 0) {
    spawnCustomerGroup('dineIn');
    if (state.lineUpUnlocked && Math.random() < 0.65) spawnCustomerGroup('lineUp');
    spawnCustomerTimer = Math.max(2.0, 3.8 - state.levelIndex * 0.18);
  }

  if (state.driveThruUnlocked) {
    spawnDriveTimer -= dt;
    if (spawnDriveTimer <= 0) {
      spawnDriveThruCar();
      spawnDriveTimer = 6.0;
    }
  }

  // Level-Gated Special Events:
  // - Level 3+ (levelIndex >= 2): Kaynakçı (Line-Cutter)
  // - Level 5+ (levelIndex >= 4): Maskeli Hırsız (Thief)
  // - Level 7+ (levelIndex >= 6): Dilenci / Gizli Milyoner (70% Beggar spawn, 30% Thief)
  const anySpecialActive = lineCutterNPC.active || thiefNPC.active || millionaire.active;
  if (state.levelIndex >= 4) {
    specialEventTimer -= dt;
    if (specialEventTimer <= 0) {
      if (!anySpecialActive) {
        if (state.levelIndex >= 6 && Math.random() < 0.70) {
          spawnMillionaire(false);
        } else {
          spawnThief(false);
        }
        specialEventTimer = 38.0;
      } else {
        specialEventTimer = 8.0;
      }
    }
  }

  if (state.levelIndex >= 2) {
    lineCutterTimer -= dt;
    if (lineCutterTimer <= 0) {
      if (!anySpecialActive) {
        spawnLineCutter();
        lineCutterTimer = 32.0;
      } else {
        lineCutterTimer = 8.0;
      }
    }
  }

  state.floatingPopups2D.forEach(ft => {
    ft.y += ft.vy * dt;
    ft.life -= dt;
    ft.alpha = Math.max(0, ft.life);
  });
  for (let i = state.floatingPopups2D.length - 1; i >= 0; i--) {
    if (state.floatingPopups2D[i].life <= 0) state.floatingPopups2D.splice(i, 1);
  }

  updateCharacterAnimation(player, dt, moving, player.isCarving);
}

// ============================================================================
// SMART, DEMAND-DRIVEN WAITER (GARSON) AI — NEVER STANDS IDLE HOLDING AYRAN!
// ============================================================================
function getActiveCountersList() {
  const list = [counters.dineIn];
  if (state.lineUpUnlocked) list.push(counters.lineUp);
  if (state.driveThruUnlocked) list.push(counters.driveThru);
  return list;
}

function isCounterBlockedByCutter(cntId) {
  return lineCutterNPC.active && lineCutterNPC.state === 'cutting_line' && lineCutterNPC.mode === cntId;
}

// Single-Worker Task Reservation Checks: Usta (player) & Waiters NEVER work on the same station, table, or WC simultaneously!
function isStationClaimedByOther(st, w) {
  if (Math.hypot(player.x - st.padX, player.y - st.padY) < 56) return true;
  return staffList.some(other => other !== w && (other.claimedTarget === 'st_' + st.id || Math.hypot(other.x - st.padX, other.y - st.padY) < 38));
}

function isTableClaimedByOther(tb, w) {
  if (Math.hypot(player.x - tb.padX, player.y - tb.padY) < 58) return true;
  return staffList.some(other => other !== w && (other.claimedTarget === 'tb_' + tb.id || Math.hypot(other.x - tb.padX, other.y - tb.padY) < 38));
}

function isWCClaimedByOther(w) {
  if (Math.hypot(player.x - restroom.padX, player.y - restroom.padY) < 60) return true;
  return staffList.some(other => other !== w && (other.claimedTarget === 'wc' || Math.hypot(other.x - restroom.padX, other.y - restroom.padY) < 42));
}

function getCounterNeedingItemKey(itemKey, preferUnblocked = true) {
  const activeCounters = getActiveCountersList();
  const orderedCounters = preferUnblocked
    ? [...activeCounters.filter(c => !isCounterBlockedByCutter(c.id)), ...activeCounters.filter(c => isCounterBlockedByCutter(c.id))]
    : activeCounters;

  // Priority 1: A counter where a customer/car is waiting for this exact itemKey
  for (const cnt of orderedCounters) {
    if (cnt.stacks[itemKey] && cnt.stacks[itemKey].length === 0) {
      if (cnt.id === 'driveThru') {
        const frontCar = driveThruCars[0];
        if (frontCar && ((!frontCar.gotFood && frontCar.wantFood === itemKey) || (frontCar.wantDrink === itemKey && !frontCar.gotDrink))) {
          return cnt;
        }
      } else if (!isCounterBlockedByCutter(cnt.id)) {
        const hasWaiting = customers.some(c => c.mode === cnt.id && c.state === 'queuing' && ((!c.gotFood && c.wantFood === itemKey) || (c.wantDrink === itemKey && !c.gotDrink)));
        if (hasWaiting) return cnt;
      }
    }
  }

  // Priority 2: Any unblocked counter with stock < 6 (or any counter with stock < 6 so kitchen work continues even during Kaynakçı!)
  let bestCnt = null;
  let minLen = 6;
  for (const cnt of orderedCounters) {
    const len = cnt.stacks[itemKey] ? cnt.stacks[itemKey].length : 0;
    if (len < minLen) {
      minLen = len;
      bestCnt = cnt;
    }
  }
  return bestCnt;
}

function getMostNeededStationForWaiter(itemType, requireStock = true, w = null) {
  const unlockedSts = stations.filter(s =>
    s.unlocked &&
    MENU_CONFIG[s.itemKey].type === itemType &&
    (!requireStock || s.stock > 0) &&
    !isStationClaimedByOther(s, w)
  );
  if (unlockedSts.length === 0) return null;

  // Priority 1: A station whose itemKey is actively requested by an unblocked queuing customer/car and has 0 on that counter!
  for (const st of unlockedSts) {
    const needyCnt = getCounterNeedingItemKey(st.itemKey, true);
    if (needyCnt && needyCnt.stacks[st.itemKey].length === 0) {
      return st;
    }
  }

  // Priority 2: Pick the unclaimed station whose total stock across all active counters is lowest
  const activeCounters = getActiveCountersList();
  let bestSt = null;
  let lowestTotal = Infinity;
  for (const st of unlockedSts) {
    const totalOnCounters = activeCounters.reduce((acc, c) => acc + (c.stacks[st.itemKey] ? c.stacks[st.itemKey].length : 0), 0);
    if (totalOnCounters < activeCounters.length * 5 && totalOnCounters < lowestTotal) {
      lowestTotal = totalOnCounters;
      bestSt = st;
    }
  }
  return bestSt;
}

function updateStaffAI(dt) {
  const sSpeed = getStaffSpeed();
  const sCap = getStaffCapacity();

  staffList.forEach((w, wIdx) => {
    let isMoving = false;
    const heldKey = w.tray.length > 0 ? w.tray[0].key : null;
    const heldType = w.tray.length > 0 ? w.tray[0].type : null;

    // 1) If holding trash ('trash' or 'wc_trash'), collect remaining dirty seat plates on unclaimed tables or take to Trash Bin Pad
    if (heldType === 'trash') {
      const dirtyTb = heldKey === 'trash'
        ? tables.find(t => t.unlocked && t.seats.some(s => s.hasTrash) && !isTableClaimedByOther(t, w))
        : null;
      if (dirtyTb && w.tray.length < sCap) {
        w.claimedTarget = 'tb_' + dirtyTb.id;
        isMoving = !moveTowards(w, dirtyTb.padX, dirtyTb.padY, sSpeed, dt);
        if (!isMoving) {
          for (const s of dirtyTb.seats) {
            if (s.hasTrash && canActorCarryKey(w, 'trash', sCap)) {
              s.hasTrash = false;
              w.tray.push({ key: 'trash', type: 'trash' });
            }
          }
          syncTableTrashCount(dirtyTb);
          syncTray3D(w);
        }
      } else {
        w.claimedTarget = 'trash_bin';
        isMoving = !moveTowards(w, trashBin.padX, trashBin.padY, sSpeed, dt);
        if (!isMoving) {
          const count = w.tray.length;
          w.tray = [];
          syncTray3D(w);
          state.xp += count * 2;
          updateHUD();
        }
      }
      resolveObstacleCollision(w, 11, true);
      updateCharacterAnimation(w, dt, isMoving, false);
      return;
    }

    // 2) If holding Food or Drink, deliver it to an unblocked counter's dedicated slot!
    if (heldType === 'food' || heldType === 'drink') {
      const targetCnt = getCounterNeedingItemKey(heldKey, true) || counters.dineIn;
      w.claimedTarget = 'cnt_' + targetCnt.id;
      isMoving = !moveTowards(w, targetCnt.dropPadX, targetCnt.dropPadY, sSpeed, dt);
      if (!isMoving) {
        w.facingAngle = Math.PI / 2;
        while (w.tray.length > 0) {
          const it = w.tray.pop();
          if (targetCnt.stacks[it.key]) targetCnt.stacks[it.key].push(it);
        }
        syncTray3D(w);
      }
      resolveObstacleCollision(w, 11, true);
      updateCharacterAnimation(w, dt, isMoving, false);
      return;
    }

    // 3) Hands are empty! Priority A: Clean any dirty seat on any UNCLAIMED unlocked table!
    //    (Fixed bug: waiter now walks to dirtyTable.padX, dirtyTable.padY via moveTowards!)
    const dirtyTable = tables.find(t => t.unlocked && t.seats.some(s => s.hasTrash) && !isTableClaimedByOther(t, w));
    if (dirtyTable) {
      w.claimedTarget = 'tb_' + dirtyTable.id;
      isMoving = !moveTowards(w, dirtyTable.padX, dirtyTable.padY, sSpeed, dt);
      if (!isMoving) {
        for (const s of dirtyTable.seats) {
          if (s.hasTrash && canActorCarryKey(w, 'trash', sCap)) {
            s.hasTrash = false;
            w.tray.push({ key: 'trash', type: 'trash' });
          }
        }
        syncTableTrashCount(dirtyTable);
        syncTray3D(w);
      }
      resolveObstacleCollision(w, 11, true);
      updateCharacterAnimation(w, dt, isMoving, false);
      return;
    }

    // 3B) Priority A2: Clean dirty WC if Usta and other waiters are not already cleaning it!
    if (restroom.trashCount > 0 && !isWCClaimedByOther(w)) {
      w.claimedTarget = 'wc';
      isMoving = !moveTowards(w, restroom.padX, restroom.padY, sSpeed, dt);
      if (!isMoving) {
        while (restroom.trashCount > 0 && canActorCarryKey(w, 'wc_trash', sCap)) {
          restroom.trashCount--;
          w.tray.push({ key: 'wc_trash', type: 'trash' });
        }
        if (restroom.trashCount <= 0) {
          restroom.trashCount = 0;
          restroom.dirty = false;
          restroom.useCount = 0;
          restroom.cashBills += 2;
        }
        syncTray3D(w);
      }
      resolveObstacleCollision(w, 11, true);
      updateCharacterAnimation(w, dt, isMoving, false);
      return;
    }

    // 4) Priority B: Fetch needed Food from an UNCLAIMED station!
    const foodStation = getMostNeededStationForWaiter('food', true, w);
    if (foodStation) {
      w.claimedTarget = 'st_' + foodStation.id;
      isMoving = !moveTowards(w, foodStation.padX, foodStation.padY, sSpeed, dt);
      if (!isMoving) {
        w.facingAngle = foodStation.carveFacing || -Math.PI / 2;
        const mCfg = MENU_CONFIG[foodStation.itemKey];
        while (foodStation.stock > 0 && canActorCarryKey(w, foodStation.itemKey, sCap)) {
          foodStation.stock--;
          w.tray.push({
            key: foodStation.itemKey,
            type: 'food',
            price: mCfg.prices[mCfg.tier - 1]
          });
        }
        syncTray3D(w);
      }
      resolveObstacleCollision(w, 11, true);
      updateCharacterAnimation(w, dt, isMoving, false);
      return;
    }

    // 5) Priority C: Fetch needed Drink from an UNCLAIMED station!
    const drinkStation = getMostNeededStationForWaiter('drink', true, w);
    if (drinkStation) {
      w.claimedTarget = 'st_' + drinkStation.id;
      isMoving = !moveTowards(w, drinkStation.padX, drinkStation.padY, sSpeed, dt);
      if (!isMoving) {
        w.facingAngle = drinkStation.carveFacing || -Math.PI / 2;
        const mCfg = MENU_CONFIG[drinkStation.itemKey];
        while (drinkStation.stock > 0 && canActorCarryKey(w, drinkStation.itemKey, sCap)) {
          drinkStation.stock--;
          w.tray.push({
            key: drinkStation.itemKey,
            type: 'drink',
            price: mCfg.prices[mCfg.tier - 1]
          });
        }
        syncTray3D(w);
      }
      resolveObstacleCollision(w, 11, true);
      updateCharacterAnimation(w, dt, isMoving, false);
      return;
    }

    // 6) Priority D: Help prepare/carve at any UNCLAIMED station whose stock is below maxStock!
    //    (Waiters never stand idle even when a queue is blocked by Kaynakçı — they prep other stations!)
    const prepSt = stations.find(s =>
      s.unlocked &&
      s.stock < s.maxStock &&
      ((MENU_CONFIG[s.itemKey].type === 'food' && state.rawMeat > 0) || (MENU_CONFIG[s.itemKey].type === 'drink' && state.rawDrink > 0)) &&
      !isStationClaimedByOther(s, w)
    );
    if (prepSt) {
      w.claimedTarget = 'st_' + prepSt.id;
      isMoving = !moveTowards(w, prepSt.padX, prepSt.padY, sSpeed, dt);
      if (!isMoving) w.facingAngle = prepSt.carveFacing || -Math.PI / 2;
      resolveObstacleCollision(w, 11, true);
      updateCharacterAnimation(w, dt, isMoving, !isMoving && MENU_CONFIG[prepSt.itemKey].type === 'food');
      return;
    }

    w.claimedTarget = null;
    const standbyY = 230 + (wIdx % 4) * 90;
    isMoving = !moveTowards(w, 282, standbyY, sSpeed * 0.75, dt);
    resolveObstacleCollision(w, 11, true);
    updateCharacterAnimation(w, dt, isMoving, false);
  });
}

// ============================================================================
// CUSTOMERS: +X AXIS QUEUE, QUANTITY FULFILLMENT, SEMAVER TEA IN HAND & WC LEMON COLOGNE
// ============================================================================
function updateTablePlaceSettings(tb) {
  if (!tb.placeSettingsGroup) return;
  const g = tb.placeSettingsGroup;
  while (g.children.length > 0) {
    g.remove(g.children[0]);
  }

  let anyEating = false;
  tb.seats.forEach(s => {
    const occ = s.occupant;
    if (occ && !occ.remove && occ.state === 'eating') {
      anyEating = true;
      const px = s.offsetX * 0.025;
      const pz = s.offsetY * 0.025;

      const foodMesh = createFoodMesh(occ.wantFood || 'doner');
      foodMesh.position.set(occ.wantDrink ? (px - 0.16) : px, 0, pz);
      g.add(foodMesh);

      // ONLY place a drink on the table if the customer actually ordered an unlocked drink!
      if (occ.wantDrink) {
        const drinkMesh = createFoodMesh(occ.wantDrink);
        drinkMesh.position.set(px + 0.18, 0, pz);
        g.add(drinkMesh);
      }
    }
  });
  g.visible = anyEating;
}

function updateCustomers(dt) {
  tables.forEach(tb => {
    if (tb.unlocked) updateTablePlaceSettings(tb);
  });

  // Strict FIFO Queue Order: Sort by queueSeq so the newest customer ALWAYS stands at the back with zero gaps!
  const dineInQueue = customers
    .filter(c => c.mode === 'dineIn' && c.state === 'queuing')
    .sort((a, b) => (a.queueSeq || 0) - (b.queueSeq || 0));
  const lineUpQueue = customers
    .filter(c => c.mode === 'lineUp' && c.state === 'queuing')
    .sort((a, b) => (a.queueSeq || 0) - (b.queueSeq || 0));

  const dineInBlockedByCutter = lineCutterNPC.active && lineCutterNPC.state === 'cutting_line' && lineCutterNPC.mode === 'dineIn';
  const lineUpBlockedByCutter = lineCutterNPC.active && lineCutterNPC.state === 'cutting_line' && lineCutterNPC.mode === 'lineUp';

  customers.forEach(c => {
    let isMoving = false;
    const cnt = c.mode === 'dineIn' ? counters.dineIn : counters.lineUp;
    const qList = c.mode === 'dineIn' ? dineInQueue : lineUpQueue;

    // Dedicated right-hand entry lane (x = 498) and left-hand exit lane (x = 482) so doorway NEVER jams at Level 6+!
    const enterDoorX = doorWay.x + 8;
    const exitDoorX = doorWay.x - 8;

    if (c.state === 'walking_sidewalk') {
      isMoving = !moveTowards(c, enterDoorX, doorWay.outsideY, 125, dt);
      if (!isMoving || Math.hypot(c.x - enterDoorX, c.y - doorWay.outsideY) < 16) {
        c.state = 'entering_door';
      }
    } else if (c.state === 'entering_door') {
      // Unobstructed straight entry through the doorway!
      const dy = doorWay.insideY - c.y;
      const dx = enterDoorX - c.x;
      const d = Math.hypot(dx, dy);
      if (d <= 8) {
        c.x = enterDoorX;
        c.y = doorWay.insideY;
        c.queueSeq = ++queueArrivalSeq;
        c.state = 'queuing';
        isMoving = false;
      } else {
        const step = Math.min(d, 130 * dt);
        c.x += (dx / d) * step;
        c.y += (dy / d) * step;
        c.facingAngle = Math.atan2(dx, dy);
        isMoving = true;
      }
    } else if (c.state === 'queuing') {
      const qIndex = Math.max(0, qList.indexOf(c));
      const targetX = cnt.x + 52 + qIndex * 32;
      const targetY = cnt.y;

      if (c.y > targetY + 28 && Math.abs(c.x - targetX) > 18) {
        isMoving = !moveTowards(c, targetX, targetY + 24, 128, dt);
      } else {
        isMoving = !moveTowards(c, targetX, targetY, 128, dt);
      }

      if (!isMoving) {
        c.x = targetX;
        c.y = targetY;
        c.facingAngle = -Math.PI / 2; // Face -X toward the counter!
      }

      const isBlocked = (c.mode === 'dineIn' && dineInBlockedByCutter) ||
                        (c.mode === 'lineUp' && lineUpBlockedByCutter);

      if (qIndex === 0 && !isMoving && !isBlocked) {
        c.pickupTimer = Math.max(0, (c.pickupTimer || 0) - dt);

        // Sequential one-by-one item pickup into c.tray so the customer VISIBLY receives and holds their order!
        if (c.pickupTimer <= 0) {
          const wantedFoodStack = cnt.stacks[c.wantFood];
          const wantedDrinkStack = c.wantDrink ? cnt.stacks[c.wantDrink] : null;

          if (!c.gotFood && wantedFoodStack && wantedFoodStack.length > 0) {
            const item = wantedFoodStack.pop();
            cnt.cashBills += Math.max(1, Math.round(item.price / BILL_VALUE));
            c.gotFoodCount++;
            if (c.gotFoodCount >= c.wantFoodQty) c.gotFood = true;
            c.tray.push({ key: item.key, type: 'food' });
            syncTray3D(c);
            c.pickupTimer = 0.36;
            const slotOff = COUNTER_SLOT_OFFSETS_3D[item.key] || { x: 0, y: 1.54, z: 0 };
            spawnFlyingItem3D(
              item.key,
              to3DX(cnt.x) + slotOff.x,
              slotOff.y + 0.2,
              to3DZ(cnt.y) + slotOff.z,
              () => to3DX(c.x),
              () => 1.25 + c.tray.length * 0.22,
              () => to3DZ(c.y)
            );
            if (window.SFX) window.SFX.playPickupTik(c.tray.length);
          } else if (c.wantDrink && !c.gotDrink && wantedDrinkStack && wantedDrinkStack.length > 0) {
            const item = wantedDrinkStack.pop();
            cnt.cashBills += Math.max(1, Math.round(item.price / BILL_VALUE));
            c.gotDrinkCount++;
            if (c.gotDrinkCount >= c.wantDrinkQty) c.gotDrink = true;
            c.tray.push({ key: item.key, type: 'drink' });
            syncTray3D(c);
            c.pickupTimer = 0.34;
            const slotOff = COUNTER_SLOT_OFFSETS_3D[item.key] || { x: 0, y: 1.54, z: 0 };
            spawnFlyingItem3D(
              item.key,
              to3DX(cnt.x) + slotOff.x,
              slotOff.y + 0.2,
              to3DZ(cnt.y) + slotOff.z,
              () => to3DX(c.x),
              () => 1.25 + c.tray.length * 0.22,
              () => to3DZ(c.y)
            );
            if (window.SFX) window.SFX.playPickupTik(c.tray.length);
          }
        }

        // Customer ONLY leaves the queue after receiving 100% of their requested food & drink AND holding it in their hands!
        if (c.gotFood && c.gotDrink && (c.pickupTimer || 0) <= 0.08) {
          if (c.mode === 'lineUp') {
            state.dailyStats.customersServed++;
            state.dailyStats.itemsSold += c.wantFoodQty + (c.wantDrinkQty || 0);
            if (state.semaverUnlocked && Math.random() < 0.42) {
              c.state = 'going_to_semaver';
            } else {
              c.state = 'leaving_to_door';
            }
          } else {
            // Find any unlocked table that has a clean, unoccupied seat (!s.occupant && !s.hasTrash)!
            let assignedTable = null;
            let assignedSeat = null;
            for (const t of tables) {
              if (t.unlocked) {
                const freeSeat = getFreeTableSeat(t);
                if (freeSeat) {
                  assignedTable = t;
                  assignedSeat = freeSeat;
                  break;
                }
              }
            }
            if (assignedTable && assignedSeat) {
              c.table = assignedTable;
              c.seat = assignedSeat;
              assignedSeat.occupant = c;
              state.dailyStats.customersServed++;
              state.dailyStats.itemsSold += c.wantFoodQty + (c.wantDrinkQty || 0);
              c.state = 'going_to_table';
            }
          }
        }
      }
    } else if (c.state === 'going_to_table') {
      const tx = c.table.x + c.seat.offsetX;
      const ty = c.table.y + c.seat.offsetY;
      isMoving = !moveTowards(c, tx, ty, 120, dt);
      if (!isMoving) {
        c.tray = [];
        syncTray3D(c);
        c.state = 'eating';
        c.facingAngle = c.seat.facing;
      }
    } else if (c.state === 'eating') {
      c.eatTimer += dt;
      c.facingAngle = c.seat.facing;
      if (c.eatTimer >= c.eatDuration) {
        if (c.seat) {
          if (c.seat.occupant === c) c.seat.occupant = null;
          // Mark this exact seat dirty immediately so Usta/Waiter can clean it even while other seats are occupied!
          c.seat.hasTrash = true;
        }
        syncTableTrashCount(c.table);
        c.table.cashBills += c.table.vip ? 2 : 1;

        if (state.semaverUnlocked && Math.random() < 0.50) {
          c.state = 'going_to_semaver';
        } else if (!restroom.dirty && restroom.trashCount === 0 && Math.random() < 0.32) {
          c.state = 'going_to_wc';
        } else {
          c.state = 'leaving_to_door';
        }
      }
    } else if (c.state === 'going_to_semaver') {
      isMoving = !moveTowards(c, semaverStation.drinkX, semaverStation.drinkY, 120, dt);
      if (!isMoving) {
        c.state = 'drinking_tea';
        c.teaTimer = 0;
        c.facingAngle = Math.PI / 2;
        if (c.teaGlassMesh) c.teaGlassMesh.visible = true;
        if (window.SFX) window.SFX.playPop();
      }
    } else if (c.state === 'drinking_tea') {
      c.teaTimer += dt;
      c.facingAngle = Math.PI / 2;
      if (c.teaTimer >= 4.0) {
        if (c.teaGlassMesh) c.teaGlassMesh.visible = false;
        const teaTip = state.semaverUpgraded ? 10 : 5;
        addCash(teaTip, semaverStation.x, semaverStation.y - 20, '🫖 SEMAVER ÇAYI');
        if (!restroom.dirty && restroom.trashCount === 0 && Math.random() < 0.28) {
          c.state = 'going_to_wc';
        } else {
          c.state = 'leaving_to_door';
        }
      }
    } else if (c.state === 'going_to_wc') {
      // Strictly forbid entering a dirty WC! If WC became dirty before customer entered, they turn back!
      if (restroom.dirty || restroom.trashCount > 0) {
        spawnFloatingText('🚻❌', c.x, c.y - 25, '#f87171');
        c.state = 'leaving_to_door';
      } else {
        const waypointX = 795;
        const waypointY = c.y > 215 ? 215 : restroom.y;
        isMoving = !moveTowards(c, waypointX, waypointY, 120, dt);
        if (!isMoving && Math.abs(c.y - restroom.y) < 10) {
          c.state = 'using_wc';
          c.wcTimer = 0;
        }
      }
    } else if (c.state === 'using_wc') {
      c.wcTimer += dt;
      if (c.wcTimer >= 2.2) {
        restroom.useCount = (restroom.useCount || 0) + 1;
        restroom.cashBills += 1;
        if (restroom.useCount >= restroom.maxUsesBeforeDirty) {
          restroom.dirty = true;
          restroom.trashCount = 3;
        }
        c.state = 'using_cologne';
        c.wcTimer = 0;
      }
    } else if (c.state === 'using_cologne') {
      isMoving = !moveTowards(c, restroom.cologneX + 18, restroom.cologneY, 115, dt);
      if (!isMoving) {
        c.wcTimer += dt;
        c.facingAngle = -Math.PI / 2;
        if (restroom.colognePumpHead) {
          restroom.colognePumpHead.position.y = 1.78 - Math.abs(Math.sin(c.wcTimer * 10)) * 0.06;
        }
        if (c.wcTimer >= 1.1) {
          if (restroom.colognePumpHead) restroom.colognePumpHead.position.y = 1.78;
          spawnFloatingText('🍋✨', restroom.cologneX, restroom.cologneY - 25, '#fde047');
          c.state = 'leaving_to_door';
        }
      }
    } else if (c.state === 'leaving_to_door') {
      isMoving = !moveTowards(c, exitDoorX, doorWay.insideY, 130, dt);
      if (!isMoving || Math.hypot(c.x - exitDoorX, c.y - doorWay.insideY) < 14) {
        c.state = 'exiting_door';
      }
    } else if (c.state === 'exiting_door') {
      const dy = (doorWay.outsideY + 20) - c.y;
      const dx = exitDoorX - c.x;
      const d = Math.hypot(dx, dy);
      if (d <= 10) {
        c.exitSideX = Math.random() < 0.5 ? 60 : 920;
        c.state = 'leaving_sidewalk';
        isMoving = false;
      } else {
        const step = Math.min(d, 135 * dt);
        c.x += (dx / d) * step;
        c.y += (dy / d) * step;
        c.facingAngle = Math.atan2(dx, dy);
        isMoving = true;
      }
    } else if (c.state === 'leaving_sidewalk') {
      isMoving = !moveTowards(c, c.exitSideX, 745, 135, dt);
      if (!isMoving) {
        scene.remove(c.rig.group);
        c.remove = true;
      }
    }

    c._isMovingNow = isMoving;
  });

  // Interior Walking Customer Separation (Never push customers transiting the doorway or standing in queue!)
  const interiorWalkers = customers.filter(
    c => !c.remove && c.y < 605 && c.state !== 'eating' && c.state !== 'entering_door' && c.state !== 'leaving_to_door' && c.state !== 'exiting_door' && !(c.state === 'queuing' && !c._isMovingNow)
  );
  for (let i = 0; i < interiorWalkers.length; i++) {
    for (let j = i + 1; j < interiorWalkers.length; j++) {
      const a = interiorWalkers[i];
      const b = interiorWalkers[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.hypot(dx, dy);
      const minDist = 20;
      if (d < minDist && d > 0.0001) {
        const push = (minDist - d) * 0.45;
        const nx = dx / d;
        const ny = dy / d;
        a.x += nx * push;
        a.y += ny * push;
        b.x -= nx * push;
        b.y -= ny * push;
      }
    }
  }

  customers.forEach(c => {
    updateCharacterAnimation(c, dt, c._isMovingNow, false);
  });

  for (let i = customers.length - 1; i >= 0; i--) {
    if (customers[i].remove) customers.splice(i, 1);
  }
}

// ============================================================================
// DRIVE-THRU CARS & SPECIAL NPCS (THIEF & MILLIONAIRE WITH FLOOR SPOTLIGHTS!)
// ============================================================================
function updateDriveThru(dt) {
  const cnt = counters.driveThru;
  let barrierOpen = false;

  driveThruCars.forEach((car, index) => {
    car.targetY = 365 + index * 155;
    if (car.state === 'driving_in') {
      if (car.y > car.targetY) {
        car.y = Math.max(car.targetY, car.y - 230 * dt);
      } else if (index === 0) {
        car.state = 'waiting';
      }
    } else if (car.state === 'waiting') {
      const wantedFoodStack = cnt.stacks[car.wantFood];
      while (!car.gotFood && wantedFoodStack && wantedFoodStack.length > 0) {
        const item = wantedFoodStack.pop();
        cnt.cashBills += Math.max(2, Math.round((item.price * 1.5) / BILL_VALUE));
        car.gotFoodCount++;
        if (car.gotFoodCount >= car.wantFoodQty) car.gotFood = true;
        if (window.SFX) window.SFX.playPop();
      }
      const wantedDrinkStack = car.wantDrink ? cnt.stacks[car.wantDrink] : null;
      while (car.wantDrink && !car.gotDrink && wantedDrinkStack && wantedDrinkStack.length > 0) {
        const item = wantedDrinkStack.pop();
        cnt.cashBills += Math.max(1, Math.round((item.price * 1.5) / BILL_VALUE));
        car.gotDrinkCount++;
        if (car.gotDrinkCount >= car.wantDrinkQty) car.gotDrink = true;
        if (window.SFX) window.SFX.playPop();
      }
      if (car.gotFood && car.gotDrink) {
        state.dailyStats.customersServed++;
        state.dailyStats.itemsSold += car.wantFoodQty + (car.wantDrinkQty || 0);
        if (car.isThiefCar) {
          car.state = 'fleeing_drivethru';
          car.fleeTimer = 3.5;
          const bBtn = document.getElementById('barrier-emergency-btn');
          if (bBtn) bBtn.classList.remove('hidden');
          showAlert('🚨 DRIVE-THRU HIRSIZI ÖDEMEDEN KAÇIYOR! KAPANI İNDİR!');
          if (window.SFX) window.SFX.playAlarm();
        } else {
          car.state = 'driving_out';
        }
      }
    } else if (car.state === 'fleeing_drivethru') {
      car.fleeTimer -= dt;
      const bTimerEl = document.getElementById('barrier-timer');
      if (bTimerEl) bTimerEl.textContent = Math.max(0, car.fleeTimer).toFixed(1);
      if (HR_UPGRADES.autoBarrier.values[HR_UPGRADES.autoBarrier.star]) {
        car.state = 'caught_by_barrier';
        const bBtn = document.getElementById('barrier-emergency-btn');
        if (bBtn) bBtn.classList.add('hidden');
        addCash(90, counters.driveThru.x, counters.driveThru.y, '🚧 OTOMATİK KAPAN!', false);
      } else {
        car.y -= 130 * dt;
        if (car.fleeTimer <= 0 || car.y < 180) {
          const bBtn = document.getElementById('barrier-emergency-btn');
          if (bBtn) bBtn.classList.add('hidden');
          car.state = 'driving_out';
        }
      }
    } else if (car.state === 'caught_by_barrier') {
      barrierOpen = false;
      car.y -= 360 * dt;
      if (car.y < -160) {
        scene.remove(car.mesh);
        car.remove = true;
      }
    } else if (car.state === 'driving_out') {
      barrierOpen = true;
      car.y -= 320 * dt;
      if (car.y < -160) {
        scene.remove(car.mesh);
        car.remove = true;
      }
    }

    car.mesh.position.set(22.0, 0, to3DZ(car.y));
  });

  if (barrierArmMesh && barrierArmMesh.visible) {
    const targetRot = barrierOpen ? Math.PI / 2.2 : 0;
    barrierArmMesh.rotation.z += (targetRot - barrierArmMesh.rotation.z) * dt * 8;
  }

  for (let i = driveThruCars.length - 1; i >= 0; i--) {
    if (driveThruCars[i].remove) driveThruCars.splice(i, 1);
  }
}

function updateSpecialNPCs(dt) {
  // 0) Update 3D Slap Burst Shockwaves & Sparks
  for (let i = slapEffects3D.length - 1; i >= 0; i--) {
    const fx = slapEffects3D[i];
    fx.life -= dt;
    if (fx.life <= 0) {
      scene.remove(fx.group);
      slapEffects3D.splice(i, 1);
      continue;
    }
    const prog = 1.0 - (fx.life / fx.maxLife);
    const rScale = 1.0 + prog * 3.2;
    fx.ring.scale.set(rScale, rScale, 1);
    fx.ring.material.opacity = Math.max(0, 1.0 - prog);
    fx.sparks.forEach(sp => {
      sp.position.x += sp.userData.vx * dt;
      sp.position.y += sp.userData.vy * dt;
      sp.position.z += sp.userData.vz * dt;
      sp.userData.vy -= 6.5 * dt;
      sp.rotation.x += dt * 12;
      sp.rotation.y += dt * 14;
      const s = Math.max(0.1, 1.0 - prog * 0.85);
      sp.scale.set(s, s, s);
    });
  }

  // 1) Guard NPC (Catches Uncaught Thief AND Line-Cutters!)
  if (guardNPC.active && guardNPC.rig) {
    let gMoving = false;
    if (thiefNPC.active && !thiefNPC.isCaught) {
      gMoving = !moveTowards(guardNPC, thiefNPC.x, thiefNPC.y, 145, dt);
    } else if (lineCutterNPC.active && lineCutterNPC.state !== 'scolded_leaving') {
      gMoving = !moveTowards(guardNPC, lineCutterNPC.x, lineCutterNPC.y, 140, dt);
    } else {
      gMoving = !moveTowards(guardNPC, 455, 625, 95, dt);
    }
    updateCharacterAnimation(guardNPC, dt, gMoving, false);
  }

  // 1B) Cheeky Line-Cutter NPC ("Kaynak Yapan Müşteri" in dineIn OR lineUp — When Warned, Goes to the Back of the Queue!)
  if (lineCutterNPC.active && lineCutterNPC.rig) {
    let lcMoving = false;
    if (lineCutterNPC.state === 'sneaking_in') {
      lcMoving = !moveTowards(lineCutterNPC, doorWay.x + 8, doorWay.insideY, 122, dt);
      if (!lcMoving) lineCutterNPC.state = 'rushing_front';
    } else if (lineCutterNPC.state === 'rushing_front') {
      lcMoving = !moveTowards(lineCutterNPC, lineCutterNPC.targetX, lineCutterNPC.targetY, 126, dt);
      if (!lcMoving) {
        lineCutterNPC.state = 'cutting_line';
        lineCutterNPC.facingAngle = -Math.PI / 2;
      }
    } else if (lineCutterNPC.state === 'cutting_line') {
      const nearPlayer = Math.hypot(player.x - lineCutterNPC.x, player.y - lineCutterNPC.y) < 58;
      const nearGuard = guardNPC.active && Math.hypot(guardNPC.x - lineCutterNPC.x, guardNPC.y - lineCutterNPC.y) < 54;
      if (nearPlayer || nearGuard) {
        // Polite 3-second conversation (NO slapping!)
        const speaker = nearPlayer ? player : guardNPC;
        lineCutterNPC.facingAngle = Math.atan2(speaker.x - lineCutterNPC.x, speaker.y - lineCutterNPC.y);
        if (nearPlayer) player.facingAngle = Math.atan2(lineCutterNPC.x - player.x, lineCutterNPC.y - player.y);
        if (nearGuard) guardNPC.facingAngle = Math.atan2(lineCutterNPC.x - guardNPC.x, lineCutterNPC.y - guardNPC.y);

        // Friendly conversational arm gestures
        const talkWave = Math.sin(gameTime * 10) * 0.35;
        lineCutterNPC.rig.rightArmPivot.rotation.x = -0.8 + talkWave;
        speaker.rig.rightArmPivot.rotation.x = -0.9 - talkWave;

        lineCutterNPC.talkTimer = (lineCutterNPC.talkTimer || 0) + dt;
        lineCutterNPC.talkTick = (lineCutterNPC.talkTick || 0) + dt;
        if (lineCutterNPC.talkTick >= 0.65) {
          lineCutterNPC.talkTick = 0;
          if (window.SFX) window.SFX.playPadTick((lineCutterNPC.talkTimer || 0) / (lineCutterNPC.talkDuration || 3.0));
        }

        if (lineCutterNPC.talkTimer >= (lineCutterNPC.talkDuration || 3.0)) {
          if (window.SFX) window.SFX.playResolveXP();
          spawnFloatingText('🤝🚶‍♂️', lineCutterNPC.x, lineCutterNPC.y - 35, '#4ade80');
          showAlert('🤝 Kaynakçı İkna Oldu! Kuyruğun En Arkasına Geçip Sırasını Bekliyor!');

          // Convert the persuaded Line-Cutter directly into a real customer at the VERY BACK of that queue!
        const foodSt = getRandomUnlockedStation('food');
        const drinkSt = Math.random() < 0.65 ? getRandomUnlockedStation('drink') : null;
        const teaGlassMesh = createInceBelliCayMesh(true);
        teaGlassMesh.position.set(0, -0.58, 0.24);
        teaGlassMesh.visible = false;
        lineCutterNPC.rig.rightArmPivot.add(teaGlassMesh);

        customers.push({
          id: Math.random(),
          queueSeq: ++queueArrivalSeq, // Places them strictly at the back of the FIFO queue!
          mode: lineCutterNPC.mode || 'dineIn',
          x: lineCutterNPC.x,
          y: lineCutterNPC.y,
          state: 'queuing',
          wantFood: foodSt ? foodSt.itemKey : 'doner',
          wantFoodQty: 1,
          gotFoodCount: 0,
          wantDrink: drinkSt ? drinkSt.itemKey : null,
          wantDrinkQty: drinkSt ? 1 : 0,
          gotDrinkCount: 0,
          gotFood: false,
          gotDrink: !drinkSt,
          pickupTimer: 0,
          eatTimer: 0,
          eatDuration: 8.5 + Math.random() * 3.5,
          teaTimer: 0,
          wcTimer: 0,
          table: null,
          seat: null,
          facingAngle: lineCutterNPC.facingAngle,
          walkCycle: lineCutterNPC.walkCycle,
          tray: [],
          teaGlassMesh,
          rig: lineCutterNPC.rig
        });

          lineCutterNPC.rig = null;
          lineCutterNPC.active = false;
        }
      } else {
        lineCutterNPC.facingAngle = -Math.PI / 2 + Math.sin(gameTime * 5) * 0.25;
        lineCutterNPC.talkTimer = Math.max(0, (lineCutterNPC.talkTimer || 0) - dt * 0.5);
      }
    }

    if (lineCutterNPC.active) {
      updateCharacterAnimation(lineCutterNPC, dt, lcMoving, false);
    }
  }

  if (lineCutterRingMesh) {
    if (lineCutterNPC.active && lineCutterNPC.state !== 'scolded_leaving') {
      lineCutterRingMesh.visible = true;
      lineCutterRingMesh.position.set(to3DX(lineCutterNPC.x), 0.16, to3DZ(lineCutterNPC.y));
      const pulse = 1.0 + Math.sin(gameTime * 9) * 0.20;
      lineCutterRingMesh.scale.set(pulse, pulse, 1);
    } else {
      lineCutterRingMesh.visible = false;
    }
  }

  // 2) Striped Masked Thief: Slap on Catch -> Run to Door -> Police Car (-X Direction) Picks Him Up!
  if (thiefNPC.active && thiefNPC.rig) {
    let isMoving = false;
    const targetCnt = counters.dineIn;

    if (thiefNPC.dizzyGroup && thiefNPC.dizzyGroup.visible) {
      thiefNPC.dizzyGroup.rotation.y += dt * 10;
    }

    if (!thiefNPC.isCaught) {
      if (thiefNPC.state === 'sneaking_in') {
        isMoving = !moveTowards(thiefNPC, doorWay.x, doorWay.insideY, 68, dt);
        if (!isMoving) thiefNPC.state = 'running_to_cash';
      } else if (thiefNPC.state === 'running_to_cash') {
        isMoving = !moveTowards(thiefNPC, targetCnt.cashX, targetCnt.cashY, 68, dt);
        if (!isMoving) thiefNPC.state = 'stealing_pause';
      } else if (thiefNPC.state === 'stealing_pause') {
        thiefNPC.stealPauseTimer -= dt;
        thiefNPC.facingAngle = Math.sin(gameTime * 8) * 0.6;
        if (thiefNPC.stealPauseTimer <= 0) {
          const stolen = Math.min(state.cash, 120);
          state.cash -= stolen;
          thiefNPC.stolenAmount = stolen;
          updateHUD();
          spawnFloatingText(`💸 -${stolen} ₺`, thiefNPC.x, thiefNPC.y - 25, '#f87171');
          thiefNPC.state = 'fleeing_to_door';
        }
      } else if (thiefNPC.state === 'fleeing_to_door') {
        isMoving = !moveTowards(thiefNPC, doorWay.x, doorWay.outsideY, 64, dt);
        if (!isMoving) thiefNPC.state = 'fleeing_street';
      } else if (thiefNPC.state === 'fleeing_street') {
        isMoving = !moveTowards(thiefNPC, 920, 760, 72, dt);
        if (!isMoving) {
          scene.remove(thiefNPC.rig.group);
          thiefNPC.active = false;
        }
      }

      const caughtByPlayer = Math.hypot(player.x - thiefNPC.x, player.y - thiefNPC.y) < 55;
      const caughtByGuard = guardNPC.active && Math.hypot(guardNPC.x - thiefNPC.x, guardNPC.y - thiefNPC.y) < 50;
      if (caughtByPlayer || caughtByGuard) {
        thiefNPC.isCaught = true;
        thiefNPC.state = 'slapped_recoil';
        thiefNPC.stunTimer = 0.50;

        if (caughtByPlayer) {
          player.slapTimer = 0.45;
          player.facingAngle = Math.atan2(thiefNPC.x - player.x, thiefNPC.y - player.y);
        }
        if (caughtByGuard) {
          guardNPC.slapTimer = 0.45;
          guardNPC.facingAngle = Math.atan2(thiefNPC.x - guardNPC.x, thiefNPC.y - guardNPC.y);
        }

        if (window.SFX) window.SFX.playSlap();
        spawnSlapBurst3D(thiefNPC.x, thiefNPC.y);
        spawnFloatingText('👋💥', thiefNPC.x, thiefNPC.y - 38, '#facc15');

        if (thiefNPC.dizzyGroup) thiefNPC.dizzyGroup.visible = true;
        if (thiefNPC.moneyBagMesh) thiefNPC.moneyBagMesh.visible = false;

        const catchBonus = 40 + state.levelIndex * 20;
        const reward = (thiefNPC.stolenAmount || 0) + catchBonus;
        thiefNPC.stolenAmount = 0;
        addCash(reward, thiefNPC.x, thiefNPC.y - 12, '👋 HIRSIZ TOKADI', false);
        showAlert(`👋💥 Hırsıza Tokat Atıldı! Kapıya Kaçıyor, Polis Geliyor! (+${reward} ₺)`);

        dispatchPoliceCar();
      }
    } else {
      // Thief has been slapped! He recoils, sprints out the door, gets HANDCUFFED by 2 Police Officers, and is SHOVED into the Police Car!
      if (thiefNPC.state === 'slapped_recoil') {
        thiefNPC.stunTimer -= dt;
        thiefNPC.facingAngle += dt * 16;
        thiefNPC.rig.headGroup.rotation.z = Math.sin(gameTime * 35) * 0.35;
        if (thiefNPC.stunTimer <= 0) {
          thiefNPC.rig.headGroup.rotation.z = 0;
          thiefNPC.state = 'running_to_door_inside';
        }
      } else if (thiefNPC.state === 'running_to_door_inside') {
        isMoving = !moveTowards(thiefNPC, doorWay.x, doorWay.insideY, 165, dt);
        if (!isMoving) {
          thiefNPC.state = 'running_out_to_street';
        }
      } else if (thiefNPC.state === 'running_out_to_street') {
        isMoving = !moveTowards(thiefNPC, doorWay.x, 782, 165, dt);
        if (!isMoving) {
          thiefNPC.state = 'waiting_for_police';
        }
      } else if (thiefNPC.state === 'waiting_for_police') {
        thiefNPC.facingAngle = Math.sin(gameTime * 10) * 0.5;
        if (policeCar.active && (policeCar.state === 'waiting_pickup' || Math.abs(policeCar.x - doorWay.x) < 28)) {
          thiefNPC.state = 'being_handcuffed';
          thiefNPC.stunTimer = 2.1;
          if (thiefNPC.handcuffMesh) thiefNPC.handcuffMesh.visible = true;
          if (policeCar.officer1 && policeCar.officer2) {
            policeCar.officer1.rig.group.visible = true;
            policeCar.officer2.rig.group.visible = true;
            policeCar.officer1.x = doorWay.x - 26;
            policeCar.officer1.y = 802;
            policeCar.officer2.x = doorWay.x + 26;
            policeCar.officer2.y = 802;
          }
          spawnFloatingText('🔗👮‍♂️', thiefNPC.x, thiefNPC.y - 36, '#38bdf8');
          if (window.SFX) window.SFX.playTeaClink();
        }
      } else if (thiefNPC.state === 'being_handcuffed') {
        thiefNPC.stunTimer -= dt;
        // Thief faces away (+Z / toward camera) so his handcuffed wrists behind his back are clearly visible!
        thiefNPC.facingAngle = 0;
        if (policeCar.officer1 && policeCar.officer2) {
          const m1 = !moveTowards(policeCar.officer1, thiefNPC.x - 16, thiefNPC.y + 2, 95, dt);
          const m2 = !moveTowards(policeCar.officer2, thiefNPC.x + 16, thiefNPC.y + 2, 95, dt);
          policeCar.officer1.facingAngle = Math.PI / 2;
          policeCar.officer2.facingAngle = -Math.PI / 2;
          updateCharacterAnimation(policeCar.officer1, dt, m1, false);
          updateCharacterAnimation(policeCar.officer2, dt, m2, false);
          // Officers reach forward to cuff and hold the thief's shoulders
          policeCar.officer1.rig.rightArmPivot.rotation.x = -1.25 + Math.sin(gameTime * 14) * 0.25;
          policeCar.officer2.rig.leftArmPivot.rotation.x = -1.25 + Math.cos(gameTime * 14) * 0.25;
        }
        if (thiefNPC.stunTimer <= 0) {
          thiefNPC.state = 'shoving_into_car';
          thiefNPC.stunTimer = 1.35;
          spawnFloatingText('🚓👮‍♂️', thiefNPC.x, thiefNPC.y - 36, '#facc15');
          if (window.SFX) window.SFX.playSlap();
        }
      } else if (thiefNPC.state === 'shoving_into_car') {
        thiefNPC.stunTimer -= dt;
        isMoving = !moveTowards(thiefNPC, policeCar.x, policeCar.y - 4, 42, dt);
        if (policeCar.officer1 && policeCar.officer2) {
          moveTowards(policeCar.officer1, policeCar.x - 15, policeCar.y - 6, 45, dt);
          moveTowards(policeCar.officer2, policeCar.x + 15, policeCar.y - 6, 45, dt);
          updateCharacterAnimation(policeCar.officer1, dt, true, false);
          updateCharacterAnimation(policeCar.officer2, dt, true, false);
          policeCar.officer1.rig.leftArmPivot.rotation.x = -1.4;
          policeCar.officer1.rig.rightArmPivot.rotation.x = -1.4;
          policeCar.officer2.rig.leftArmPivot.rotation.x = -1.4;
          policeCar.officer2.rig.rightArmPivot.rotation.x = -1.4;
        }
        if (thiefNPC.stunTimer <= 0) {
          if (policeCar.officer1 && policeCar.officer2) {
            policeCar.officer1.rig.group.visible = false;
            policeCar.officer2.rig.group.visible = false;
          }
          spawnFloatingText('🚓💨', policeCar.x, policeCar.y - 32, '#38bdf8');
          if (window.SFX) window.SFX.playPoliceSiren();
          scene.remove(thiefNPC.rig.group);
          thiefNPC.active = false;
          policeCar.state = 'driving_away_left';
        }
      }
    }

    if (thiefNPC.active) {
      updateCharacterAnimation(thiefNPC, dt, isMoving, false);
      if (thiefNPC.state === 'being_handcuffed') {
        // Hands pulled behind his back in silver handcuffs!
        thiefNPC.rig.leftArmPivot.rotation.x = 0.78;
        thiefNPC.rig.leftArmPivot.rotation.z = 0.42;
        thiefNPC.rig.rightArmPivot.rotation.x = 0.78;
        thiefNPC.rig.rightArmPivot.rotation.z = -0.42;
        thiefNPC.rig.headGroup.rotation.z = Math.sin(gameTime * 18) * 0.22;
      } else if (thiefNPC.state === 'shoving_into_car') {
        // Comical head-first shove into the back seat of the police car with legs kicking!
        thiefNPC.rig.leftArmPivot.rotation.x = 0.80;
        thiefNPC.rig.leftArmPivot.rotation.z = 0.42;
        thiefNPC.rig.rightArmPivot.rotation.x = 0.80;
        thiefNPC.rig.rightArmPivot.rotation.z = -0.42;
        thiefNPC.rig.group.rotation.x = 0.65;
        thiefNPC.rig.group.position.y = 0.35 + Math.abs(Math.sin(gameTime * 16)) * 0.25;
        thiefNPC.rig.leftHipPivot.rotation.x = Math.sin(gameTime * 25) * 0.85;
        thiefNPC.rig.rightHipPivot.rotation.x = -Math.sin(gameTime * 25) * 0.85;
      } else if (thiefNPC.isCaught && isMoving) {
        // Panicked arms-up running pose while fleeing to the door!
        thiefNPC.rig.leftArmPivot.rotation.x = -2.3 + Math.sin(thiefNPC.walkCycle * 1.6) * 0.55;
        thiefNPC.rig.rightArmPivot.rotation.x = -2.3 - Math.sin(thiefNPC.walkCycle * 1.6) * 0.55;
      }
    }
  }

  // 2B) Police Car Driving Along the Street in the -X Direction!
  if (policeCar.active && policeCar.mesh) {
    policeCar.sirenPhase += dt * 14;
    const redOn = Math.sin(policeCar.sirenPhase) > 0;
    if (policeCar.redBeacon) policeCar.redBeacon.material.color.setHex(redOn ? 0xff2222 : 0x450a0a);
    if (policeCar.blueBeacon) policeCar.blueBeacon.material.color.setHex(!redOn ? 0x38bdf8 : 0x172554);

    if (policeCar.state === 'arriving_left') {
      policeCar.x = Math.max(policeCar.pickupX, policeCar.x - 360 * dt);
      if (policeCar.x <= policeCar.pickupX) {
        policeCar.x = policeCar.pickupX;
        policeCar.state = 'waiting_pickup';
      }
    } else if (policeCar.state === 'waiting_pickup') {
      // If thief was somehow reset, drive away after pickup
      if (!thiefNPC.active) {
        policeCar.state = 'driving_away_left';
      }
    } else if (policeCar.state === 'driving_away_left') {
      policeCar.x -= 370 * dt;
      if (policeCar.x < -180) {
        policeCar.active = false;
        policeCar.mesh.visible = false;
      }
    }
    policeCar.mesh.position.set(to3DX(policeCar.x), 0, to3DZ(policeCar.y));
  }

  // 3) Beggar / Secret Millionaire in Disguise (70% Real Beggar who only thanks you, 30% Disguised Millionaire who gives a reward!)
  if (millionaire.active && millionaire.rig) {
    let isMoving = false;
    if (millionaire.state === 'entering_door') {
      isMoving = !moveTowards(millionaire, doorWay.x, doorWay.insideY, 85, dt);
      if (!isMoving) millionaire.state = 'walking_in';
    } else if (millionaire.state === 'walking_in') {
      isMoving = !moveTowards(millionaire, millionaire.targetX, millionaire.targetY, 85, dt);
      if (!isMoving) {
        millionaire.state = 'waiting_for_food';
        millionaire.facingAngle = 0;
      }
    } else if (millionaire.state === 'waiting_for_food') {
      millionaire.timer -= dt;
      const dPlayer = Math.hypot(player.x - millionaire.x, player.y - millionaire.y);
      const wantKey = millionaire.wantFood || 'doner';
      let foodIdx = player.tray.findIndex(i => i.key === wantKey);
      if (foodIdx === -1) foodIdx = player.tray.findIndex(i => i.type === 'food');
      const counterFoodKey = (counters.dineIn.stacks[wantKey] && counters.dineIn.stacks[wantKey].length > 0)
        ? wantKey
        : ['doner', 'durum', 'iskender'].find(k => counters.dineIn.stacks[k] && counters.dineIn.stacks[k].length > 0);

      if (dPlayer < 65 && (foodIdx !== -1 || counterFoodKey)) {
        let givenKey = wantKey;
        if (foodIdx !== -1) {
          givenKey = player.tray[foodIdx].key;
          player.tray.splice(foodIdx, 1);
          syncTray3D(player);
        } else if (counterFoodKey) {
          givenKey = counterFoodKey;
          counters.dineIn.stacks[counterFoodKey].pop();
        }

        // Give the beggar the food visibly in their hands!
        millionaire.tray = [{ key: givenKey, type: 'food' }];
        syncTray3D(millionaire);

        if (millionaire.isSecretMillionaire) {
          // 30% Outcome: Disguised Millionaire! Magical transformation + Reward!
          millionaire.disguised = false;
          millionaire.rig.topMat.color.setHex(0xfacc15);
          millionaire.rig.pantsMat.color.setHex(0x0f172a);
          if (millionaire.rig.group.userData.goldNecklaceGroup) {
            millionaire.rig.group.userData.goldNecklaceGroup.visible = true;
          }
          if (millionaire.rig.group.userData.goldWatchGroup) {
            millionaire.rig.group.userData.goldWatchGroup.visible = true;
          }
          if (millionaire.rig.group.userData.designerBagGroup) {
            millionaire.rig.group.userData.designerBagGroup.visible = true;
          }
          if (millionaire.rig.group.userData.goldCrownGroup) {
            millionaire.rig.group.userData.goldCrownGroup.visible = true;
          }

          const tipAmt = getMillionaireTipAmount();
          millionaire.lastTipAmount = tipAmt;
          addCash(tipAmt, millionaire.x, millionaire.y - 30, '✨💎 GİZLİ MİLYONER ÖDÜLÜ', false);
          showAlert(`✨💎 SÜRPRİZ! Yardım Ettiğin Dilenci Kılık Değiştirmiş Milyoner Çıktı: +${tipAmt} ₺ Ödül!`);
          if (window.SFX) window.SFX.playFanfare();
          millionaire.revealTimer = 6.5;
          millionaire.state = 'celebrating_reveal';
        } else {
          // 70% Outcome: Real Beggar in Need! Only expresses heartfelt gratitude, zero cash reward!
          spawnFloatingText('🤲❤️', millionaire.x, millionaire.y - 35, '#fef08a');
          showAlert('🤲 Gerçek İhtiyaç Sahibiydi: "Allah razı olsun ustam, çok teşekkür ederim!" (Maddi ödül yok, hayır duası aldın)');
          if (window.SFX) window.SFX.playResolveXP();
          millionaire.revealTimer = 3.2;
          millionaire.state = 'thanking_beggar';
        }
      } else if (millionaire.timer <= 0) {
        millionaire.state = 'leaving';
      }
    } else if (millionaire.state === 'thanking_beggar') {
      millionaire.revealTimer -= dt;
      millionaire.facingAngle = Math.sin(gameTime * 4) * 0.25;
      if (millionaire.revealTimer <= 0) {
        millionaire.state = 'leaving';
      }
    } else if (millionaire.state === 'celebrating_reveal') {
      millionaire.revealTimer -= dt;
      millionaire.facingAngle += dt * 7.5;
      if (millionaire.revealTimer <= 0) {
        millionaire.rig.group.position.y = 0;
        millionaire.state = 'leaving';
      }
    } else if (millionaire.state === 'leaving') {
      millionaire.rig.group.position.y = 0;
      isMoving = !moveTowards(millionaire, doorWay.x, 765, 95, dt);
      if (!isMoving) {
        scene.remove(millionaire.rig.group);
        millionaire.active = false;
      }
    }

    if (millionaire.active) {
      updateCharacterAnimation(millionaire, dt, isMoving, false);
      if (millionaire.state === 'celebrating_reveal') {
        // Magical levitation & celebratory golden arms pose during transformation!
        const revealElapsed = 8.0 - millionaire.revealTimer;
        const levitate = Math.sin(Math.min(1, revealElapsed / 1.5) * Math.PI) * 0.65 + Math.abs(Math.sin(gameTime * 5)) * 0.22;
        millionaire.rig.group.position.y = levitate;
        millionaire.rig.leftArmPivot.rotation.x = -2.4 + Math.sin(gameTime * 10) * 0.25;
        millionaire.rig.rightArmPivot.rotation.x = -2.4 + Math.cos(gameTime * 10) * 0.25;
      }
    }
  }

  // Animate Magical 3D Golden Star/Diamond Vortex & Ascending Light Halos
  if (millionaireMagicGroup) {
    if (millionaire.active && millionaire.state === 'celebrating_reveal') {
      millionaireMagicGroup.visible = true;
      millionaireMagicGroup.position.set(to3DX(millionaire.x), 0, to3DZ(millionaire.y));
      millionaireMagicGroup.rotation.y += dt * 4.5;

      const { stars, haloRing1, haloRing2 } = millionaireMagicGroup.userData;
      if (stars) {
        stars.forEach(st => {
          const a = st.baseAngle + gameTime * st.speed;
          const hProg = ((gameTime * 1.4 + st.yOffset * 0.35) % 1.0);
          const curRadius = st.radius * (1.15 - hProg * 0.45);
          st.mesh.position.set(
            Math.cos(a) * curRadius,
            0.25 + hProg * 3.6,
            Math.sin(a) * curRadius
          );
          st.mesh.rotation.x += dt * 8;
          st.mesh.rotation.y += dt * 10;
          const sc = 0.7 + Math.sin(hProg * Math.PI) * 0.9;
          st.mesh.scale.set(sc, sc, sc);
        });
      }
      if (haloRing1 && haloRing2) {
        haloRing1.position.y = 0.3 + ((gameTime * 2.2) % 2.8);
        const s1 = 1.15 - (haloRing1.position.y / 3.4) * 0.45;
        haloRing1.scale.set(s1, s1, 1);

        haloRing2.position.y = 0.3 + (((gameTime * 2.2) + 1.4) % 2.8);
        const s2 = 1.15 - (haloRing2.position.y / 3.4) * 0.45;
        haloRing2.scale.set(s2, s2, 1);
      }
    } else {
      millionaireMagicGroup.visible = false;
    }
  }

  // Update Pulsing Floor Spotlight Rings
  if (millionaireSpotlightMesh) {
    if (millionaire.active) {
      millionaireSpotlightMesh.visible = true;
      millionaireSpotlightMesh.position.set(to3DX(millionaire.x), 0.16, to3DZ(millionaire.y));
      const pulse = 1.0 + Math.sin(gameTime * 6) * 0.18;
      millionaireSpotlightMesh.scale.set(pulse, pulse, 1);
    } else {
      millionaireSpotlightMesh.visible = false;
    }
  }

  if (thiefDangerRingMesh) {
    if (thiefNPC.active && !thiefNPC.isCaught) {
      thiefDangerRingMesh.visible = true;
      thiefDangerRingMesh.position.set(to3DX(thiefNPC.x), 0.16, to3DZ(thiefNPC.y));
      const pulse = 1.0 + Math.sin(gameTime * 10) * 0.22;
      thiefDangerRingMesh.scale.set(pulse, pulse, 1);
    } else {
      thiefDangerRingMesh.visible = false;
    }
  }
}

// ============================================================================
// PIZZA READY! DIORAMA CAMERA (53° PITCH, 46° FOV, SMOOTH FOLLOW WITH LOWER-SCREEN OFFSET)
// ============================================================================
function updateDynamicCamera(dt) {
  const dist = CAM_BASE_DIST * camZoom;
  const offsetY = Math.sin(CAM_PITCH_RAD) * dist;
  const horizDist = Math.cos(CAM_PITCH_RAD) * dist;
  const offsetX = Math.sin(CAM_YAW_RAD) * horizDist;
  const offsetZ = Math.cos(CAM_YAW_RAD) * horizDist;

  // Smooth Follow: Look slightly ahead (-Z / up-screen) of Usta so Usta stays in the lower-middle of the screen,
  // giving a wide diorama view of the stations, cash counters, and tables above while following Usta outside too!
  let lookX = to3DX(player.x) * 0.52;
  let lookZ = to3DZ(player.y) * 0.52 - 2.8;

  if (camPanTimer > 0 && camPanTarget) {
    camPanTimer -= dt;
    lookX = camPanTarget.x * 0.68;
    lookZ = camPanTarget.z * 0.65 - 1.5;
  }

  const targetCamX = lookX + offsetX;
  const targetCamY = offsetY;
  const targetCamZ = lookZ + offsetZ;

  camera.position.x += (targetCamX - camera.position.x) * Math.min(1, dt * 5.5);
  camera.position.y += (targetCamY - camera.position.y) * Math.min(1, dt * 5.5);
  camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, dt * 5.5);
  camera.lookAt(
    camera.position.x - offsetX,
    1.95,
    camera.position.z - offsetZ
  );
}

const ITEM_ICONS = {
  doner: '🥙',
  durum: '🌯',
  iskender: '🍛',
  ayran: '🥛',
  salgam: '🥤',
  cay: '🫖',
  trash: '🗑️'
};

function drawRoundRect(x, y, w, h, r, fill, stroke, lineWidth = 2) {
  hudCtx.beginPath();
  hudCtx.roundRect(x, y, w, h, r);
  if (fill) {
    hudCtx.fillStyle = fill;
    hudCtx.fill();
  }
  if (stroke) {
    hudCtx.lineWidth = lineWidth;
    hudCtx.strokeStyle = stroke;
    hudCtx.stroke();
  }
}

function drawSymbolicBubble(sx, sy, icons, bg = 'rgba(255,255,255,0.94)', borderColor = '#0f172a') {
  const text = icons.join(' ');
  hudCtx.font = 'bold 13px "Segoe UI", sans-serif';
  const w = Math.max(36, hudCtx.measureText(text).width + 14);
  const h = 25;
  // Offset upward by 14px in screen space so the bubble floats cleanly ABOVE the head/hair without ever covering the face!
  const by = sy - 14;
  drawRoundRect(sx - w / 2, by - h / 2, w, h, 9, bg, borderColor, 2.0);

  hudCtx.beginPath();
  hudCtx.moveTo(sx - 4, by + h / 2);
  hudCtx.lineTo(sx + 4, by + h / 2);
  hudCtx.lineTo(sx, by + h / 2 + 5);
  hudCtx.closePath();
  hudCtx.fillStyle = borderColor;
  hudCtx.fill();

  hudCtx.fillStyle = '#0f172a';
  hudCtx.textAlign = 'center';
  hudCtx.fillText(text, sx, by + 4.5);
}

function drawTeaSaucerBubble2D(sx, sy) {
  const w = 40, h = 36;
  const by = sy - 16;
  drawRoundRect(sx - w / 2, by - h / 2, w, h, 11, 'rgba(254, 243, 199, 0.94)', '#b45309', 2.2);
  if (cayTabagiImageElement && cayTabagiImageElement.complete && cayTabagiImageElement.naturalWidth > 0) {
    hudCtx.drawImage(cayTabagiImageElement, sx - 14, by - 9, 28, 22);
  }
  hudCtx.font = '14px "Segoe UI Emoji", sans-serif';
  hudCtx.textAlign = 'center';
  hudCtx.fillText('🫖', sx, by - 4);
}

function project2D(x2d, y2d, height3D = 2.0) {
  return worldToScreen(to3DX(x2d), height3D, to3DZ(y2d));
}

function drawSymbolicProgressBubble(sx, sy, iconText, progress01, bg = 'rgba(255,255,255,0.95)', borderColor = '#0f172a', barColor = '#22c55e') {
  const w = 68, h = 28;
  const by = sy - 15;
  drawRoundRect(sx - w / 2, by - h / 2, w, h, 9, bg, borderColor, 2.0);
  hudCtx.font = 'bold 13px "Segoe UI Emoji", sans-serif';
  hudCtx.fillStyle = '#0f172a';
  hudCtx.textAlign = 'left';
  hudCtx.fillText(iconText, sx - w / 2 + 6, by + 4.5);

  const bx = sx - w / 2 + 28;
  const bw = 33, bh = 8;
  drawRoundRect(bx, by - bh / 2, bw, bh, 4, '#e2e8f0', null, 0);
  const fillW = Math.max(3, Math.min(bw, bw * Math.max(0, Math.min(1, progress01))));
  drawRoundRect(bx, by - bh / 2, fillW, bh, 4, barColor, null, 0);
}

function renderOverlay2D() {
  hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

  // 1) Next Unlock Pad Cost Badge (Icon + Price Only)
  const nextPad = unlockPads.find(p => !p.unlocked);
  if (nextPad) {
    const pt = project2D(nextPad.x, nextPad.y, 1.85);
    const rem = Math.max(0, nextPad.cost - nextPad.paid);
    drawSymbolicBubble(pt.x, pt.y, [`${nextPad.icon} ${rem}₺`], 'rgba(254, 240, 138, 0.96)', '#ca8a04');
  }

  // 2) Symbolic Supply Depletion & Timed Refill Progress Bars (Zero Text Clutter!)
  if (supplyDock.meatPad.fillTimer > 0.02) {
    const pt = project2D(supplyDock.meatPad.x, supplyDock.meatPad.y, 2.55);
    drawSymbolicProgressBubble(pt.x, pt.y, '🍗', supplyDock.meatPad.fillTimer / supplyDock.meatPad.fillDuration, '#fef9c3', '#d97706', '#f59e0b');
  } else if (state.rawMeat <= 0) {
    const pt = project2D(supplyDock.meatPad.x, supplyDock.meatPad.y, 2.4);
    drawSymbolicBubble(pt.x, pt.y, ['🍗❌'], '#fef2f2', '#ef4444');
  }

  if (supplyDock.drinkPad.fillTimer > 0.02) {
    const pt = project2D(supplyDock.drinkPad.x, supplyDock.drinkPad.y, 2.55);
    drawSymbolicProgressBubble(pt.x, pt.y, '❄️', supplyDock.drinkPad.fillTimer / supplyDock.drinkPad.fillDuration, '#e0f2fe', '#0284c7', '#38bdf8');
  } else if (state.rawDrink <= 0 && stations.some(s => s.unlocked && MENU_CONFIG[s.itemKey].type === 'drink')) {
    const pt = project2D(supplyDock.drinkPad.x, supplyDock.drinkPad.y, 2.4);
    drawSymbolicBubble(pt.x, pt.y, ['🥛❌'], '#f0f9ff', '#0284c7');
  }

  // 2B) Symbolic Dirty WC Badge
  if (restroom.dirty || restroom.trashCount > 0) {
    const pt = project2D(restroom.padX, restroom.padY, 2.85);
    drawSymbolicBubble(pt.x, pt.y, [`🚻🧻x${restroom.trashCount}`], '#fef2f2', '#ef4444');
  }

  // 3) Symbolic Trash Container Indicator
  if (player.tray.length > 0 && (player.tray[0].key === 'trash' || player.tray[0].key === 'wc_trash')) {
    const pt = project2D(trashBin.x, trashBin.y, 2.3);
    drawSymbolicBubble(pt.x, pt.y, ['🗑️⬇️'], '#dcfce7', '#16a34a');
  }

  // 4) Customer Order Bubbles: SHOWN ABOVE EVERY SINGLE QUEUING CUSTOMER (`qIndex >= 0`)!
  const dineInQueue = customers
    .filter(c => c.mode === 'dineIn' && c.state === 'queuing')
    .sort((a, b) => (a.queueSeq || 0) - (b.queueSeq || 0));
  const lineUpQueue = customers
    .filter(c => c.mode === 'lineUp' && c.state === 'queuing')
    .sort((a, b) => (a.queueSeq || 0) - (b.queueSeq || 0));

  customers.forEach(c => {
    if (c.state === 'queuing') {
      const qList = c.mode === 'dineIn' ? dineInQueue : lineUpQueue;
      const qIndex = qList.indexOf(c);
      if (qIndex >= 0) {
        const pt = project2D(c.x, c.y, 3.15);
        const blockedHere = qIndex === 0 && lineCutterNPC.active && lineCutterNPC.state === 'cutting_line' && lineCutterNPC.mode === c.mode;
        const icons = [];
        if (blockedHere) icons.push('😡');
        if (!c.gotFood) {
          const remFood = Math.max(1, c.wantFoodQty - c.gotFoodCount);
          icons.push(`${ITEM_ICONS[c.wantFood] || '🥙'}x${remFood}`);
        }
        if (c.wantDrink && !c.gotDrink) {
          const remDrink = Math.max(1, c.wantDrinkQty - c.gotDrinkCount);
          icons.push(`${ITEM_ICONS[c.wantDrink] || '🥛'}x${remDrink}`);
        }
        if (icons.length > 0) {
          drawSymbolicBubble(pt.x, pt.y, icons, blockedHere ? '#fef2f2' : 'rgba(255,255,255,0.94)', blockedHere ? '#dc2626' : '#0f172a');
        } else if (c.gotFood && c.gotDrink && c.mode === 'dineIn') {
          drawSymbolicBubble(pt.x, pt.y, ['🪑⏳'], '#fef9c3', '#ca8a04');
        }
      }
    } else if (c.state === 'drinking_tea') {
      const pt = project2D(c.x, c.y, 3.15);
      drawTeaSaucerBubble2D(pt.x, pt.y);
    }
  });

  // 5) Drive-Thru Vehicle Order Bubbles
  driveThruCars.forEach(car => {
    if (car.state === 'waiting' || car.state === 'driving_in') {
      const pt = project2D(car.x, car.y, 3.55);
      const icons = ['🚗'];
      if (!car.gotFood) {
        const remFood = Math.max(1, car.wantFoodQty - car.gotFoodCount);
        icons.push(`${ITEM_ICONS[car.wantFood] || '🥙'}x${remFood}`);
      }
      if (car.wantDrink && !car.gotDrink) {
        const remDrink = Math.max(1, car.wantDrinkQty - car.gotDrinkCount);
        icons.push(`${ITEM_ICONS[car.wantDrink] || '🥛'}x${remDrink}`);
      }
      drawSymbolicBubble(pt.x, pt.y, icons, '#ecfeff', '#06b6d4');
    }
  });

  // 6) Symbolic Special NPC Badges (Line-Cutter 3s Talk Bar, Thief & Beggar/Millionaire)
  if (lineCutterNPC.active) {
    const pt = project2D(lineCutterNPC.x, lineCutterNPC.y, 3.25);
    if ((lineCutterNPC.talkTimer || 0) > 0.02) {
      drawSymbolicProgressBubble(pt.x, pt.y, '🗣️', (lineCutterNPC.talkTimer || 0) / (lineCutterNPC.talkDuration || 3.0), '#fff7ed', '#ea580c', '#22c55e');
    } else {
      drawSymbolicBubble(pt.x, pt.y, ['💢🚶‍♂️⬆️'], '#fff7ed', '#ea580c');
    }
  }
  if (thiefNPC.active) {
    const pt = project2D(thiefNPC.x, thiefNPC.y, 3.25);
    if (!thiefNPC.isCaught) {
      drawSymbolicBubble(pt.x, pt.y, ['🦹‍♂️💰👋'], '#fef2f2', '#ef4444');
    } else if (thiefNPC.state === 'slapped_recoil') {
      drawSymbolicBubble(pt.x, pt.y, ['👋💥💫'], '#fef08a', '#dc2626');
    } else if (thiefNPC.state === 'being_handcuffed') {
      drawSymbolicBubble(pt.x, pt.y, ['🔗👮‍♂️'], '#eff6ff', '#1d4ed8');
    } else if (thiefNPC.state === 'shoving_into_car') {
      drawSymbolicBubble(pt.x, pt.y, ['🚓👮‍♂️'], '#fef08a', '#1d4ed8');
    } else {
      drawSymbolicBubble(pt.x, pt.y, ['💫🏃‍♂️'], '#fef9c3', '#ea580c');
    }
  }
  if (policeCar.active) {
    const pt = project2D(policeCar.x, policeCar.y, 3.60);
    drawSymbolicBubble(pt.x, pt.y, [policeCar.state === 'driving_away_left' ? '🚓💨' : '🚓🚨'], '#eff6ff', '#1d4ed8');
  }
  if (millionaire.active) {
    const pt = project2D(millionaire.x, millionaire.y, 3.28);
    if (millionaire.state === 'waiting_for_food') {
      const fIcon = ITEM_ICONS[millionaire.wantFood || 'doner'] || '🥙';
      drawSymbolicBubble(pt.x, pt.y, [`🥺 ${fIcon}x1`], '#fef9c3', '#ca8a04');
    } else if (millionaire.state === 'thanking_beggar') {
      drawSymbolicBubble(pt.x, pt.y, ['🤲❤️'], '#dcfce7', '#16a34a');
    } else if (millionaire.state === 'celebrating_reveal') {
      drawSymbolicBubble(pt.x, pt.y, [`👑💎 +${millionaire.lastTipAmount || 240}₺`], '#fef08a', '#b45309');
    }
  }

  // 9) Symbolic Player Full-Tray Indicator
  const maxUstaCap = getUstaCapacity();
  if (player.tray.length >= maxUstaCap) {
    const pt = project2D(player.x, player.y, 3.30);
    drawSymbolicBubble(pt.x, pt.y, [`✋${player.tray.length}/${maxUstaCap}`], '#fef08a', '#ca8a04');
  }

  // 10) Floating Cash & Sequential Pickup Counter ("1, 2, 3...") Popups
  state.floatingPopups2D.forEach(ft => {
    const pt = project2D(ft.x, ft.y, 1.9);
    hudCtx.save();
    hudCtx.globalAlpha = ft.alpha;
    hudCtx.font = '900 16px "Segoe UI", sans-serif';
    hudCtx.textAlign = 'center';
    hudCtx.strokeStyle = '#000';
    hudCtx.lineWidth = 4;
    hudCtx.strokeText(ft.text, pt.x, pt.y);
    hudCtx.fillStyle = ft.color;
    hudCtx.fillText(ft.text, pt.x, pt.y);
    hudCtx.restore();
  });
}

// ============================================================================
// BOOTSTRAP GAME LOOP
// ============================================================================
buildWorld3D();
setupUIAndAudioEvents();
updateHUD();

let lastTime = performance.now();
function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  updateDynamicCamera(dt);
  renderer.render(scene, camera);
  renderOverlay2D();

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
