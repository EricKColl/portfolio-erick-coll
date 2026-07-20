/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-expressions */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { CSS3DRenderer, CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/* =========================================================
   DOM REFS
========================================================= */
const webglView     = document.getElementById("webgl-view");
const introOverlay  = document.getElementById("intro-overlay");
const enterRoomBtn  = document.getElementById("enter-room-btn");
const crosshair     = document.querySelector(".crosshair");
const panelStage    = document.getElementById("panel-stage");
const loadingScreen = document.getElementById("loading-screen");
const loadingBar    = document.getElementById("loading-bar");
const loadingStatus = document.getElementById("loading-status");
const hudCoords     = document.getElementById("hud-coords");

const panelTitle    = document.getElementById("panel-title");
const panelLogo     = document.getElementById("panel-logo");
const panelBanner   = document.getElementById("panel-banner");
const panelVideo    = document.getElementById("panel-video");
const panelSubscribe= document.getElementById("panel-subscribe");

const logoBody      = document.getElementById("logo-body");
const bannerBody    = document.getElementById("banner-body");
const videoBody     = document.getElementById("video-body");
const subscribeForm = document.getElementById("subscribe-form");
const subscribeInput= document.getElementById("subscribe-input");
const subscribeStatus=document.getElementById("subscribe-status");

const assetModal      = document.getElementById("asset-modal");
const assetModalTitle = document.getElementById("asset-modal-title");
const assetModalContent=document.getElementById("asset-modal-content");
const assetModalClose = document.getElementById("asset-modal-close");

function supportsWebGL(){
  try{
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  }catch{
    return false;
  }
}

function showWebGLFallback(){
  if(!loadingScreen) return;
  loadingScreen.classList.add("is-fallback");
  loadingScreen.innerHTML = `
    <section class="webgl-fallback" aria-labelledby="webgl-fallback-title">
      <div class="webgl-fallback-visual">
        <img src="cover.webp" alt="Vista previa de la sala inmersiva TrendTech">
        <span class="webgl-fallback-scan" aria-hidden="true"></span>
      </div>
      <div class="webgl-fallback-copy">
        <p>RENDERIZADO ALTERNATIVO · WEBGL NO DISPONIBLE</p>
        <h1 id="webgl-fallback-title">TRENDTECH<br><span>IMMERSIVE CORE</span></h1>
        <p>Este navegador no permite activar la aceleración 3D. El proyecto sigue disponible mediante una presentación visual optimizada, sin dejar la experiencia bloqueada.</p>
        <ul>
          <li>Escena tridimensional con Three.js</li>
          <li>Postprocesado, partículas y bloom</li>
          <li>Paneles CSS3D y navegación espacial</li>
          <li>Carrusel multimedia y vídeo integrado</li>
        </ul>
        <div>
          <a href="https://erickcoll.github.io/Trendtech/" target="_blank" rel="noreferrer">Abrir experiencia original ↗</a>
          <a href="https://github.com/ErickColl/Trendtech" target="_blank" rel="noreferrer">Ver código en GitHub ↗</a>
        </div>
      </div>
    </section>
  `;
}

if(!supportsWebGL()){
  showWebGLFallback();
}else{

/* =========================================================
   SCENE SETUP — enhanced
========================================================= */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020610, 0.032);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(-0.42, 1.82, 3.05);
camera.rotation.order = "YXZ";

let renderer;
try{
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    stencil: false
  });
}catch{
  showWebGLFallback();
}

if(renderer){
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.domElement.style.display = "block";

webglView.innerHTML = "";
webglView.appendChild(renderer.domElement);

const cssScene = new THREE.Scene();

const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = "fixed";
cssRenderer.domElement.style.inset = "0";
cssRenderer.domElement.style.zIndex = "15";
cssRenderer.domElement.style.pointerEvents = "none";
cssRenderer.domElement.style.overflow = "hidden";
cssRenderer.domElement.style.background = "transparent";

document.getElementById("app-3d").appendChild(cssRenderer.domElement);

/* =========================================================
   POST-PROCESSING — advanced stack
   Bloom + RGB Shift + Film Grain + Vignette + Scanlines
========================================================= */
const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.78, 0.58, 0.18
);
composer.addPass(bloomPass);

/* Custom combined pass: RGB shift + grain + vignette + scanlines */
const cinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uShiftAmount: { value: 0.0022 },
    uVignetteStrength: { value: 0.88 },
    uGrainAmount: { value: 0.038 },
    uScanlineAmount: { value: 0.016 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uShiftAmount;
    uniform float uVignetteStrength;
    uniform float uGrainAmount;
    uniform float uScanlineAmount;
    varying vec2 vUv;

    float rand(vec2 co){
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main(){
      vec2 uv = vUv;
      float dist = distance(uv, vec2(0.5));

      /* Chromatic aberration — stronger toward edges */
      float caStrength = uShiftAmount * (0.5 + dist * 1.6);
      vec2 caOffset = vec2(caStrength, 0.0);

      vec4 colR = texture2D(tDiffuse, uv + caOffset);
      vec4 colG = texture2D(tDiffuse, uv);
      vec4 colB = texture2D(tDiffuse, uv - caOffset);

      vec3 color = vec3(colR.r, colG.g, colB.b);

      /* Vignette — smooth, cinematic */
      float vig = smoothstep(0.88, 0.25, dist);
      color *= mix(1.0, vig, uVignetteStrength * 0.85);

      /* Scanlines — very subtle */
      float scan = sin(uv.y * 900.0 + uTime * 0.8) * uScanlineAmount;
      color *= (1.0 - abs(scan));

      /* Film grain — animated */
      float grain = rand(uv + fract(uTime * 0.53)) - 0.5;
      color += grain * uGrainAmount;

      /* Light edge lift — makes scene pop */
      color = mix(color, color * 1.04, smoothstep(0.45, 0.05, dist));

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

const cinematicPass = new ShaderPass(cinematicShader);
composer.addPass(cinematicPass);

/* =========================================================
   WORLD GROUP & CLOCK
========================================================= */
const world = new THREE.Group();
scene.add(world);
const clock = new THREE.Clock();

const room = { halfWidth: 5.6, minZ: -18.5, maxZ: 4.0, floorY: 0, ceilingY: 5.4 };

/* =========================================================
   STATE
========================================================= */
const moveState = { forward: false, backward: false, left: false, right: false, sprint: false };
const state = {
  mode: "menu",
  yaw: 0,
  pitch: -0.02,
  dragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  walkBob: 0,
  bobOffset: 0,
  strafeTilt: 0,
  forwardTilt: 0,
  focusedPanel: null,
  modalOpen: false
};
const velocity = new THREE.Vector3();
const moveTarget = new THREE.Vector3();
const moveForward = new THREE.Vector3();
const moveRight = new THREE.Vector3();
const cinematic = {
  active: false,
  start: 0,
  duration: 2.1,
  fromPos: new THREE.Vector3(),
  toPos: new THREE.Vector3(0.12, 1.82, 0.92),
  fromLook: new THREE.Vector3(),
  toLook: new THREE.Vector3(0, 1.82, -7.8)
};

function easeInOutCubic(t){
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function getYawPitchFromLook(fromPos, toLook){
  const dir = toLook.clone().sub(fromPos).normalize();
  const yaw = Math.atan2(-dir.x, -dir.z);
  const pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
  return { yaw, pitch };
}
function getPanelAnchorWorld(id){
  const item = panelAnchors.find(p => p.id === id);
  if(!item){
    return new THREE.Vector3(0, 3.2, -4.6);
  }
  const pos = new THREE.Vector3();
  item.anchor.getWorldPosition(pos);
  return pos;
}

/* =========================================================
   COLLECTION ARRAYS
========================================================= */
const animatedMeshes  = [];
const panelAccentLights = [];
const volumetricVeils = [];
const wallEnergySheets = [];
const floorSweepBands = [];
const ambientHaloOrbs = [];
const pulsingLights   = [];
const serverBars      = [];
const floatingPanels  = [];
const lightBands      = [];
const floorCoreSpinners = [];
const tesseractOrbiters = [];
const dnaHelices      = [];
const neuralData      = [];
const energyBeams     = [];
const holoItems       = [];
const dataRiverParticles = [];
const lightCurrents   = [];
const reflectionFlashes = [];
const shaderUniforms  = [];
const godRaysList     = [];
const panelSupports   = [];
const tesseractParts = [];
const miniTesseractParts = [];
const miniTesseractOrbiters = [];
const miniTesseractHubs = [];

let portalGroup, centralHub, ambientParticles, foregroundDust;
let sparkSystem, ceilingDrip;
let floorShaderMesh;
let orbSpriteTexture, streakSpriteTexture;

/* =========================================================
   PANEL DATA
========================================================= */
const logoVariants = [
  { badge:"TT", title:"TrendTech Core Identity", desc:"Módulo principal de identidad visual, preparado para integrar el logotipo definitivo.", chips:["Neon Core","Brand System","Ready"] },
  { badge:"NX", title:"Future Signal Variant", desc:"Vista alternativa con enfoque tecnológico y lectura rápida para interfaces promocionales.", chips:["HUD","Promo","Variant"] },
  { badge:"01", title:"Launch Mark Preview", desc:"Simulación de firma visual para el lanzamiento digital y piezas de campaña.", chips:["Launch","Signature","TrendTech"] }
];
const leftPanelSlides = [
  {
    title: "Inteligencia Artificial",
    image: "assets/img/foto1.webp"
  },
  {
    title: "Ciberseguridad",
    image: "assets/img/foto2.webp"
  },
  {
    title: "Realidad Virtual",
    image: "assets/img/foto3.webp"
  },
  {
    title: "Computación Cuántica",
    image: "assets/img/foto4.webp"
  }
];
const bannerSlides = [
  { klass:"", kicker:"PROMO FRAME", title:"TrendTech Launch", text:"Composición principal del lanzamiento con estética premium, tecnológica y visualmente impactante." },
  { klass:"variant-2", kicker:"CAMPAIGN VIEW", title:"Neon Conversion", text:"Variante promocional centrada en captación, llamada a la acción y ritmo visual cyber." },
  { klass:"variant-3", kicker:"FUTURE SCENE", title:"Immersive Signal", text:"Versión para presentaciones y soporte audiovisual dentro del ecosistema TrendTech." }
];
let leftPanelIndex = 0, bannerIndex = 0;

/* =========================================================
   PANEL ANCHORS — SYMMETRIC LAYOUT
   Distribución perfectamente geométrica y simétrica
========================================================= */
const panelAnchors = [
  {
    id:"title",
    element:panelTitle,
    anchor:new THREE.Object3D(),
    baseScale:1.0,
    extraRotateY:0,
    facing:new THREE.Vector3(0,0,1),
    size:{w:8.8,h:3.95,d:0.32},
    color:0x27e7ff,
    accent:0xff38c8,
    pixelWidth:1680,
    cssScale:0.00565
  },
  {
    id:"logo",
    element:panelLogo,
    anchor:new THREE.Object3D(),
    baseScale:1.0,
    extraRotateY:0,
    facing:new THREE.Vector3(1,0,0),
    size:{w:5.10,h:3.00,d:0.24},
    color:0x27e7ff,
    accent:0x4d7cff,
    pixelWidth:820,
    cssScale:0.00645
  },
  {
    id:"banner",
    element:panelBanner,
    anchor:new THREE.Object3D(),
    baseScale:1.0,
    extraRotateY:0,
    facing:new THREE.Vector3(-1,0,0),
    size:{w:5.10,h:3.00,d:0.24},
    color:0xff38c8,
    accent:0x8cf7ff,
    pixelWidth:820,
    cssScale:0.00645
  },
  {
    id:"video",
    element:panelVideo,
    anchor:new THREE.Object3D(),
    baseScale:1.0,
    extraRotateY:0,
    facing:new THREE.Vector3(0,0,1),
    size:{w:6.20,h:3.28,d:0.26},
    color:0x8cf7ff,
    accent:0x27e7ff,
    pixelWidth:980,
    cssScale:0.00620
  },
  {
    id:"subscribe",
    element:panelSubscribe,
    anchor:new THREE.Object3D(),
    baseScale:1.0,
    extraRotateY:0,
    facing:new THREE.Vector3(0,0,1),
    size:{w:4.85,h:1.95,d:0.22},
    color:0x27e7ff,
    accent:0xff72df,
    pixelWidth:760,
    cssScale:0.00605
  }
];

/* SYMMETRIC POSITIONING — perfect geometric alignment */
/* Central vertical axis: Title (top) → Subscribe (bottom), both at X=0 */
panelAnchors[0].anchor.position.set(0, 3.28, -4.90);      /* title - front top */
panelAnchors[4].anchor.position.set(0, 0.12, -6.70);      /* subscribe - front bottom */

/* Video panel at the back wall */
panelAnchors[3].anchor.position.set(0, 2.38, -15.40);     /* video - back */

/* Side panels perfectly symmetric at the midpoint */
const sideZ = -10.15;
panelAnchors[1].anchor.position.set(-5.38, 2.68, sideZ);  /* logo - left */
panelAnchors[2].anchor.position.set( 5.38, 2.68, sideZ);  /* banner - right */

panelAnchors.forEach(i => world.add(i.anchor));

/* =========================================================
   UTILITIES
========================================================= */
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function rnd(a, b){ return Math.random() * (b - a) + a; }
function stopMovement(){ Object.assign(moveState,{forward:false,backward:false,left:false,right:false,sprint:false}); velocity.set(0,0,0); }
function blurActive(){ document.activeElement?.blur?.(); }
function isTyping(el){ if(!el) return false; const t = el.tagName; return t==="INPUT"||t==="TEXTAREA"||t==="BUTTON"||t==="VIDEO"||t==="IFRAME"||el.isContentEditable; }
function hitsUI(e){ const p = typeof e.composedPath==="function" ? e.composedPath() : []; return p.some(n => n instanceof Element && n.closest(".panel-window,.intro-panel,.asset-modal,input,textarea,button,select,label,a,video,iframe")); }

function glowMat(color, opacity = 0.22){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, depthWrite:false, blending:THREE.AdditiveBlending });
}
function glassMat(color = 0x081225, opacity = 0.5){
  return new THREE.MeshPhysicalMaterial({ color, metalness:0.22, roughness:0.14, clearcoat:1, clearcoatRoughness:0.10, transparent:true, opacity });
}
function metalMat(color, emissive, emissiveI = 0.08){
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness:0.74,
    roughness:0.13,
    clearcoat:1,
    clearcoatRoughness:0.08,
    emissive:emissive || 0x000000,
    emissiveIntensity:emissiveI,
    transparent:true,
    opacity:0.96
  });
}

function makeGradientSpriteTexture(kind="orb"){
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const cx = 64, cy = 64;

  if(kind === "streak"){
    const grad = ctx.createLinearGradient(18, 64, 110, 64);
    grad.addColorStop(0.00, "rgba(255,255,255,0)");
    grad.addColorStop(0.20, "rgba(255,255,255,0.20)");
    grad.addColorStop(0.50, "rgba(255,255,255,1)");
    grad.addColorStop(0.80, "rgba(255,255,255,0.20)");
    grad.addColorStop(1.00, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 44, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 54);
    glow.addColorStop(0.00, "rgba(255,255,255,0.72)");
    glow.addColorStop(0.42, "rgba(255,255,255,0.24)");
    glow.addColorStop(1.00, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill();
  }else{
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    grad.addColorStop(0.00, "rgba(255,255,255,1)");
    grad.addColorStop(0.18, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.48, "rgba(255,255,255,0.28)");
    grad.addColorStop(1.00, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createPanelTexture({ accent="#27e7ff", accent2="#ff38c8", label="TRENDTECH", back=false } = {}){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, back ? "#07101c" : "#0a1424");
  bg.addColorStop(0.5, back ? "#08101a" : "#09101d");
  bg.addColorStop(1, back ? "#04070d" : "#050a12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const diag = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  diag.addColorStop(0, back ? `${accent}22` : `${accent}14`);
  diag.addColorStop(0.5, "transparent");
  diag.addColorStop(1, back ? `${accent2}22` : `${accent2}14`);
  ctx.fillStyle = diag;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = back ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  for(let x=48; x<canvas.width; x+=88){
    ctx.beginPath();
    ctx.moveTo(x, 48);
    ctx.lineTo(x + (back ? 18 : 36), canvas.height - 48);
    ctx.stroke();
  }

  ctx.strokeStyle = accent;
  ctx.lineWidth = back ? 2.2 : 3;
  for(let i=0; i<6; i++){
    const y = 70 + i * 72;
    ctx.beginPath();
    ctx.moveTo(74, y);
    ctx.lineTo(300 + i * 38, y);
    ctx.lineTo(366 + i * 38, y + 24);
    ctx.lineTo(canvas.width - 90, y + 24);
    ctx.stroke();
  }

  ctx.strokeStyle = accent2;
  ctx.lineWidth = back ? 1.8 : 2.2;
  for(let i=0; i<4; i++){
    const y = 120 + i * 88;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 310 - i * 18, y);
    ctx.lineTo(canvas.width - 160, y);
    ctx.lineTo(canvas.width - 118, y + 18);
    ctx.stroke();
  }

  if(back){
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    ctx.strokeRect(90, 92, canvas.width - 180, canvas.height - 184);
    ctx.strokeRect(128, 126, canvas.width - 256, canvas.height - 252);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(144, 150);
    ctx.lineTo(320, 150);
    ctx.lineTo(364, 188);
    ctx.lineTo(520, 188);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(872, 150);
    ctx.lineTo(706, 150);
    ctx.lineTo(662, 188);
    ctx.lineTo(514, 188);
    ctx.stroke();

    ctx.strokeStyle = accent2;
    ctx.beginPath();
    ctx.moveTo(220, 330);
    ctx.lineTo(390, 330);
    ctx.lineTo(432, 292);
    ctx.lineTo(592, 292);
    ctx.lineTo(634, 330);
    ctx.lineTo(804, 330);
    ctx.stroke();

    [190, 834].forEach(x => {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x - 18, 110, 36, 36);
      ctx.fillStyle = accent;
      ctx.fillRect(x - 10, 118, 20, 20);
    });

    const rearGlow = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.47, 8, canvas.width * 0.5, canvas.height * 0.47, 220);
    rearGlow.addColorStop(0, "rgba(255,255,255,0.08)");
    rearGlow.addColorStop(0.22, `${accent}2c`);
    rearGlow.addColorStop(0.52, `${accent2}18`);
    rearGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rearGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }else{
    const glow = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 10, canvas.width * 0.5, canvas.height * 0.5, 300);
    glow.addColorStop(0, "rgba(39,231,255,0.22)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.strokeStyle = back ? "rgba(255,255,255,0.12)" : "rgba(140,247,255,0.30)";
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);
  ctx.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);

  ctx.fillStyle = back ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.30)";
  ctx.font = `700 ${back ? 34 : 44}px Orbitron, Arial`;
  ctx.textAlign = "left";
  ctx.fillText(back ? `${label} // REAR PANEL` : label, 78, back ? 448 : 434);

  if(back){
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.font = "500 18px Orbitron, Arial";
    ctx.fillText("STRUCTURAL BACKPLATE • LIGHT CHANNELS • SERVICE CORE", 78, 476);
  }else{
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = "500 20px Orbitron, Arial";
    ctx.fillText("IMMERSIVE DISPLAY SURFACE • OPTIC CORE • LIVE PANEL CHASSIS", 78, 470);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/* =========================================================
   PANEL EDGE LIGHTS — enhanced neon rim
========================================================= */
function addPanelEdgeLights(group, width, height, depth, color, accent){
  /* Top light strip */
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.92, 0.032, 0.024),
    glowMat(color, 0.22)
  );
  top.position.set(0, height * 0.46, depth * 0.50);
  group.add(top);
  pulsingLights.push(top);

  /* Bottom strip */
  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.48, 0.024, 0.018),
    glowMat(color, 0.14)
  );
  bottom.position.set(0, -height * 0.46, depth * 0.50);
  group.add(bottom);
  lightBands.push(bottom);

  /* Side strips */
  [-1, 1].forEach(side => {
    const sideStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, height * 0.76, 0.020),
      glowMat(side > 0 ? accent : color, 0.14)
    );
    sideStrip.position.set(side * width * 0.46, 0, depth * 0.50);
    group.add(sideStrip);
    lightBands.push(sideStrip);
  });

  /* Corner accent lights — futuristic touch */
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sy]) => {
    const cornerLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 8, 8),
      glowMat(accent, 0.95)
    );
    cornerLed.position.set(sx * width * 0.44, sy * height * 0.44, depth * 0.52);
    group.add(cornerLed);
    pulsingLights.push(cornerLed);
  });
}

/* =========================================================
   PANEL STRUCTURES — enhanced with holographic frame
========================================================= */
function createPanelStructures(){
  panelAnchors.forEach((item, idx) => {
    const panelGroup = new THREE.Group();
    const { w, h, d } = item.size;
    const depth = d || 0.18;

    panelGroup.position.copy(item.anchor.position);
    panelGroup.quaternion.setFromUnitVectors(
      new THREE.Vector3(0,0,1),
      item.facing.clone().normalize()
    );
    world.add(panelGroup);

    /* OUTER SHELL — glossy chassis */
    const shell = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, depth, 6, 0.09),
      new THREE.MeshPhysicalMaterial({
        color:0x08111e,
        metalness:0.48,
        roughness:0.16,
        clearcoat:1,
        clearcoatRoughness:0.08,
        transparent:true,
        opacity:0.86,
        emissive:0x081a28,
        emissiveIntensity:0.32
      })
    );
    panelGroup.add(shell);

    /* INNER CHASSIS */
    const chassis = new THREE.Mesh(
      new RoundedBoxGeometry(w * 0.93, h * 0.87, depth * 0.55, 4, 0.05),
      new THREE.MeshPhysicalMaterial({
        color:0x050b14,
        metalness:0.60,
        roughness:0.20,
        clearcoat:1,
        clearcoatRoughness:0.12,
        transparent:true,
        opacity:0.97
      })
    );
    chassis.position.z = 0.01;
    panelGroup.add(chassis);

    /* FRONT TEXTURE PLATE */
    const frontTex = createPanelTexture({
      accent:`#${item.color.toString(16).padStart(6,"0")}`,
      accent2:`#${item.accent.toString(16).padStart(6,"0")}`,
      label:`${item.id.toUpperCase()} PANEL`
    });

    const backTex = createPanelTexture({
      accent:`#${item.color.toString(16).padStart(6,"0")}`,
      accent2:`#${item.accent.toString(16).padStart(6,"0")}`,
      label:`${item.id.toUpperCase()} PANEL`,
      back:true
    });

    const frontPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.89, h * 0.83),
      new THREE.MeshPhysicalMaterial({
        map:frontTex,
        emissive:new THREE.Color(item.color),
        emissiveMap:frontTex,
        emissiveIntensity:0.28,
        metalness:0.28,
        roughness:0.14,
        transparent:true,
        opacity:0.94
      })
    );
    frontPlate.position.z = depth * 0.52;
    panelGroup.add(frontPlate);

    /* HOLOGRAPHIC FRAME — animated shader border */
    const frameUniforms = { uTime: { value: 0 }, uColor1: { value: new THREE.Color(item.color) }, uColor2: { value: new THREE.Color(item.accent) } };
    shaderUniforms.push(frameUniforms);

    const frameMat = new THREE.ShaderMaterial({
      uniforms: frameUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        void main(){
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float sweep = sin(angle * 2.0 + uTime * 1.8) * 0.5 + 0.5;
          vec3 col = mix(uColor1, uColor2, sweep);
          float edge = 1.0 - min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y)) * 24.0;
          float alpha = clamp(edge, 0.0, 1.0) * (0.25 + sweep * 0.4);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const holoFrame = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.91), frameMat);
    holoFrame.position.z = depth * 0.54;
    panelGroup.add(holoFrame);

    const backPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.89, h * 0.83),
      new THREE.MeshPhysicalMaterial({
        map:backTex,
        emissive:new THREE.Color(item.color),
        emissiveMap:backTex,
        emissiveIntensity:0.18,
        metalness:0.36,
        roughness:0.20,
        transparent:true,
        opacity:0.98
      })
    );
    backPlate.position.z = -depth * 0.52;
    backPlate.rotation.y = Math.PI;
    panelGroup.add(backPlate);

    const rearFrame = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.92, h * 0.86, 0.028),
      new THREE.MeshPhysicalMaterial({
        color:0x09131f,
        metalness:0.66,
        roughness:0.16,
        emissive:item.color,
        emissiveIntensity:0.08,
        transparent:true,
        opacity:0.94
      })
    );
    rearFrame.position.z = -depth * 0.44;
    panelGroup.add(rearFrame);

    const rearGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.80, h * 0.58),
      glowMat(item.color, 0.12)
    );
    rearGlow.position.z = -depth * 0.56;
    rearGlow.rotation.y = Math.PI;
    panelGroup.add(rearGlow);
    pulsingLights.push(rearGlow);

    const rearSeal = new THREE.Mesh(
      new THREE.RingGeometry(Math.min(w, h) * 0.16, Math.min(w, h) * 0.24, 48),
      glowMat(item.accent, 0.14)
    );
    rearSeal.position.set(0, 0, -depth * 0.54);
    rearSeal.rotation.y = Math.PI;
    panelGroup.add(rearSeal);
    lightBands.push(rearSeal);

    const lowerAccent = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.60, 0.056, 0.036),
      glowMat(item.color, 0.18)
    );
    lowerAccent.position.set(0, -h * 0.44, depth * 0.44);
    panelGroup.add(lowerAccent);
    lightBands.push(lowerAccent);

    const sideAccentL = new THREE.Mesh(
      new THREE.BoxGeometry(0.044, h * 0.60, 0.024),
      glowMat(item.color, 0.12)
    );
    sideAccentL.position.set(-w * 0.455, 0, depth * 0.43);
    panelGroup.add(sideAccentL);
    lightBands.push(sideAccentL);

    const sideAccentR = new THREE.Mesh(
      new THREE.BoxGeometry(0.044, h * 0.60, 0.024),
      glowMat(item.accent, 0.12)
    );
    sideAccentR.position.set(w * 0.455, 0, depth * 0.43);
    panelGroup.add(sideAccentR);
    lightBands.push(sideAccentR);

    addPanelEdgeLights(panelGroup, w, h, depth, item.color, item.accent);

    panelGroup.userData.isFixedGalleryPanel = true;
    item.visual = panelGroup;
    item.focusAmount = 0;

    item.frameRefs = {
      shell,
      frontPlate,
      backPlate,
      rearFrame,
      rearGlow,
      rearSeal,
      lowerAccent,
      sideAccentL,
      sideAccentR,
      holoFrame
    };
  });

  /* Build unified supports AFTER all panels exist */
  createUnifiedPanelSupports();
}

/* =========================================================
   UNIFIED PANEL SUPPORTS
   Geometría idéntica para todos los paneles — orden máximo
========================================================= */
function createUnifiedPanelSupports(){
  panelAnchors.forEach(item => {
    const supportGroup = new THREE.Group();
    const { w, h } = item.size;

    /* Position support at panel position */
    supportGroup.position.copy(item.anchor.position);
    supportGroup.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      item.facing.clone().normalize()
    );
    world.add(supportGroup);

    if(item.id === "title"){
      buildFloorSupport(supportGroup, item, w, h, "large");
    }
    else if(item.id === "subscribe"){
      buildFloorSupport(supportGroup, item, w, h, "small");
    }
    else if(item.id === "logo"){
  /* Sin soporte raro en el panel lateral izquierdo */
}
else if(item.id === "banner"){
  buildSideSupportStructure(supportGroup, item, w, h);
}
    else if(item.id === "video"){
      buildWallSupport(supportGroup, item, w, h);
    }

    panelSupports.push(supportGroup);
  });
}

/* ============ SUPPORT BUILDERS ============ */

function buildFloorSupport(group, item, w, h, size = "large"){
  const panelBottomY = -h * 0.50;
  const floorY = -item.anchor.position.y;
  const gapToFloor = panelBottomY - floorY;

  const isLarge = size === "large";
  const mastRadiusTop = isLarge ? 0.085 : 0.065;
  const mastRadiusBot = isLarge ? 0.14 : 0.10;
  const footRadius    = isLarge ? 0.44 : 0.34;

  /* Central support column */
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(mastRadiusTop, mastRadiusBot, Math.abs(gapToFloor) * 0.92, 18),
    metalMat(0x0b1522, item.color, 0.10)
  );
  mast.position.set(0, panelBottomY - Math.abs(gapToFloor) * 0.46, -0.16);
  group.add(mast);

  const mastCore = new THREE.Mesh(
    new THREE.CylinderGeometry(mastRadiusTop * 0.35, mastRadiusBot * 0.35, Math.abs(gapToFloor) * 0.88, 12),
    glowMat(item.color, 0.22)
  );
  mastCore.position.copy(mast.position);
  group.add(mastCore);
  lightBands.push(mastCore);

  /* Diagonal braces — symmetric */
  [-1, 1].forEach(side => {
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, Math.abs(gapToFloor) * 0.50, 0.075),
      metalMat(0x0a1420, side < 0 ? item.color : item.accent, 0.07)
    );
    brace.position.set(side * w * 0.22, panelBottomY - Math.abs(gapToFloor) * 0.35, -0.16);
    brace.rotation.z = side * 0.52;
    group.add(brace);
  });

  /* Hub block at panel bottom */
  const hubBlock = new THREE.Mesh(
    new RoundedBoxGeometry(isLarge ? 0.56 : 0.42, 0.26, 0.26, 4, 0.04),
    metalMat(0x09131f, item.accent, 0.07)
  );
  hubBlock.position.set(0, panelBottomY + 0.02, -0.16);
  group.add(hubBlock);

  /* Glowing core inside hub */
  const hubCore = new THREE.Mesh(
    new THREE.SphereGeometry(isLarge ? 0.14 : 0.10, 18, 18),
    new THREE.MeshPhysicalMaterial({
      color:0x8cf7ff,
      emissive:item.color,
      emissiveIntensity:0.98,
      metalness:0.16,
      roughness:0.06,
      transmission:0.22,
      transparent:true,
      opacity:0.95
    })
  );
  hubCore.position.set(0, panelBottomY + 0.02, -0.16);
  group.add(hubCore);
  animatedMeshes.push(hubCore);

  /* Orbital rings around hub */
  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(isLarge ? 0.24 : 0.18, 0.014, 10, 48),
    glowMat(item.color, 0.18)
  );
  ringA.position.set(0, panelBottomY + 0.02, -0.16);
  ringA.rotation.x = Math.PI / 2;
  ringA.userData.spin = 0.0012;
  group.add(ringA);
  animatedMeshes.push(ringA);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(isLarge ? 0.18 : 0.14, 0.012, 10, 42),
    glowMat(item.accent, 0.16)
  );
  ringB.position.set(0, panelBottomY + 0.02, -0.16);
  ringB.rotation.y = Math.PI / 2;
  ringB.userData.spin = -0.0014;
  group.add(ringB);
  animatedMeshes.push(ringB);

  /* Floor foot — identical style */
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(footRadius * 0.75, footRadius, 0.12, 28),
    glassMat(0x07101c, 0.88)
  );
  foot.position.set(0, floorY + 0.06, -0.16);
  group.add(foot);

  /* Foot halo */
  const footGlow = new THREE.Mesh(
    new THREE.TorusGeometry(footRadius * 0.80, 0.020, 10, 50),
    glowMat(item.color, 0.20)
  );
  footGlow.position.set(0, floorY + 0.12, -0.16);
  footGlow.rotation.x = Math.PI / 2;
  footGlow.userData.spin = 0.0010;
  group.add(footGlow);
  animatedMeshes.push(footGlow);

  /* Extra floor emission ring */
  const footFlare = new THREE.Mesh(
    new THREE.CircleGeometry(footRadius * 1.3, 32),
    glowMat(item.color, 0.12)
  );
  footFlare.position.set(0, floorY + 0.015, -0.16);
  footFlare.rotation.x = -Math.PI / 2;
  group.add(footFlare);
  lightBands.push(footFlare);

  /* Vertical LED accent */
  const verticalLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, Math.abs(gapToFloor) * 0.80, 0.014),
    glowMat(item.accent, 0.60)
  );
  verticalLed.position.set(0, panelBottomY - Math.abs(gapToFloor) * 0.45, -0.06);
  group.add(verticalLed);
  lightBands.push(verticalLed);
}

function buildSideSupportStructure(group, item, w, h){
  /* Soporte más limpio y coherente para los paneles laterales */

  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, h * 0.52, 0.08),
    metalMat(0x09131f, item.accent, 0.07)
  );
  rearPlate.position.set(0, 0, -0.48);
  group.add(rearPlate);

  const connector = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.38, 12),
    metalMat(0x0a1623, item.color, 0.09)
  );
  connector.rotation.x = Math.PI / 2;
  connector.position.set(0, 0, -0.28);
  group.add(connector);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 18, 18),
    new THREE.MeshPhysicalMaterial({
      color:0x8cf7ff,
      emissive:item.color,
      emissiveIntensity:0.90,
      metalness:0.18,
      roughness:0.06,
      transmission:0.22,
      transparent:true,
      opacity:0.96,
      clearcoat:1
    })
  );
  core.position.set(0, 0, -0.50);
  group.add(core);
  animatedMeshes.push(core);

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.012, 10, 48),
    glowMat(item.color, 0.18)
  );
  ringA.position.set(0, 0, -0.50);
  ringA.rotation.x = Math.PI / 2;
  ringA.userData.spin = 0.0011;
  group.add(ringA);
  animatedMeshes.push(ringA);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.010, 10, 42),
    glowMat(item.accent, 0.16)
  );
  ringB.position.set(0, 0, -0.50);
  ringB.rotation.y = Math.PI / 2;
  ringB.userData.spin = -0.0013;
  group.add(ringB);
  animatedMeshes.push(ringB);

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(0.30, 28),
    glowMat(item.color, 0.10)
  );
  halo.position.set(0, 0, -0.56);
  halo.rotation.y = Math.PI / 2;
  group.add(halo);
  lightBands.push(halo);
}

function buildWallSupport(group, item, w, h){
  /* Video panel: supported from floor with same unified aesthetic */
  const panelBottomY = -h * 0.50;
  const floorY = -item.anchor.position.y;
  const gapToFloor = panelBottomY - floorY;

  /* Twin columns — unified style with other panels */
  [-1, 1].forEach(side => {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.095, Math.abs(gapToFloor) * 0.92, 14),
      metalMat(0x0b1522, item.color, 0.10)
    );
    mast.position.set(side * w * 0.28, panelBottomY - Math.abs(gapToFloor) * 0.46, -0.12);
    group.add(mast);

    const mastCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.024, Math.abs(gapToFloor) * 0.88, 10),
      glowMat(side < 0 ? item.color : item.accent, 0.22)
    );
    mastCore.position.copy(mast.position);
    group.add(mastCore);
    lightBands.push(mastCore);

    /* Foot for each column */
    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 0.10, 20),
      glassMat(0x07101c, 0.86)
    );
    foot.position.set(side * w * 0.28, floorY + 0.05, -0.12);
    group.add(foot);

    const footGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.018, 10, 44),
      glowMat(side < 0 ? item.color : item.accent, 0.18)
    );
    footGlow.position.set(side * w * 0.28, floorY + 0.11, -0.12);
    footGlow.rotation.x = Math.PI / 2;
    footGlow.userData.spin = 0.0010 * side;
    group.add(footGlow);
    animatedMeshes.push(footGlow);
  });

  /* Horizontal cross-beam linking the columns */
  const crossBeam = new THREE.Mesh(
    new RoundedBoxGeometry(w * 0.58, 0.08, 0.10, 4, 0.02),
    metalMat(0x0a1420, item.color, 0.08)
  );
  crossBeam.position.set(0, panelBottomY - 0.08, -0.12);
  group.add(crossBeam);

  const beamGlow = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.50, 0.016, 0.016),
    glowMat(item.color, 0.28)
  );
  beamGlow.position.set(0, panelBottomY - 0.08, -0.06);
  group.add(beamGlow);
  lightBands.push(beamGlow);
}

/* =========================================================
   LOADING PROGRESS
========================================================= */
function setLoadProgress(pct, label){
  if(loadingBar)    loadingBar.style.width = pct + "%";
  if(loadingStatus) loadingStatus.textContent = label;
}
function finishLoading(){
  if(loadingScreen) loadingScreen.classList.add("is-done");
}

/* =========================================================
   CURSOR
========================================================= */
function updateCursor(){
  if(state.mode === "menu" || state.mode === "transition"){
    document.body.style.cursor = "auto";
    webglView.style.cursor = "default";
    if(crosshair) crosshair.style.opacity = "0";
    return;
  }

  if(state.dragging){
    document.body.style.cursor = "grabbing";
    webglView.style.cursor = "grabbing";
  }else if(isTyping(document.activeElement)){
    document.body.style.cursor = "text";
    webglView.style.cursor = "auto";
  }else{
    document.body.style.cursor = "auto";
    webglView.style.cursor = "grab";
  }

  if(crosshair) crosshair.style.opacity = "0.62";
}

function showMenu(){
  state.mode = "menu";
  state.dragging = false;
  cinematic.active = false;
  stopMovement();
  blurActive();
  introOverlay.classList.remove("is-hidden");
  updateCursor();
}

function enterExperience(){
  state.mode = "transition";
  state.dragging = false;
  introOverlay.classList.add("is-hidden");
  blurActive();
  stopMovement();

  cinematic.active = true;
  cinematic.start = clock.getElapsedTime();
  cinematic.fromPos.copy(camera.position);

  const currentDir = new THREE.Vector3();
  camera.getWorldDirection(currentDir);
  cinematic.fromLook.copy(camera.position).add(currentDir.multiplyScalar(8));

  cinematic.toPos.set(0.12, 1.82, 0.92);
  cinematic.toLook.set(0, 1.82, -7.8);

  updateCursor();
}

/* =========================================================
   MODAL
========================================================= */
function openAssetModal(slide){
  state.modalOpen = true;

  assetModalTitle.textContent = slide.title;
  assetModalContent.innerHTML = `
    <div class="tt-modal-stage ${slide.klass || ""}">
      <div class="tt-modal-kicker">${slide.kicker}</div>
      <div class="tt-modal-big">${slide.title}</div>
      <div class="tt-modal-text">${slide.text}</div>
    </div>
  `;

  assetModal.classList.add("is-open");
  assetModal.setAttribute("aria-hidden", "false");
}

function closeAssetModal(){
  state.modalOpen = false;
  assetModal.classList.remove("is-open");
  assetModal.setAttribute("aria-hidden", "true");
}

/* =========================================================
   PANEL RENDERS
========================================================= */
function renderLogoPanel(direction = "next"){
  const cur = leftPanelSlides[leftPanelIndex];

  logoBody.innerHTML = `
    <div class="live-grid trend-slide trend-enter-${direction}">
      <div class="asset-live-box trend-carousel-box">
        <div class="trend-carousel-stage" id="left-panel-stage-click">
          <img src="${cur.image}" alt="${cur.title}" class="trend-carousel-image">
        </div>
      </div>

      <div class="trend-carousel-info">
        <div class="trend-carousel-title">${cur.title}</div>
        <div class="trend-carousel-dots">
          ${leftPanelSlides.map((_, i) => `
            <span class="trend-dot ${i === leftPanelIndex ? "is-active" : ""}"></span>
          `).join("")}
        </div>
      </div>

      <div class="mini-toolbar">
        <button type="button" class="mini-action alt" id="left-prev-btn">Anterior</button>
        <button type="button" class="mini-action" id="left-next-btn">Siguiente</button>
        <button type="button" class="mini-action" id="left-open-btn">Ampliar</button>
      </div>
    </div>
  `;

  const open = e => {
    e.stopPropagation();
    openTrendModal();
  };

  document.getElementById("left-panel-stage-click")?.addEventListener("click", open);
  document.getElementById("left-open-btn")?.addEventListener("click", open);

  document.getElementById("left-prev-btn")?.addEventListener("click", e => {
    e.stopPropagation();
    animateTrendChange("prev");
  });

  document.getElementById("left-next-btn")?.addEventListener("click", e => {
    e.stopPropagation();
    animateTrendChange("next");
  });
}

function animateTrendChange(direction){
  const current = logoBody.querySelector(".trend-slide");
  if(current){
    current.classList.remove("trend-enter-next", "trend-enter-prev");
    current.classList.add(direction === "next" ? "trend-exit-left" : "trend-exit-right");

    setTimeout(() => {
      leftPanelIndex = direction === "next"
        ? (leftPanelIndex + 1) % leftPanelSlides.length
        : (leftPanelIndex - 1 + leftPanelSlides.length) % leftPanelSlides.length;

      renderLogoPanel(direction);
    }, 260);
  }
}

function openTrendModal(){
  const cur = leftPanelSlides[leftPanelIndex];

  assetModalTitle.textContent = cur.title.toUpperCase();
  assetModalContent.innerHTML = `
    <div class="tt-modal-stage trend-modal-stage">
      <div class="trend-modal-slide trend-enter-next" id="trend-modal-slide">
        <img src="${cur.image}" alt="${cur.title}" class="trend-modal-image">
      </div>

      <div class="trend-modal-dots">
        ${leftPanelSlides.map((_, i) => `
          <span class="trend-dot ${i === leftPanelIndex ? "is-active" : ""}"></span>
        `).join("")}
      </div>

      <div class="trend-modal-toolbar">
        <button type="button" class="mini-action alt" id="trend-modal-prev">Anterior</button>
        <button type="button" class="mini-action" id="trend-modal-next">Siguiente</button>
      </div>
    </div>
  `;

  assetModal.classList.add("is-open");
  assetModal.setAttribute("aria-hidden", "false");
  state.modalOpen = true;

  document.getElementById("trend-modal-prev")?.addEventListener("click", e => {
    e.stopPropagation();
    animateTrendModalChange("prev");
  });

  document.getElementById("trend-modal-next")?.addEventListener("click", e => {
    e.stopPropagation();
    animateTrendModalChange("next");
  });
}

function animateTrendModalChange(direction){
  const slide = document.getElementById("trend-modal-slide");
  if(slide){
    slide.classList.remove("trend-enter-next", "trend-enter-prev");
    slide.classList.add(direction === "next" ? "trend-exit-left" : "trend-exit-right");

    setTimeout(() => {
      leftPanelIndex = direction === "next"
        ? (leftPanelIndex + 1) % leftPanelSlides.length
        : (leftPanelIndex - 1 + leftPanelSlides.length) % leftPanelSlides.length;

      openTrendModal();
      renderLogoPanel(direction);
    }, 260);
  }
}

function renderBannerPanel(){
  bannerBody.innerHTML = `
    <div class="live-grid">
      <div class="asset-live-box banner-box">
        <div class="banner-real-stage" id="banner-stage-click">
          <img src="assets/img/banner-trendtech.webp" alt="Banner promocional de TrendTech" class="banner-real-image">
        </div>
      </div>

      <div class="mini-toolbar">
        <button type="button" class="mini-action" id="banner-open-btn">Ampliar</button>
      </div>
    </div>
  `;

  const open = e => {
    e.stopPropagation();
    assetModalTitle.textContent = "Banner TrendTech";
    assetModalContent.innerHTML = `
      <div class="tt-modal-stage banner-modal-stage">
        <img src="assets/img/banner-trendtech.webp" alt="Banner promocional de TrendTech" class="banner-modal-image">
      </div>
    `;
    assetModal.classList.add("is-open");
    assetModal.setAttribute("aria-hidden", "false");
    state.modalOpen = true;
  };

  document.getElementById("banner-stage-click")?.addEventListener("click", open);
  document.getElementById("banner-open-btn")?.addEventListener("click", open);
}

function renderVideoPanel(){
  videoBody.innerHTML = `
    <div class="live-grid">
      <div class="video-frame-shell" id="video-frame-shell">
        <iframe
          id="trendtech-video-frame"
          class="video-embed-frame"
          src="https://www.youtube-nocookie.com/embed/wW4oR1XZQ3c?rel=0&modestbranding=1"
          title="Vídeo TrendTech"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen>
        </iframe>
      </div>
    </div>
  `;

  const frame = document.getElementById("trendtech-video-frame");
  frame?.addEventListener("pointerdown", e => e.stopPropagation());
  frame?.addEventListener("click", e => e.stopPropagation());
}

function setupSubscribePanel(){
  const KEY = "trendtech_demo_registrations";
  subscribeForm?.addEventListener("submit", e=>{
    e.preventDefault(); e.stopPropagation();
    const email = subscribeInput.value.trim();
    if(!email){ subscribeInput.focus(); subscribeInput.placeholder="Introduce un correo"; return; }
    let cur=[]; try{ cur=JSON.parse(localStorage.getItem(KEY)||"[]"); }catch{}
    cur.push({ email, createdAt:new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(cur));
    subscribeStatus.textContent = `Registrado: ${email}. Total: ${cur.length}.`;
    subscribeInput.value="";
  });
  [subscribeForm, subscribeInput].forEach(el=>{ el?.addEventListener("pointerdown",e=>e.stopPropagation()); el?.addEventListener("click",e=>e.stopPropagation()); el?.addEventListener("keydown",e=>e.stopPropagation()); });
}

/* =========================================================
   LIGHTS — enhanced
========================================================= */
function addLights(){
  scene.add(new THREE.AmbientLight(0x90dcff, 0.62));
  scene.add(new THREE.HemisphereLight(0x0b1a2e, 0x000508, 0.54));

  const addPt = (color, intensity, distance, x, y, z) => {
    const l = new THREE.PointLight(color, intensity, distance, 2);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  };

  /* Ambient scene lights */
  addPt(0x27e7ff, 1.2, 20, 0, 4.2, -8.0);
  addPt(0xff38c8, 0.8, 18, 0, 3.6, -14.0);
  addPt(0x4d7cff, 0.9, 16, -3.5, 2.8, -10.0);
  addPt(0x8cf7ff, 0.9, 16,  3.5, 2.8, -10.0);

  /* Panel accent lights */
  panelAccentLights.length = 0;

  const titleGlow = addPt(0x8cf7ff, 0.0, 20, 0.0, 3.4, -5.3);
  panelAccentLights.push({ id:"title", light:titleGlow, base:1.8, boost:6.0 });

  const logoGlow = addPt(0x27e7ff, 0.0, 15, -4.6, 2.7, -9.8);
  panelAccentLights.push({ id:"logo", light:logoGlow, base:1.2, boost:4.0 });

  const bannerGlow = addPt(0xff38c8, 0.0, 15, 4.6, 2.7, -9.8);
  panelAccentLights.push({ id:"banner", light:bannerGlow, base:1.2, boost:4.0 });

  const videoGlow = addPt(0x8cf7ff, 0.0, 17, 0.0, 2.8, -13.0);
  panelAccentLights.push({ id:"video", light:videoGlow, base:1.3, boost:4.4 });

  const subscribeGlow = addPt(0xff72df, 0.0, 12, 0.0, 0.9, -6.2);
  panelAccentLights.push({ id:"subscribe", light:subscribeGlow, base:0.85, boost:2.6 });
}


/* =========================================================
   FLOOR — HEX GRID + SHADER + CIRCUIT TRACES
========================================================= */
function createFloor(){
  const depth = room.maxZ - room.minZ;
  const centerZ = (room.maxZ + room.minZ) / 2;

  /* Base reflective floor */
  const baseFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(room.halfWidth*2.4, depth+3.5, 1, 1),
    new THREE.MeshPhysicalMaterial({
      color:0x040c1a,
      metalness:0.58,
      roughness:0.07,
      clearcoat:1,
      clearcoatRoughness:0.05,
      transparent:true,
      opacity:0.98
    })
  );
  baseFloor.rotation.x = -Math.PI/2;
  baseFloor.position.set(0, 0, centerZ);
  world.add(baseFloor);

  /* Animated shader overlay on floor */
  const floorUniforms = {
    uTime:{value:0},
    uColor1:{value:new THREE.Color(0x22deff)},
    uColor2:{value:new THREE.Color(0xff30c0)}
  };
  shaderUniforms.push(floorUniforms);

  const floorShaderMat = new THREE.ShaderMaterial({
    uniforms: floorUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;
      void main(){
        vec2 g = fract(vUv * 28.0);
        float lines = 1.0 - min(min(g.x, 1.0-g.x), min(g.y, 1.0-g.y)) * 24.0;
        lines = clamp(lines, 0.0, 1.0) * 0.22;
        float dist = length(vUv - vec2(0.5));
        float pulse = (sin(dist * 26.0 - uTime * 1.6) * 0.5 + 0.5) * max(0.0, 1.0 - dist * 2.0) * 0.08;

        /* Radial energy from center of room */
        float radial = (sin(dist * 40.0 - uTime * 2.0) * 0.5 + 0.5) * max(0.0, 1.0 - dist * 2.2) * 0.05;

        vec3 col = mix(uColor1, uColor2, vUv.x + sin(uTime*0.3)*0.2);
        gl_FragColor = vec4(col, lines + pulse + radial);
      }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  });

  floorShaderMesh = new THREE.Mesh(new THREE.PlaneGeometry(room.halfWidth*2.4, depth+3.5), floorShaderMat);
  floorShaderMesh.rotation.x = -Math.PI/2;
  floorShaderMesh.position.set(0, 0.005, centerZ);
  world.add(floorShaderMesh);

  /* Hexagonal instanced mesh */
  const hexGeo  = new THREE.CylinderGeometry(0.44, 0.44, 0.035, 6);
  const hexMat  = new THREE.MeshPhysicalMaterial({
    color:0x050d1e,
    metalness:0.74,
    roughness:0.06,
    clearcoat:1,
    clearcoatRoughness:0.04,
    emissive:0x061830,
    emissiveIntensity:0.9
  });
  const edgeGeo  = new THREE.CylinderGeometry(0.46, 0.46, 0.006, 6, 1, true);
  const edgeMat  = new THREE.MeshBasicMaterial({
    color:0x27e7ff,
    transparent:true,
    opacity:0.08,
    side:THREE.FrontSide,
    blending:THREE.AdditiveBlending
  });

  const cols = 10, rows = 18;
  const hexW = 0.95, hexH = 0.82;
  const count = cols * rows;
  const hexInst  = new THREE.InstancedMesh(hexGeo, hexMat, count);
  const edgeInst = new THREE.InstancedMesh(edgeGeo, edgeMat, count);
  const dummy = new THREE.Object3D();
  let idx = 0;

  for(let row = 0; row < rows; row++){
    for(let col = 0; col < cols; col++, idx++){
      const x = (col - cols/2 + 0.5) * hexW + (row%2===0 ? 0 : hexW/2);
      const z = room.minZ + 1.0 + row * hexH;
      dummy.position.set(x, -0.018, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      hexInst.setMatrixAt(idx, dummy.matrix);
      edgeInst.setMatrixAt(idx, dummy.matrix);
    }
  }
  hexInst.instanceMatrix.needsUpdate = true;
  edgeInst.instanceMatrix.needsUpdate = true;
  world.add(hexInst);
  world.add(edgeInst);

     /* Central energy platform under tesseract */
  const tesseractZ = -10.5;

  const centerDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 64),
    glowMat(0x27e7ff, 0.16)
  );
  centerDisc.rotation.x = -Math.PI / 2;
  centerDisc.position.set(0, 0.045, tesseractZ);
  centerDisc.material.depthTest = false;
  centerDisc.renderOrder = 30;
  world.add(centerDisc);
  lightBands.push(centerDisc);

    const outerSpinner = new THREE.Group();
  outerSpinner.position.set(0, 0.05, tesseractZ);
  outerSpinner.userData.spin = 0.22;
  outerSpinner.userData.pulseOffset = 0.0;
  world.add(outerSpinner);
  floorCoreSpinners.push(outerSpinner);

  const ringOuterA = new THREE.Mesh(
    new THREE.RingGeometry(1.45, 1.62, 96, 1, 0, Math.PI * 0.68),
    glowMat(0x27e7ff, 0.46)
  );
  ringOuterA.rotation.x = -Math.PI / 2;
  ringOuterA.material.depthTest = false;
  ringOuterA.renderOrder = 31;
  ringOuterA.userData.baseOpacity = 0.46;
  outerSpinner.add(ringOuterA);

  const ringOuterB = new THREE.Mesh(
    new THREE.RingGeometry(1.45, 1.62, 96, 1, Math.PI, Math.PI * 0.52),
    glowMat(0x8cf7ff, 0.32)
  );
  ringOuterB.rotation.x = -Math.PI / 2;
  ringOuterB.material.depthTest = false;
  ringOuterB.renderOrder = 31;
  ringOuterB.userData.baseOpacity = 0.32;
  outerSpinner.add(ringOuterB);

  const midSpinner = new THREE.Group();
  midSpinner.position.set(0, 0.051, tesseractZ);
  midSpinner.userData.spin = -0.34;
  midSpinner.userData.pulseOffset = 1.1;
  world.add(midSpinner);
  floorCoreSpinners.push(midSpinner);

  const ringMidA = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.06, 96, 1, Math.PI * 0.18, Math.PI * 0.58),
    glowMat(0xff38c8, 0.36)
  );
  ringMidA.rotation.x = -Math.PI / 2;
  ringMidA.material.depthTest = false;
  ringMidA.renderOrder = 31;
  ringMidA.userData.baseOpacity = 0.36;
  midSpinner.add(ringMidA);

  const ringMidB = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.06, 96, 1, Math.PI * 1.12, Math.PI * 0.42),
    glowMat(0xffffff, 0.18)
  );
  ringMidB.rotation.x = -Math.PI / 2;
  ringMidB.material.depthTest = false;
  ringMidB.renderOrder = 31;
  ringMidB.userData.baseOpacity = 0.18;
  midSpinner.add(ringMidB);

  const ringInner = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.48, 64),
    glowMat(0xffffff, 0.22)
  );
  ringInner.rotation.x = -Math.PI / 2;
  ringInner.position.set(0, 0.052, tesseractZ);
  ringInner.material.depthTest = false;
  ringInner.renderOrder = 32;
  world.add(ringInner);
  lightBands.push(ringInner);

  const centerDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 32),
    glowMat(0xffffff, 0.28)
  );
  centerDot.rotation.x = -Math.PI / 2;
  centerDot.position.set(0, 0.053, tesseractZ);
  centerDot.material.depthTest = false;
  centerDot.renderOrder = 33;
  world.add(centerDot);
  pulsingLights.push(centerDot);

  const platformTraceSpecs = [
    { pts:[[0,0.055,tesseractZ],[ 2.10,0.055,tesseractZ]], c:0x27e7ff, w:0.050, h:0.010 },
    { pts:[[0,0.055,tesseractZ],[-2.10,0.055,tesseractZ]], c:0xff38c8, w:0.050, h:0.010 },
    { pts:[[0,0.055,tesseractZ],[0,0.055,tesseractZ + 2.10]], c:0x8cf7ff, w:0.050, h:0.010 },
    { pts:[[0,0.055,tesseractZ],[0,0.055,tesseractZ - 2.10]], c:0x4d7cff, w:0.050, h:0.010 }
  ];

  platformTraceSpecs.forEach(({pts, c, w, h}) => {
    for(let i = 0; i < pts.length - 1; i++){
      const a = new THREE.Vector3(...pts[i]);
      const b = new THREE.Vector3(...pts[i + 1]);
      const dir = b.clone().sub(a);
      const len = dir.length();
      const mid = a.clone().add(b).multiplyScalar(0.5);

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(len, h, w),
        glowMat(c, 0.80)
      );
      mesh.position.copy(mid);
      mesh.rotation.y = Math.atan2(dir.x, dir.z);
      mesh.material.depthTest = false;
      mesh.renderOrder = 34;
      world.add(mesh);
      lightBands.push(mesh);
    }

    const end = pts[pts.length - 1];
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 12, 12),
      glowMat(c, 1.0)
    );
    dot.position.set(end[0], end[1] + 0.02, end[2]);
    dot.material.depthTest = false;
    dot.renderOrder = 35;
    world.add(dot);
    pulsingLights.push(dot);
  });
}

/* =========================================================
   CEILING — ARCHED RIBS + PENDANT LIGHTS
========================================================= */
function createCeiling(){
  const depth = room.maxZ - room.minZ;
  const centerZ = (room.maxZ + room.minZ) / 2;

  /* Base ceiling plane */
  const ceilMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(room.halfWidth*2.4, depth+3.5),
    new THREE.MeshBasicMaterial({ color:0x04091a, transparent:true, opacity:0.10, depthWrite:false })
  );
  ceilMesh.rotation.x = Math.PI/2;
  ceilMesh.position.set(0, room.ceilingY, centerZ);
  world.add(ceilMesh);

  /* Ceiling shader glow strip */
  const ceilGlowUniforms = { uTime:{value:0} };
  shaderUniforms.push(ceilGlowUniforms);
  const ceilGlowMat = new THREE.ShaderMaterial({
    uniforms: ceilGlowUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main(){
        float stripe = abs(sin(vUv.y * 30.0 - uTime * 1.2)) * 0.5 + 0.5;
        float fade = (1.0 - abs(vUv.x - 0.5) * 2.2) * stripe;
        fade = clamp(fade * 0.10, 0.0, 0.10);
        vec3 col = mix(vec3(0.12, 0.88, 1.0), vec3(1.0, 0.18, 0.76), vUv.y);
        gl_FragColor = vec4(col, fade);
      }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  });
  const ceilGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, depth+2.0), ceilGlowMat);
  ceilGlow.rotation.x = Math.PI/2;
  ceilGlow.position.set(0, room.ceilingY-0.02, centerZ);
  world.add(ceilGlow);

  /* Arch ribs */
  const archZs = [-1.2, -5.2, -9.4, -13.6, -17.4];
  archZs.forEach((z, idx) => {
    const pts = [];
    const segs = 24;
    for(let i=0; i<=segs; i++){
      const t = i/segs;
      const x = -room.halfWidth + t * room.halfWidth * 2;
      const sagitta = 0.58 - (t-0.5)*(t-0.5) * 2.3;
      const y = room.ceilingY + sagitta - 0.2;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const curve  = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, segs, 0.032, 8, false);
    const color = idx%2===0 ? 0x27e7ff : 0xff38c8;
    const archMesh = new THREE.Mesh(tubeGeo, glowMat(color, 0.22));
    world.add(archMesh);
    pulsingLights.push(archMesh);
  });

  /* Longitudinal ceiling spine tubes */
  [-0.95, 0.95].forEach((xOff, si) => {
    const spPts = [];
    for(let i=0; i<=22; i++){
      const t = i/22;
      const z = room.maxZ - t*(room.maxZ-room.minZ);
      const y = room.ceilingY - 0.12 + Math.sin(t*Math.PI)*0.08;
      spPts.push(new THREE.Vector3(xOff, y, z));
    }
    const spCurve = new THREE.CatmullRomCurve3(spPts);
    const spGeo   = new THREE.TubeGeometry(spCurve, 22, 0.020, 7, false);
    const spMesh  = new THREE.Mesh(spGeo, glowMat(si===0?0x27e7ff:0xff38c8, 0.18));
    world.add(spMesh);
    lightBands.push(spMesh);
  });

  /* Pendant lights */
  const pendantZs = [-3.5, -7.0, -10.5, -14.5];
  pendantZs.forEach((z, pidx) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(0, room.ceilingY, z);
    world.add(pGroup);

    const cableCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-1.1,0)]);
    const cableGeo  = new THREE.TubeGeometry(cableCurve, 4, 0.012, 6, false);
    pGroup.add(new THREE.Mesh(cableGeo, new THREE.MeshBasicMaterial({color:0x223344,transparent:true,opacity:0.7})));

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.34, 14),
      glassMat(0x05101f, 0.82)
    );
    cone.position.y = -1.22;
    pGroup.add(cone);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.088, 14, 14), glowMat(pidx%2===0?0x8cf7ff:0xff72df, 0.95));
    orb.position.y = -1.28;
    orb.userData.floaty = true; orb.userData.baseY = -1.28; orb.userData.offset = pidx * 0.8;
    pGroup.add(orb);
    animatedMeshes.push(orb);

    const pl = new THREE.PointLight(pidx%2===0?0x22deff:0xff30c0, 9, 11, 2);
    pl.position.set(0, -1.28, 0);
    pGroup.add(pl);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.014, 10, 40), glowMat(pidx%2===0?0x27e7ff:0xff38c8, 0.26));
    ring.rotation.x = Math.PI/2;
    ring.position.y = -1.05;
    ring.userData.spin = 0.0015 + pidx*0.0003;
    pGroup.add(ring);
    animatedMeshes.push(ring);

    /* Extra outer ring for depth */
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.010, 8, 42), glowMat(pidx%2===0?0x8cf7ff:0xff72df, 0.14));
    outerRing.rotation.x = Math.PI/2;
    outerRing.position.y = -0.95;
    outerRing.userData.spin = -0.0010;
    pGroup.add(outerRing);
    animatedMeshes.push(outerRing);
  });
}

/* =========================================================
   WALLS — PANELED SEGMENTS
========================================================= */
function createWalls(){
  const depth = room.maxZ - room.minZ;
  const centerZ = (room.maxZ + room.minZ) / 2;
  const panelH = room.ceilingY;

  /* Back wall */
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(room.halfWidth*2.3, panelH+0.4),
    glassMat(0x0a1830, 0.18)
  );
  backWall.position.set(0, panelH/2, room.minZ-0.08);
  world.add(backWall);

  /* Back wall decorative frame */
  const backFrameUniforms = { uTime: { value: 0 } };
  shaderUniforms.push(backFrameUniforms);

  const backFrameMat = new THREE.ShaderMaterial({
    uniforms: backFrameUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main(){
        float dist = length(vUv - vec2(0.5));
        float ring1 = smoothstep(0.30, 0.32, dist) - smoothstep(0.33, 0.35, dist);
        float ring2 = smoothstep(0.40, 0.42, dist) - smoothstep(0.43, 0.45, dist);
        float pulse = sin(uTime * 1.5) * 0.3 + 0.7;
        vec3 col = mix(vec3(0.12, 0.88, 1.0), vec3(1.0, 0.18, 0.76), sin(uTime*0.4)*0.5+0.5);
        float alpha = (ring1 + ring2) * pulse * 0.4;
        gl_FragColor = vec4(col, alpha);
      }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  });

  const backFrame = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.6), backFrameMat);
  backFrame.position.set(0, 2.8, room.minZ-0.06);
  world.add(backFrame);

  /* Wall panel segments */
  const segCount = 6;
  const segH = panelH / segCount;
  const panelDepth = depth / 5.5;

  for(let side = -1; side <= 1; side += 2){
    const wallX = (room.halfWidth + 0.06) * side;
    const rotY  = side > 0 ? -Math.PI/2 : Math.PI/2;

    for(let s = 0; s < 5; s++){
      const z = room.minZ + s * panelDepth + panelDepth/2 + 0.5;

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(panelDepth * 0.88, panelH * 0.86, 0.06),
        glassMat(0x081224, 0.14)
      );
      panel.position.set(wallX, panelH/2, z);
      panel.rotation.y = rotY;
      world.add(panel);

      const bColor = (s + (side>0?1:0)) % 2 === 0 ? 0x27e7ff : 0xff38c8;
      const borderGeo = new THREE.PlaneGeometry(panelDepth * 0.86, panelH * 0.84);
      const borderMesh = new THREE.Mesh(borderGeo, glowMat(bColor, 0.06));
      borderMesh.position.set(wallX + side * (-0.04), panelH/2, z);
      borderMesh.rotation.y = rotY;
      world.add(borderMesh);
      pulsingLights.push(borderMesh);

      if(s === 1 || s === 3){
        for(let t=0; t<3; t++){
          const techBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.09, 0.05),
            glowMat(bColor, 0.36)
          );
          techBox.position.set(wallX + side*(-0.04), 1.2 + t*1.0, z + rnd(-0.3, 0.3));
          techBox.rotation.y = rotY;
          world.add(techBox);
          pulsingLights.push(techBox);
        }
      }

      const stripGeo = new THREE.PlaneGeometry(0.045, panelH * 0.72);
      const stripMesh = new THREE.Mesh(stripGeo, glowMat(bColor, 0.14));
      stripMesh.position.set(wallX + side*(-0.03), panelH/2, z - panelDepth*0.44);
      stripMesh.rotation.y = rotY;
      world.add(stripMesh);
      lightBands.push(stripMesh);
    }

    const floorStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.20, depth),
      glowMat(side>0?0xff38c8:0x27e7ff, 0.08)
    );
    floorStrip.rotation.x = -Math.PI/2;
    floorStrip.position.set((room.halfWidth - 0.14)*side, 0.012, centerZ);
    world.add(floorStrip);
    lightBands.push(floorStrip);
  }
}

/* =========================================================
   STRUCTURAL ARCH COLUMNS
========================================================= */
function createArchColumns(){
  const frameZs = [-1.0, -5.4, -9.8, -14.0, -17.8];
  frameZs.forEach((z, idx) => {
    const color = idx%2===0 ? 0x27e7ff : 0xff38c8;
    const altColor = idx%2===0 ? 0xff38c8 : 0x27e7ff;

    [-1, 1].forEach(side => {
      const colPts = [
        new THREE.Vector3(side*(room.halfWidth-0.55), 0, z),
        new THREE.Vector3(side*(room.halfWidth-0.45), room.ceilingY*0.4, z),
        new THREE.Vector3(side*(room.halfWidth-0.38), room.ceilingY*0.82, z),
        new THREE.Vector3(side*(room.halfWidth-0.55), room.ceilingY-0.18, z),
      ];
      const colCurve = new THREE.CatmullRomCurve3(colPts);
      const colTube  = new THREE.TubeGeometry(colCurve, 14, 0.034, 8, false);
      const colMesh  = new THREE.Mesh(colTube, glowMat(side>0?color:altColor, 0.24));
      world.add(colMesh);
      pulsingLights.push(colMesh);
    });

    [-1,1].forEach(side => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.020, 10, 40),
        glowMat(color, 0.26)
      );
      ring.position.set(side*(room.halfWidth-0.48), room.ceilingY*0.45, z);
      ring.rotation.x = Math.PI/2;
      ring.userData.spin = 0.0012 + idx*0.0002;
      world.add(ring);
      animatedMeshes.push(ring);
    });
  });
}

/* =========================================================
   DNA HELICES
========================================================= */
function createDNAHelix(px, pz, helixLen=7.0, turns=3.5){
  const group = new THREE.Group();
  const segs  = 240;
  const radius = 0.32;
  const s1pts  = [], s2pts = [];

  for(let i=0; i<=segs; i++){
    const t = i/segs;
    const angle = t * turns * Math.PI * 2;
    const y = t * helixLen + 0.4;
    s1pts.push(new THREE.Vector3(Math.cos(angle)*radius, y, Math.sin(angle)*radius*0.55));
    s2pts.push(new THREE.Vector3(Math.cos(angle+Math.PI)*radius, y, Math.sin(angle+Math.PI)*radius*0.55));
  }

  const c1 = new THREE.CatmullRomCurve3(s1pts);
  const c2 = new THREE.CatmullRomCurve3(s2pts);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(c1, segs, 0.022, 7, false), glowMat(0x27e7ff, 0.78)));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(c2, segs, 0.022, 7, false), glowMat(0xff38c8, 0.78)));

  const rungCount = Math.round(turns * 7);
  for(let i=0; i<rungCount; i++){
    const t = i/rungCount;
    const angle = t * turns * Math.PI * 2;
    const y = t * helixLen + 0.4;
    const p1 = new THREE.Vector3(Math.cos(angle)*radius, y, Math.sin(angle)*radius*0.55);
    const p2 = new THREE.Vector3(Math.cos(angle+Math.PI)*radius, y, Math.sin(angle+Math.PI)*radius*0.55);
    const rungCurve = new THREE.CatmullRomCurve3([p1, p2]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(rungCurve, 1, 0.010, 5, false), glowMat(i%2===0?0x8cf7ff:0xff72df, 0.62)));
    [p1,p2].forEach((pt,ni) => {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), glowMat(ni===0?0x8cf7ff:0xff72df, 0.95));
      n.position.copy(pt);
      group.add(n);
    });
  }

  group.position.set(px, 0, pz);
  world.add(group);
  group.userData.dna = true;
  dnaHelices.push(group);
}

/* =========================================================
   NEURAL WEB
========================================================= */
function createNeuralWeb(){
  const nodeCount = 56;
  const nodePositions = [];
  const nodeBasePos   = [];

  for(let i=0; i<nodeCount; i++){
    const x = rnd(-4.4, 4.4), y = rnd(1.0, 4.8), z = rnd(-13.0, -17.0);
    nodePositions.push(x, y, z);
    nodeBasePos.push(new THREE.Vector3(x, y, z));
  }

  const nodeGeo  = new THREE.SphereGeometry(0.060, 8, 8);
  const nodeMat  = glowMat(0x27e7ff, 0.90);
  const nodeInst = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
  const dummy = new THREE.Object3D();
  nodeBasePos.forEach((pos, i) => { dummy.position.copy(pos); dummy.updateMatrix(); nodeInst.setMatrixAt(i, dummy.matrix); });
  nodeInst.instanceMatrix.needsUpdate = true;
  world.add(nodeInst);

  const lineVerts = [];
  const maxDist = 2.8;
  nodeBasePos.forEach((a, i) => {
    nodeBasePos.forEach((b, j) => {
      if(i >= j) return;
      if(a.distanceTo(b) < maxDist){ lineVerts.push(a.x,a.y,a.z, b.x,b.y,b.z); }
    });
  });

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineVerts, 3));
  const lineMesh = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    color:0x22deff,
    transparent:true,
    opacity:0.14,
    blending:THREE.AdditiveBlending
  }));
  world.add(lineMesh);

  neuralData.push({ inst:nodeInst, lines:lineMesh, base:nodeBasePos });
}

/* =========================================================
   HOLO ARTIFACTS — symmetric layout
========================================================= */
function createHoloPrisms(){
  const specs = [
    

    /* Symmetric pair middle zone */

    { type:"orbital", color:0x7fb5ff, accent:0x27e7ff, x:-4.00, y:2.45, z:-10.40, ox:1.7, scale:1.04 },
    { type:"orbital", color:0x8cf7ff, accent:0x4d7cff, x: 4.00, y:2.45, z:-10.40, ox:2.2, scale:1.04 },

    /* Symmetric spires */
    { type:"spire",   color:0x4d7cff, accent:0x8cf7ff, x:-4.60, y:2.10, z:-13.20, ox:3.0, scale:0.92 },
    { type:"spire",   color:0xff38c8, accent:0xff72df, x: 4.60, y:2.10, z:-13.20, ox:3.5, scale:0.92 },

    /* Symmetric flux at back */
    { type:"flux",    color:0xff72df, accent:0xff38c8, x:-1.80, y:3.60, z:-16.20, ox:0.8, scale:0.96 },
    { type:"flux",    color:0x27e7ff, accent:0x8cf7ff, x: 1.80, y:3.60, z:-16.20, ox:2.6, scale:0.96 }
  ];

  const buildArtifact = spec => {
    const group = new THREE.Group();
    group.position.set(spec.x, spec.y, spec.z);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * spec.scale, 0.24 * spec.scale, 0.10 * spec.scale, 14),
      glassMat(0x08121f, 0.84)
    );
    pedestal.position.y = -0.68 * spec.scale;
    group.add(pedestal);

    const baseGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.32 * spec.scale, 28),
      glowMat(spec.color, 0.12)
    );
    baseGlow.rotation.x = -Math.PI / 2;
    baseGlow.position.y = -0.62 * spec.scale;
    group.add(baseGlow);
    lightBands.push(baseGlow);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.54 * spec.scale, 0.018 * spec.scale, 12, 80),
      glowMat(spec.color, 0.22)
    );
    outerRing.rotation.x = Math.PI / 2;
    outerRing.userData.spin = 0.0014;
    group.add(outerRing);
    animatedMeshes.push(outerRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38 * spec.scale, 0.014 * spec.scale, 10, 60),
      glowMat(spec.accent, 0.18)
    );
    innerRing.rotation.y = Math.PI / 2.7;
    innerRing.userData.spin = -0.0011;
    group.add(innerRing);
    animatedMeshes.push(innerRing);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.70 * spec.scale, 0.012 * spec.scale, 10, 68),
      glowMat(spec.accent, 0.12)
    );
    halo.rotation.x = Math.PI / 2;
    halo.userData.spin = 0.0008;
    group.add(halo);
    animatedMeshes.push(halo);

    for(let i = 0; i < 4; i++){
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.06 * spec.scale, 0.44 * spec.scale, 0.018 * spec.scale),
        metalMat(0x0a1320, i % 2 === 0 ? spec.color : spec.accent, 0.10)
      );
      const ang = i * (Math.PI / 2);
      fin.position.set(Math.cos(ang) * 0.22 * spec.scale, 0, Math.sin(ang) * 0.22 * spec.scale);
      fin.rotation.y = ang;
      group.add(fin);
    }

    if(spec.type === "reactor"){
      const shell = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.22 * spec.scale, 0.052 * spec.scale, 220, 32, 2, 3),
        glowMat(spec.color, 0.20)
      );
      shell.material.wireframe = true;
      shell.userData.floaty = true;
      shell.userData.baseY = 0;
      shell.userData.offset = spec.ox;
      shell.userData.spinX = 0.0016;
      shell.userData.spinY = 0.0032;
      group.add(shell);
      animatedMeshes.push(shell);

      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.15 * spec.scale, 2),
        new THREE.MeshPhysicalMaterial({
          color:spec.accent,
          emissive:spec.color,
          emissiveIntensity:0.76,
          metalness:0.20,
          roughness:0.05,
          transmission:0.20,
          transparent:true,
          opacity:0.96,
          clearcoat:1
        })
      );
      core.userData.floaty = true;
      core.userData.baseY = 0;
      core.userData.offset = spec.ox;
      core.userData.spinX = 0.0024;
      core.userData.spinY = 0.0040;
      group.add(core);
      animatedMeshes.push(core);

      const cage = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.30 * spec.scale, 1),
        glowMat(spec.accent, 0.12)
      );
      cage.material.wireframe = true;
      cage.userData.floaty = true;
      cage.userData.baseY = 0;
      cage.userData.offset = spec.ox + 0.35;
      cage.userData.spinX = -0.0010;
      cage.userData.spinY = 0.0018;
      group.add(cage);
      animatedMeshes.push(cage);

      for(let i = 0; i < 4; i++){
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.046 * spec.scale, 12, 12),
          glowMat(i % 2 === 0 ? spec.color : spec.accent, 0.92)
        );
        orb.userData.orbit = true;
        orb.userData.radius = 0.32 * spec.scale + i * 0.045 * spec.scale;
        orb.userData.angle = i * (Math.PI * 2 / 4);
        orb.userData.speed = 0.0024 + i * 0.0004;
        orb.userData.tiltX = Math.PI / 2 + i * 0.28;
        group.add(orb);
        animatedMeshes.push(orb);
      }
    }


    if(spec.type === "orbital"){
      const spindle = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.10 * spec.scale, 0.62 * spec.scale, 8, 16),
        new THREE.MeshPhysicalMaterial({
          color:spec.color,
          emissive:spec.accent,
          emissiveIntensity:0.28,
          metalness:0.34,
          roughness:0.10,
          transparent:true,
          opacity:0.22,
          clearcoat:1
        })
      );
      spindle.userData.floaty = true;
      spindle.userData.baseY = 0;
      spindle.userData.offset = spec.ox;
      spindle.userData.spinX = 0.0012;
      spindle.userData.spinY = 0.0030;
      group.add(spindle);
      animatedMeshes.push(spindle);

      const wireA = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.36 * spec.scale, 1),
        glowMat(spec.color, 0.12)
      );
      wireA.material.wireframe = true;
      wireA.userData.floaty = true;
      wireA.userData.baseY = 0;
      wireA.userData.offset = spec.ox + 0.4;
      wireA.userData.spinX = -0.0012;
      wireA.userData.spinY = 0.0020;
      group.add(wireA);
      animatedMeshes.push(wireA);

      const wireB = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.18 * spec.scale, 0.032 * spec.scale, 140, 18, 3, 5),
        glowMat(spec.accent, 0.12)
      );
      wireB.material.wireframe = true;
      wireB.userData.floaty = true;
      wireB.userData.baseY = 0;
      wireB.userData.offset = spec.ox + 0.8;
      wireB.userData.spinX = 0.0016;
      wireB.userData.spinY = -0.0024;
      group.add(wireB);
      animatedMeshes.push(wireB);

      for(let i = 0; i < 3; i++){
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(0.044 * spec.scale, 12, 12),
          glowMat(i === 0 ? spec.color : spec.accent, 0.88)
        );
        node.userData.orbit = true;
        node.userData.radius = 0.28 * spec.scale + i * 0.08 * spec.scale;
        node.userData.angle = i * (Math.PI * 2 / 3);
        node.userData.speed = 0.0020 + i * 0.0005;
        node.userData.tiltX = Math.PI / 2.4 + i * 0.32;
        group.add(node);
        animatedMeshes.push(node);
      }
    }

    if(spec.type === "flux"){
      const knot = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.22 * spec.scale, 0),
  new THREE.MeshPhysicalMaterial({
    color:spec.accent,
    emissive:spec.color,
    emissiveIntensity:0.58,
    metalness:0.18,
    roughness:0.06,
    transmission:0.18,
    transparent:true,
    opacity:0.92,
    clearcoat:1
  })
);
knot.userData.floaty = true;
knot.userData.baseY = 0;
knot.userData.offset = spec.ox;
knot.userData.spinX = 0.0012;
knot.userData.spinY = 0.0022;
group.add(knot);
animatedMeshes.push(knot);

const fluxCage = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.34 * spec.scale, 1),
  glowMat(spec.color, 0.12)
);
fluxCage.material.wireframe = true;
fluxCage.userData.floaty = true;
fluxCage.userData.baseY = 0;
fluxCage.userData.offset = spec.ox + 0.35;
fluxCage.userData.spinX = -0.0010;
fluxCage.userData.spinY = 0.0018;
group.add(fluxCage);
animatedMeshes.push(fluxCage);

      const haloA = new THREE.Mesh(
        new THREE.TorusGeometry(0.28 * spec.scale, 0.026 * spec.scale, 10, 50),
        glowMat(spec.accent, 0.22)
      );
      haloA.rotation.x = Math.PI / 2;
      haloA.userData.spin = 0.0010;
      group.add(haloA);
      animatedMeshes.push(haloA);

      const haloB = new THREE.Mesh(
        new THREE.TorusGeometry(0.20 * spec.scale, 0.018 * spec.scale, 10, 42),
        glowMat(spec.color, 0.22)
      );
      haloB.rotation.y = Math.PI / 2;
      haloB.userData.spin = -0.0013;
      group.add(haloB);
      animatedMeshes.push(haloB);

      for(let i = 0; i < 4; i++){
        const spark = new THREE.Mesh(
          new THREE.SphereGeometry(0.030 * spec.scale, 10, 10),
          glowMat(i % 2 === 0 ? spec.color : spec.accent, 0.94)
        );
        spark.userData.orbit = true;
        spark.userData.radius = 0.22 * spec.scale + i * 0.04 * spec.scale;
        spark.userData.angle = i * (Math.PI * 2 / 4);
        spark.userData.speed = 0.0028 + i * 0.0004;
        spark.userData.tiltX = Math.PI / 2 + i * 0.22;
        group.add(spark);
        animatedMeshes.push(spark);
      }
    }

    

    if(spec.type === "spire"){
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05 * spec.scale, 0.12 * spec.scale, 1.06 * spec.scale, 12),
        new THREE.MeshPhysicalMaterial({
          color:0x0c1320,
          emissive:spec.color,
          emissiveIntensity:0.22,
          metalness:0.66,
          roughness:0.14,
          transparent:true,
          opacity:0.84
        })
      );
      shaft.userData.floaty = true;
      shaft.userData.baseY = 0;
      shaft.userData.offset = spec.ox;
      shaft.userData.spinX = 0.0008;
      shaft.userData.spinY = 0.0018;
      group.add(shaft);
      animatedMeshes.push(shaft);

      const crown = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.20 * spec.scale, 1),
        glowMat(spec.accent, 0.22)
      );
      crown.position.y = 0.62 * spec.scale;
      crown.material.wireframe = true;
      crown.userData.floaty = true;
      crown.userData.baseY = crown.position.y;
      crown.userData.offset = spec.ox + 0.4;
      crown.userData.spinX = 0.0014;
      crown.userData.spinY = 0.0028;
      group.add(crown);
      animatedMeshes.push(crown);

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.22 * spec.scale, 0.014 * spec.scale, 10, 40),
        glowMat(spec.color, 0.18)
      );
      halo.position.y = 0.22 * spec.scale;
      halo.rotation.x = Math.PI / 2;
      halo.userData.spin = 0.0014;
      group.add(halo);
      animatedMeshes.push(halo);
    }

    group.userData.baseY = spec.y;
    group.userData.offset = spec.ox;
    holoItems.push(group);
    world.add(group);
  };

  specs.forEach(buildArtifact);

  /* Side bridges */
  const bridgeLeft = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.014, 10, 46),
    glowMat(0x27e7ff, 0.10)
  );
  bridgeLeft.position.set(-2.55, 2.95, -9.80);
  bridgeLeft.rotation.y = Math.PI / 2.45;
  bridgeLeft.userData.spin = 0.0008;
  world.add(bridgeLeft);
  animatedMeshes.push(bridgeLeft);

  const bridgeRight = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.014, 10, 46),
    glowMat(0xff38c8, 0.10)
  );
  bridgeRight.position.set(2.55, 2.95, -9.80);
  bridgeRight.rotation.y = -Math.PI / 2.45;
  bridgeRight.userData.spin = -0.0008;
  world.add(bridgeRight);
  animatedMeshes.push(bridgeRight);
}

/* =========================================================
   ENERGY BEAM COLUMNS
========================================================= */
function createEnergyBeams(){
  const logoPanel   = panelAnchors.find(p => p.id === "logo");
const bannerPanel = panelAnchors.find(p => p.id === "banner");

const beamInsetX = 0.70;

const beamPositions = [
  {
    x: logoPanel.anchor.position.x + logoPanel.facing.x * beamInsetX,
    z: logoPanel.anchor.position.z - logoPanel.size.w / 2,
    c: logoPanel.color
  },
  {
    x: logoPanel.anchor.position.x + logoPanel.facing.x * beamInsetX,
    z: logoPanel.anchor.position.z + logoPanel.size.w / 2,
    c: logoPanel.color
  },
  {
    x: bannerPanel.anchor.position.x + bannerPanel.facing.x * beamInsetX,
    z: bannerPanel.anchor.position.z - bannerPanel.size.w / 2,
    c: bannerPanel.color
  },
  {
    x: bannerPanel.anchor.position.x + bannerPanel.facing.x * beamInsetX,
    z: bannerPanel.anchor.position.z + bannerPanel.size.w / 2,
    c: bannerPanel.color
  },
];


  beamPositions.forEach(({x,z,c}) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, 0, z);
    world.add(bGroup);

    const beamBottomY = 0.18;

    const coreHeight = room.ceilingY * 0.82;
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.085, coreHeight, 16),
      glowMat(c, 0.32)
    );
    core.material.depthTest = false;
core.renderOrder = 10;

    const shellHeight = room.ceilingY * 0.80;
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.24, shellHeight, 16),
      glowMat(c, 0.05)
    );
    shell.material.depthTest = false;
shell.renderOrder = 10;
    shell.position.y = beamBottomY + shellHeight / 2;
    bGroup.add(shell);

    for(let r=0; r<5; r++){
      const beamRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.19, 0.010, 12, 48),
        glowMat(c, 0.34)
      );
      beamRing.material.depthTest = false;
beamRing.renderOrder = 11;
      beamRing.position.y = 1.10 + r * 0.74;
      beamRing.rotation.x = Math.PI / 2;
      beamRing.userData.beamRing = true;
      beamRing.userData.baseY = beamRing.position.y;
      beamRing.userData.speed = 0.0018 + r * 0.0006;
      beamRing.userData.offset = r * 0.7;
      bGroup.add(beamRing);
      energyBeams.push(beamRing);
    }

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.42, 0.08, 20),
      glassMat(0x050f1e, 0.82)
    );
    base.position.y = 0.03;
    bGroup.add(base);

    const baseGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.46, 24),
      glowMat(c, 0.14)
    );
    baseGlow.rotation.x = -Math.PI / 2;
    baseGlow.position.y = 0.06;
    bGroup.add(baseGlow);
    lightBands.push(baseGlow);
  });
}

/* =========================================================
   DATA RIVERS
========================================================= */
function createDataRivers(){
  const r1 = createRiverStream(0x27e7ff, 200, -room.halfWidth+0.6, 2.8, room.minZ, room.maxZ, 0.022);
  const r2 = createRiverStream(0xff38c8, 200, room.halfWidth-0.6, 2.5, room.maxZ, room.minZ, 0.022);
  const r3 = createRiverStream(0x4d7cff, 140, 0, 0.08, room.minZ, room.maxZ, 0.016);
  const r4 = createRiverStream(0xaaeeff, 100, 0, room.ceilingY-0.08, room.minZ, room.maxZ, 0.014);

  dataRiverParticles.push(r1, r2, r3, r4);
}

function createRiverStream(color, count, x, y, zStart, zEnd, size){
  const positions = new Float32Array(count * 3);
  const speeds    = new Float32Array(count);
  const direction = zEnd > zStart ? 1 : -1;

  for(let i=0; i<count; i++){
    positions[i*3+0] = x + rnd(-0.15, 0.15);
    positions[i*3+1] = y + rnd(-0.08, 0.08);
    positions[i*3+2] = rnd(Math.min(zStart,zEnd), Math.max(zStart,zEnd));
    speeds[i] = rnd(0.04, 0.12) * direction;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color, size, transparent:true, opacity:0.60,
    depthWrite:false, blending:THREE.AdditiveBlending
  });

  const pts = new THREE.Points(geo, mat);
  world.add(pts);
  return { pts, speeds, zStart, zEnd, direction };
}


/* =========================================================
   PORTAL — multi-ring + shader core
========================================================= */
function createPortal(){
  portalGroup = new THREE.Group();
  portalGroup.position.set(0, 2.70, -16.9);
  world.add(portalGroup);

  const portalUniforms = { uTime:{value:0} };
  shaderUniforms.push(portalUniforms);
  const portalCoreMat = new THREE.ShaderMaterial({
    uniforms: portalUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main(){
        vec2 uv = vUv * 2.0 - 1.0;
        float r = length(uv);
        if(r > 1.0) discard;
        float angle = atan(uv.y, uv.x);
        float spiral = sin(r * 14.0 - uTime * 2.8 + angle * 3.0) * 0.5 + 0.5;
        float fade = (1.0 - r) * spiral;
        vec3 col1 = vec3(0.12, 0.88, 1.0);
        vec3 col2 = vec3(1.0, 0.18, 0.76);
        vec3 col  = mix(col1, col2, r + sin(uTime*0.5)*0.3);
        gl_FragColor = vec4(col, fade * 0.32);
      }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide
  });
  const portalCore = new THREE.Mesh(new THREE.CircleGeometry(1.50, 72), portalCoreMat);
  portalGroup.add(portalCore);

  for(let i=0; i<6; i++){
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.6+i*0.28, 0.018+i*0.004, 12, 84),
      glowMat(i%2===0?0x27e7ff:0xff38c8, 0.20-i*0.018)
    );
    ring.rotation.x = i%2===0 ? Math.PI/2 : Math.PI/2.6;
    ring.userData.spin = 0.0010 + i*0.0007;
    portalGroup.add(ring);
    animatedMeshes.push(ring);
  }

  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.68, 1),
    new THREE.MeshPhysicalMaterial({
      color:0x8cf7ff,
      emissive:0x27e7ff,
      emissiveIntensity:0.95,
      metalness:0.18,
      roughness:0.06,
      transmission:0.16,
      transparent:true,
      opacity:0.95,
      clearcoat:1,
      clearcoatRoughness:0.08
    })
  );
  inner.userData.floaty=true; inner.userData.baseY=0; inner.userData.offset=0.6;
  inner.userData.spinX=0.0030; inner.userData.spinY=0.0048;
  portalGroup.add(inner);
  animatedMeshes.push(inner);

  const outerSph = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.98, 1),
    glowMat(0x27e7ff, 0.12)
  );
  outerSph.material.wireframe = true;
  outerSph.userData.floaty=true; outerSph.userData.baseY=0; outerSph.userData.offset=0.6;
  outerSph.userData.spinX=-0.0012; outerSph.userData.spinY=0.0022;
  portalGroup.add(outerSph);
  animatedMeshes.push(outerSph);

  const hexRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.055, 6, 6),
    glowMat(0x4d7cff, 0.22)
  );
  hexRing.rotation.z = Math.PI/6;
  hexRing.userData.spin = 0.0006;
  portalGroup.add(hexRing);
  animatedMeshes.push(hexRing);
}

/* =========================================================
   CENTRAL HUB
========================================================= */
function createCentralHub(){
  centralHub = new THREE.Group();
  centralHub.position.set(0, 0.86, -7.30);
  world.add(centralHub);

  const basePlat = new THREE.Mesh(
    new THREE.CylinderGeometry(1.00, 1.20, 0.12, 26),
    glassMat(0x060f1e, 0.86)
  );
  basePlat.position.y = -0.98;
  centralHub.add(basePlat);

  const baseGlow = new THREE.Mesh(
    new THREE.CircleGeometry(1.02, 32),
    glowMat(0x27e7ff, 0.12)
  );
  baseGlow.rotation.x = -Math.PI / 2;
  baseGlow.position.y = -0.91;
  centralHub.add(baseGlow);
  lightBands.push(baseGlow);

  const lowerHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.94, 0.018, 10, 60),
    glowMat(0x27e7ff, 0.14)
  );
  lowerHalo.position.y = -0.84;
  lowerHalo.rotation.x = Math.PI / 2;
  lowerHalo.userData.spin = 0.0010;
  centralHub.add(lowerHalo);
  animatedMeshes.push(lowerHalo);

  const upperDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.74, 0.10, 20),
    glassMat(0x08111f, 0.86)
  );
  upperDisc.position.y = -0.34;
  centralHub.add(upperDisc);

  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.32, 1.72, 16),
    glassMat(0x060e1c, 0.78)
  );
  col.position.y = -0.02;
  centralHub.add(col);

  const beamCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.060, 0.090, 1.62, 20),
    new THREE.MeshPhysicalMaterial({
      color:0x8cf7ff,
      emissive:0x27e7ff,
      emissiveIntensity:0.78,
      metalness:0.18,
      roughness:0.05,
      transmission:0.20,
      transparent:true,
      opacity:0.96,
      clearcoat:1
    })
  );
  beamCore.position.y = 0.00;
  centralHub.add(beamCore);

  const nodeGroup = new THREE.Group();
  nodeGroup.position.y = 0.26;
  centralHub.add(nodeGroup);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.18, 2),
    new THREE.MeshPhysicalMaterial({
      color:0x8cf7ff,
      emissive:0x27e7ff,
      emissiveIntensity:1.0,
      metalness:0.16,
      roughness:0.04,
      transmission:0.22,
      transparent:true,
      opacity:0.97,
      clearcoat:1
    })
  );
  core.userData.floaty = true;
  core.userData.baseY = 0;
  core.userData.offset = 1.2;
  nodeGroup.add(core);
  animatedMeshes.push(core);

  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.024, 16, 90),
    glowMat(0x27e7ff, 0.18)
  );
  ring1.rotation.x = Math.PI / 2;
  ring1.userData.spin = 0.0017;
  nodeGroup.add(ring1);
  animatedMeshes.push(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.022, 16, 76),
    glowMat(0x8cf7ff, 0.18)
  );
  ring2.rotation.y = Math.PI / 2;
  ring2.userData.spin = -0.0014;
  nodeGroup.add(ring2);
  animatedMeshes.push(ring2);

  const ring3 = new THREE.Mesh(
    new THREE.TorusGeometry(0.30, 0.020, 16, 80),
    glowMat(0xff72df, 0.16)
  );
  ring3.rotation.z = Math.PI / 2;
  ring3.userData.spin = 0.0012;
  nodeGroup.add(ring3);
  animatedMeshes.push(ring3);

  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.46, 1),
    glowMat(0x27e7ff, 0.10)
  );
  cage.material.wireframe = true;
  cage.userData.floaty = true;
  cage.userData.baseY = 0.26;
  cage.userData.offset = 0.8;
  cage.userData.spinX = 0.0008;
  cage.userData.spinY = 0.0018;
  centralHub.add(cage);
  animatedMeshes.push(cage);

  const orbitRingA = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.014, 10, 58),
    glowMat(0x8cf7ff, 0.16)
  );
  orbitRingA.position.y = 0.20;
  orbitRingA.rotation.x = Math.PI / 2;
  orbitRingA.userData.spin = 0.0014;
  centralHub.add(orbitRingA);
  animatedMeshes.push(orbitRingA);

  const orbitRingB = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.012, 10, 62),
    glowMat(0xff72df, 0.13)
  );
  orbitRingB.position.y = 0.16;
  orbitRingB.rotation.y = Math.PI / 2.4;
  orbitRingB.userData.spin = -0.0011;
  centralHub.add(orbitRingB);
  animatedMeshes.push(orbitRingB);

  const orbitRingC = new THREE.Mesh(
    new THREE.TorusGeometry(0.96, 0.012, 10, 66),
    glowMat(0x4d7cff, 0.11)
  );
  orbitRingC.position.y = 0.10;
  orbitRingC.rotation.x = Math.PI / 2.25;
  orbitRingC.userData.spin = 0.0008;
  centralHub.add(orbitRingC);
  animatedMeshes.push(orbitRingC);

  const orbitColors = [0x8cf7ff, 0xff72df, 0x4d7cff, 0x27e7ff];
  orbitColors.forEach((c, oi) => {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 12, 12),
      glowMat(c, 0.92)
    );
    orb.userData.orbit = true;
    orb.userData.radius = 0.54 + oi * 0.10;
    orb.userData.angle = oi * (Math.PI * 2 / orbitColors.length);
    orb.userData.speed = 0.0019 + oi * 0.0004;
    orb.userData.tiltX = Math.PI / 2 + oi * 0.26;
    orb.position.y = 0.18;
    centralHub.add(orb);
    animatedMeshes.push(orb);
  });

  for(let i = 0; i < 4; i++){
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.54, 0.020),
      metalMat(0x0b1624, i % 2 === 0 ? 0x27e7ff : 0xff72df, 0.10)
    );
    const ang = i * (Math.PI / 2);
    fin.position.set(Math.cos(ang) * 0.30, -0.08, Math.sin(ang) * 0.30);
    fin.rotation.y = ang;
    centralHub.add(fin);
  }

  [-1, 1].forEach(side => {
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.58, 0.06),
      metalMat(0x08121f, side < 0 ? 0x27e7ff : 0xff72df, 0.08)
    );
    brace.position.set(side * 0.24, -0.46, 0);
    brace.rotation.z = side * 0.22;
    centralHub.add(brace);
  });
}


function createTesseract(){
  const tGroup = new THREE.Group();
  tGroup.position.set(0, 2.15, -10.5);
  world.add(tGroup);

  const outerSize = 1.15;
  const innerSize = 0.62;
  const outerHalf = outerSize / 2;
  const innerHalf = innerSize / 2;

  const outerVerts = [
    new THREE.Vector3(-outerHalf, -outerHalf, -outerHalf),
    new THREE.Vector3( outerHalf, -outerHalf, -outerHalf),
    new THREE.Vector3( outerHalf,  outerHalf, -outerHalf),
    new THREE.Vector3(-outerHalf,  outerHalf, -outerHalf),
    new THREE.Vector3(-outerHalf, -outerHalf,  outerHalf),
    new THREE.Vector3( outerHalf, -outerHalf,  outerHalf),
    new THREE.Vector3( outerHalf,  outerHalf,  outerHalf),
    new THREE.Vector3(-outerHalf,  outerHalf,  outerHalf)
  ];

  const innerVerts = [
    new THREE.Vector3(-innerHalf, -innerHalf, -innerHalf),
    new THREE.Vector3( innerHalf, -innerHalf, -innerHalf),
    new THREE.Vector3( innerHalf,  innerHalf, -innerHalf),
    new THREE.Vector3(-innerHalf,  innerHalf, -innerHalf),
    new THREE.Vector3(-innerHalf, -innerHalf,  innerHalf),
    new THREE.Vector3( innerHalf, -innerHalf,  innerHalf),
    new THREE.Vector3( innerHalf,  innerHalf,  innerHalf),
    new THREE.Vector3(-innerHalf,  innerHalf,  innerHalf)
  ];

  const cubeEdges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7]
  ];

  function addLine(a, b, color, opacity = 0.9){
    const pts = [a, b];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const line = new THREE.Line(geo, mat);
    line.renderOrder = 12;
    tGroup.add(line);
    tesseractParts.push(line);
  }

  cubeEdges.forEach(([i, j]) => {
    addLine(outerVerts[i], outerVerts[j], 0x27e7ff, 0.95);
    addLine(innerVerts[i], innerVerts[j], 0xff38c8, 0.95);
    addLine(outerVerts[i], innerVerts[i], 0xffffff, 0.55);
  });

  outerVerts.forEach(v => {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      glowMat(0x27e7ff, 0.95)
    );
    p.position.copy(v);
    p.material.depthTest = false;
    p.renderOrder = 13;
    tGroup.add(p);
    tesseractParts.push(p);
  });

  innerVerts.forEach(v => {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 12),
      glowMat(0xff38c8, 0.95)
    );
    p.position.copy(v);
    p.material.depthTest = false;
    p.renderOrder = 13;
    tGroup.add(p);
    tesseractParts.push(p);
  });

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 18, 18),
    glowMat(0xffffff, 0.26)
  );
  coreGlow.material.depthTest = false;
  coreGlow.renderOrder = 13;
  tGroup.add(coreGlow);
  tesseractParts.push(coreGlow);

  const orbit1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.012, 12, 72),
    glowMat(0x27e7ff, 0.34)
  );
  orbit1.rotation.x = Math.PI / 2.1;
  orbit1.material.depthTest = false;
  orbit1.renderOrder = 11;
  tGroup.add(orbit1);
  tesseractParts.push(orbit1);

  const orbit2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.010, 12, 72),
    glowMat(0xff38c8, 0.30)
  );
  const halo1 = new THREE.Mesh(
  new THREE.TorusGeometry(1.28, 0.022, 16, 96),
  glowMat(0x27e7ff, 0.16)
);
halo1.rotation.x = Math.PI / 2;
halo1.material.depthTest = false;
halo1.renderOrder = 10;
tGroup.add(halo1);
tesseractParts.push(halo1);

const halo2 = new THREE.Mesh(
  new THREE.TorusGeometry(1.18, 0.018, 16, 96),
  glowMat(0xff38c8, 0.12)
);
halo2.rotation.y = Math.PI / 2.25;
halo2.rotation.x = Math.PI / 4;
halo2.material.depthTest = false;
halo2.renderOrder = 10;
tGroup.add(halo2);
tesseractParts.push(halo2);

for(let i = 0; i < 24; i++){
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.022 + Math.random() * 0.012, 10, 10),
    glowMat(i % 2 === 0 ? 0x27e7ff : 0xff38c8, 0.85)
  );

  p.material.depthTest = false;
  p.renderOrder = 14;

  p.userData.radius = 1.05 + Math.random() * 0.45;
  p.userData.angle  = Math.random() * Math.PI * 2;
  p.userData.speed  = 0.004 + Math.random() * 0.006;
  p.userData.yBase  = (Math.random() - 0.5) * 0.9;
  p.userData.yAmp   = 0.06 + Math.random() * 0.10;
  p.userData.phase  = Math.random() * Math.PI * 2;

  p.position.set(
    Math.cos(p.userData.angle) * p.userData.radius,
    p.userData.yBase,
    Math.sin(p.userData.angle) * p.userData.radius
  );

  tGroup.add(p);
  tesseractOrbiters.push(p);
}
  orbit2.rotation.y = Math.PI / 2.5;
  orbit2.rotation.x = Math.PI / 6;
  orbit2.material.depthTest = false;
  orbit2.renderOrder = 11;
  tGroup.add(orbit2);
  tesseractParts.push(orbit2);

  tGroup.userData.orbit1 = orbit1;
tGroup.userData.orbit2 = orbit2;
tGroup.userData.halo1  = halo1;
tGroup.userData.halo2  = halo2;

  tesseractParts.push(tGroup);
}

/* =========================================================
   MINI TESSERACTS — Dos mini-teseractos (azul + morado)
   Réplica exacta del createTesseract grande, pero pequeños.
========================================================= */
function createMiniTesseract(posX, posY, posZ, outerColor, innerColor, storeId){
  const tGroup = new THREE.Group();
  tGroup.position.set(posX, posY, posZ);
  tGroup.userData.baseY = posY;
  tGroup.userData.storeId = storeId;
  world.add(tGroup);

  const outerSize = 0.58;
  const innerSize = 0.31;
  const outerHalf = outerSize / 2;
  const innerHalf = innerSize / 2;

  const outerVerts = [
    new THREE.Vector3(-outerHalf, -outerHalf, -outerHalf),
    new THREE.Vector3( outerHalf, -outerHalf, -outerHalf),
    new THREE.Vector3( outerHalf,  outerHalf, -outerHalf),
    new THREE.Vector3(-outerHalf,  outerHalf, -outerHalf),
    new THREE.Vector3(-outerHalf, -outerHalf,  outerHalf),
    new THREE.Vector3( outerHalf, -outerHalf,  outerHalf),
    new THREE.Vector3( outerHalf,  outerHalf,  outerHalf),
    new THREE.Vector3(-outerHalf,  outerHalf,  outerHalf)
  ];

  const innerVerts = [
    new THREE.Vector3(-innerHalf, -innerHalf, -innerHalf),
    new THREE.Vector3( innerHalf, -innerHalf, -innerHalf),
    new THREE.Vector3( innerHalf,  innerHalf, -innerHalf),
    new THREE.Vector3(-innerHalf,  innerHalf, -innerHalf),
    new THREE.Vector3(-innerHalf, -innerHalf,  innerHalf),
    new THREE.Vector3( innerHalf, -innerHalf,  innerHalf),
    new THREE.Vector3( innerHalf,  innerHalf,  innerHalf),
    new THREE.Vector3(-innerHalf,  innerHalf,  innerHalf)
  ];

  const cubeEdges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7]
  ];

  function addLine(a, b, color, opacity){
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const line = new THREE.Line(geo, mat);
    line.renderOrder = 12;
    tGroup.add(line);
    miniTesseractParts.push(line);
  }

  cubeEdges.forEach(([i, j]) => {
    addLine(outerVerts[i], outerVerts[j], outerColor, 0.95);
    addLine(innerVerts[i], innerVerts[j], innerColor, 0.95);
    addLine(outerVerts[i], innerVerts[i], 0xffffff, 0.55);
  });

  outerVerts.forEach(v => {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 12, 12),
      glowMat(outerColor, 0.95)
    );
    p.position.copy(v);
    p.material.depthTest = false;
    p.renderOrder = 13;
    tGroup.add(p);
    miniTesseractParts.push(p);
  });

  innerVerts.forEach(v => {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 12, 12),
      glowMat(innerColor, 0.95)
    );
    p.position.copy(v);
    p.material.depthTest = false;
    p.renderOrder = 13;
    tGroup.add(p);
    miniTesseractParts.push(p);
  });

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 18, 18),
    glowMat(0xffffff, 0.26)
  );
  coreGlow.material.depthTest = false;
  coreGlow.renderOrder = 13;
  tGroup.add(coreGlow);
  miniTesseractParts.push(coreGlow);

  const orbit1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.51, 0.008, 12, 72),
    glowMat(outerColor, 0.34)
  );
  orbit1.rotation.x = Math.PI / 2.1;
  orbit1.material.depthTest = false;
  orbit1.renderOrder = 11;
  tGroup.add(orbit1);
  miniTesseractParts.push(orbit1);

  const orbit2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.43, 0.007, 12, 72),
    glowMat(innerColor, 0.30)
  );
  orbit2.rotation.y = Math.PI / 2.5;
  orbit2.rotation.x = Math.PI / 6;
  orbit2.material.depthTest = false;
  orbit2.renderOrder = 11;
  tGroup.add(orbit2);
  miniTesseractParts.push(orbit2);

  const halo1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.014, 16, 96),
    glowMat(outerColor, 0.16)
  );
  halo1.rotation.x = Math.PI / 2;
  halo1.material.depthTest = false;
  halo1.renderOrder = 10;
  tGroup.add(halo1);
  miniTesseractParts.push(halo1);

  const halo2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.59, 0.012, 16, 96),
    glowMat(innerColor, 0.12)
  );
  halo2.rotation.y = Math.PI / 2.25;
  halo2.rotation.x = Math.PI / 4;
  halo2.material.depthTest = false;
  halo2.renderOrder = 10;
  tGroup.add(halo2);
  miniTesseractParts.push(halo2);

  for(let i = 0; i < 24; i++){
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.012 + Math.random() * 0.008, 10, 10),
      glowMat(i % 2 === 0 ? outerColor : innerColor, 0.85)
    );
    p.material.depthTest = false;
    p.renderOrder = 14;

    p.userData.radius = 0.53 + Math.random() * 0.22;
    p.userData.angle  = Math.random() * Math.PI * 2;
    p.userData.speed  = 0.004 + Math.random() * 0.006;
    p.userData.yBase  = (Math.random() - 0.5) * 0.45;
    p.userData.yAmp   = 0.03 + Math.random() * 0.05;
    p.userData.phase  = Math.random() * Math.PI * 2;

    p.position.set(
      Math.cos(p.userData.angle) * p.userData.radius,
      p.userData.yBase,
      Math.sin(p.userData.angle) * p.userData.radius
    );

    tGroup.add(p);
    miniTesseractOrbiters.push(p);
  }

  tGroup.userData.orbit1 = orbit1;
  tGroup.userData.orbit2 = orbit2;
  tGroup.userData.halo1  = halo1;
  tGroup.userData.halo2  = halo2;

  miniTesseractParts.push(tGroup);
}

function createMiniTesseracts(){
  /* Izquierda azul, derecha morado, detrás del primer panel */
  createMiniTesseract(-2.95, 2.15, -7.25, 0x4d7cff, 0x7fb5ff, "left");
  createMiniTesseract( 2.95, 2.15, -7.25, 0xa970ff, 0x7c3aed, "right");
}

/* =========================================================
   REAR PLATFORM
========================================================= */
function createRearPlatform(){
  const plat = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.16, 1.55), glassMat(0x060f1e, 0.76));
  plat.position.set(0, 0.14, -13.7);
  world.add(plat);

  const platGlow = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.9), glowMat(0x27e7ff, 0.09));
  platGlow.rotation.x = -Math.PI/2;
  platGlow.position.set(0, 0.23, -13.7);
  world.add(platGlow);
  lightBands.push(platGlow);
}

/* =========================================================
   PARTICLES
========================================================= */
function createParticles(){
  orbSpriteTexture = makeGradientSpriteTexture("orb");
  streakSpriteTexture = makeGradientSpriteTexture("streak");

  /* Ambient particles */
  const ambCount = 1600;
  const ambPos = new Float32Array(ambCount * 3);
  const ambCol = new Float32Array(ambCount * 3);
  const ambVel = new Float32Array(ambCount);
  const ambPhase = new Float32Array(ambCount);
  const palette = [new THREE.Color(0x8cf7ff), new THREE.Color(0x27e7ff), new THREE.Color(0xff72df), new THREE.Color(0x4d7cff), new THREE.Color(0xa970ff)];
  for(let i=0; i<ambCount; i++){
    ambPos[i*3+0] = rnd(-6.8, 6.8);
    ambPos[i*3+1] = rnd(0.3, 5.2);
    ambPos[i*3+2] = rnd(room.minZ-1, room.maxZ+1);
    const c = palette[Math.floor(Math.random()*palette.length)];
    ambCol[i*3+0] = c.r;
    ambCol[i*3+1] = c.g;
    ambCol[i*3+2] = c.b;
    ambVel[i] = rnd(0.0012, 0.0048);
    ambPhase[i] = rnd(0, Math.PI * 2);
  }
  const ambGeo = new THREE.BufferGeometry();
  ambGeo.setAttribute("position", new THREE.BufferAttribute(ambPos, 3));
  ambGeo.setAttribute("color", new THREE.BufferAttribute(ambCol, 3));
  ambientParticles = new THREE.Points(ambGeo, new THREE.PointsMaterial({
    map:orbSpriteTexture,
    color:0xffffff,
    vertexColors:true,
    size:0.064,
    sizeAttenuation:true,
    transparent:true,
    opacity:0.46,
    alphaTest:0.02,
    depthWrite:false,
    blending:THREE.AdditiveBlending
  }));
  ambientParticles.userData.velocities = ambVel;
  ambientParticles.userData.phases = ambPhase;
  world.add(ambientParticles);

  /* Foreground dust */
  const dustCount = 380;
  const dustPos = new Float32Array(dustCount * 3);
  const dustVel = new Float32Array(dustCount);
  for(let i=0; i<dustCount; i++){
    dustPos[i*3+0] = rnd(-5.2, 5.2);
    dustPos[i*3+1] = rnd(0.4, 4.5);
    dustPos[i*3+2] = rnd(room.minZ, room.maxZ);
    dustVel[i] = rnd(0.004, 0.010);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  foregroundDust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map:orbSpriteTexture,
    color:0xdff9ff,
    size:0.032,
    sizeAttenuation:true,
    transparent:true,
    opacity:0.22,
    alphaTest:0.02,
    depthWrite:false,
    blending:THREE.AdditiveBlending
  }));
  foregroundDust.userData.velocities = dustVel;
  world.add(foregroundDust);

  /* Sparks */
  const sparkCount = 220;
  const sparkPos = new Float32Array(sparkCount * 3);
  const sparkVel = new Float32Array(sparkCount);
  for(let i=0; i<sparkCount; i++){
    sparkPos[i*3+0] = rnd(-room.halfWidth+1, room.halfWidth-1);
    sparkPos[i*3+1] = rnd(0, 5.0);
    sparkPos[i*3+2] = rnd(room.minZ+1, room.maxZ-1);
    sparkVel[i] = rnd(0.010, 0.028);
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  sparkSystem = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    map:streakSpriteTexture,
    color:0xf7ffff,
    size:0.12,
    sizeAttenuation:true,
    transparent:true,
    opacity:0.66,
    alphaTest:0.02,
    depthWrite:false,
    blending:THREE.AdditiveBlending
  }));
  sparkSystem.userData.velocities = sparkVel;
  world.add(sparkSystem);

  /* Ceiling drip */
  const dripCount = 140;
  const dripPos = new Float32Array(dripCount * 3);
  const dripVel = new Float32Array(dripCount);
  for(let i=0; i<dripCount; i++){
    dripPos[i*3+0] = rnd(-room.halfWidth+0.5, room.halfWidth-0.5);
    dripPos[i*3+1] = rnd(0.5, room.ceilingY);
    dripPos[i*3+2] = rnd(room.minZ, room.maxZ);
    dripVel[i] = rnd(0.008, 0.018);
  }
  const dripGeo = new THREE.BufferGeometry();
  dripGeo.setAttribute("position", new THREE.BufferAttribute(dripPos, 3));
  ceilingDrip = new THREE.Points(dripGeo, new THREE.PointsMaterial({
    map:streakSpriteTexture,
    color:0x8cf7ff,
    size:0.11,
    sizeAttenuation:true,
    transparent:true,
    opacity:0.36,
    alphaTest:0.02,
    depthWrite:false,
    blending:THREE.AdditiveBlending
  }));
  ceilingDrip.userData.velocities = dripVel;
  world.add(ceilingDrip);

  /* Light currents */
  const currentSpecs = [
    { color:0x27e7ff, count:160, x:-room.halfWidth+0.45, y:2.7, zStart:room.minZ, zEnd:room.maxZ, ampX:0.12, ampY:0.55, size:0.08 },
    { color:0xff38c8, count:160, x: room.halfWidth-0.45, y:2.45, zStart:room.maxZ, zEnd:room.minZ, ampX:0.12, ampY:0.52, size:0.08 },
    { color:0xaaeeff, count:120, x:0, y:room.ceilingY-0.18, zStart:room.minZ, zEnd:room.maxZ, ampX:0.34, ampY:0.08, size:0.07 }
  ];
  currentSpecs.forEach(spec => {
    const positions = new Float32Array(spec.count * 3);
    const speeds = new Float32Array(spec.count);
    const phases = new Float32Array(spec.count);
    const zMin = Math.min(spec.zStart, spec.zEnd);
    const zMax = Math.max(spec.zStart, spec.zEnd);
    const direction = spec.zEnd > spec.zStart ? 1 : -1;
    for(let i=0; i<spec.count; i++){
      positions[i*3+0] = spec.x + rnd(-spec.ampX, spec.ampX);
      positions[i*3+1] = spec.y + rnd(-spec.ampY, spec.ampY);
      positions[i*3+2] = rnd(zMin, zMax);
      speeds[i] = rnd(0.035, 0.095) * direction;
      phases[i] = rnd(0, Math.PI * 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      map:streakSpriteTexture,
      color:spec.color,
      size:spec.size,
      sizeAttenuation:true,
      transparent:true,
      opacity:0.48,
      alphaTest:0.02,
      depthWrite:false,
      blending:THREE.AdditiveBlending
    }));
    pts.userData = { speeds, phases, spec, zMin, zMax, direction };
    world.add(pts);
    lightCurrents.push(pts);
  });

  /* Reflection flashes */
  const flashLayout = [
    { x:-3.8, y:0.03, z:-6.8, rx:-Math.PI/2, ry:0, sx:0.84, sy:0.26, c:0x27e7ff, o:0.0 },
    { x: 3.8, y:0.03, z:-6.8, rx:-Math.PI/2, ry:0, sx:0.84, sy:0.26, c:0xff38c8, o:0.4 },
    { x:-3.6, y:0.03, z:-10.8, rx:-Math.PI/2, ry:0, sx:0.92, sy:0.28, c:0xff38c8, o:0.8 },
    { x: 3.6, y:0.03, z:-10.8, rx:-Math.PI/2, ry:0, sx:0.92, sy:0.28, c:0x27e7ff, o:1.2 },
    { x: 0.0, y:0.03, z:-13.8, rx:-Math.PI/2, ry:0, sx:1.34, sy:0.36, c:0x8cf7ff, o:1.6 },
    { x:-5.35, y:2.2, z:-9.0, rx:0, ry:Math.PI/2, sx:0.62, sy:1.24, c:0x27e7ff, o:2.3 },
    { x: 5.35, y:2.2, z:-9.0, rx:0, ry:-Math.PI/2, sx:0.62, sy:1.24, c:0xff38c8, o:3.1 }
  ];
  flashLayout.forEach(f => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(f.sx, f.sy), glowMat(f.c, 0.08));
    mesh.position.set(f.x, f.y, f.z);
    mesh.rotation.set(f.rx, f.ry, 0);
    mesh.userData.baseScaleX = f.sx;
    mesh.userData.baseScaleY = f.sy;
    mesh.userData.offset = f.o;
    world.add(mesh);
    reflectionFlashes.push(mesh);
  });
}

/* =========================================================
   ATMOSPHERIC FX
========================================================= */
function createAtmosphericFX(){
  /* Volumetric veils — symmetric */
  const veilSpecs = [
    { x:-1.60, y:2.40, z:-7.0,  w:1.10, h:3.4, c:0x27e7ff, rx:0.0,  ry: 0.10, o:0.08 },
    { x: 1.60, y:2.40, z:-7.0,  w:1.10, h:3.4, c:0xff38c8, rx:0.0,  ry:-0.10, o:0.08 },
    { x: 0.00, y:2.70, z:-12.0, w:1.50, h:4.0, c:0x8cf7ff, rx:0.0,  ry: 0.00, o:0.06 }
  ];

  veilSpecs.forEach((v, i) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(v.w, v.h),
      glowMat(v.c, v.o)
    );
    mesh.position.set(v.x, v.y, v.z);
    mesh.rotation.set(v.rx, v.ry, 0);
    mesh.userData.baseOpacity = v.o;
    mesh.userData.baseY = v.y;
    mesh.userData.offset = i * 0.8;
    mesh.userData.floatAmp = 0.14;
    world.add(mesh);
    volumetricVeils.push(mesh);
  });

  /* Wall energy sheets — symmetric */
  const sheetSpecs = [
    { x:-5.34, y:2.55, z:-7.0,  w:0.60, h:2.50, c:0x27e7ff, ry: Math.PI/2,  o:0.06 },
    { x:-5.34, y:2.15, z:-11.8, w:0.60, h:2.20, c:0x4d7cff, ry: Math.PI/2,  o:0.05 },
    { x: 5.34, y:2.55, z:-7.0,  w:0.60, h:2.50, c:0xff38c8, ry:-Math.PI/2, o:0.06 },
    { x: 5.34, y:2.15, z:-11.8, w:0.60, h:2.20, c:0x8cf7ff, ry:-Math.PI/2, o:0.05 }
  ];

  sheetSpecs.forEach((s, i) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(s.w, s.h),
      glowMat(s.c, s.o)
    );
    mesh.position.set(s.x, s.y, s.z);
    mesh.rotation.y = s.ry;
    mesh.userData.baseOpacity = s.o;
    mesh.userData.offset = i * 0.9;
    mesh.userData.baseScaleY = 1;
    world.add(mesh);
    wallEnergySheets.push(mesh);
  });

  /* Floor sweep bands */
  const sweepSpecs = [
    { x:0, z:-6.2,  w:5.0, h:0.58, c:0x27e7ff, o:0.040 },
    { x:0, z:-10.8, w:5.6, h:0.72, c:0xff38c8, o:0.032 },
    { x:0, z:-14.4, w:4.6, h:0.62, c:0x8cf7ff, o:0.028 }
  ];

  sweepSpecs.forEach((s, i) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(s.w, s.h),
      glowMat(s.c, s.o)
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(s.x, 0.024, s.z);
    mesh.userData.baseOpacity = s.o;
    mesh.userData.baseScaleX = 1;
    mesh.userData.baseScaleY = 1;
    mesh.userData.offset = i * 1.1;
    world.add(mesh);
    floorSweepBands.push(mesh);
  });

  /* Ambient halos */
  const haloSpecs = [
    { x:-2.8, y:3.2, z:-14.4, r:0.98, c:0x27e7ff, o:0.08 },
    { x: 2.8, y:3.2, z:-14.4, r:0.98, c:0xff38c8, o:0.08 },
    { x: 0.0, y:4.2, z:-16.3, r:1.24, c:0x8cf7ff, o:0.06 }
  ];

  haloSpecs.forEach((h, i) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(h.r, 20, 20),
      glowMat(h.c, h.o)
    );
    mesh.position.set(h.x, h.y, h.z);
    mesh.userData.baseY = h.y;
    mesh.userData.baseOpacity = h.o;
    mesh.userData.offset = i * 1.2;
    world.add(mesh);
    ambientHaloOrbs.push(mesh);
  });
}


/* =========================================================
   CSS3D PANELS
========================================================= */
function createCSS3DPanels(){
  panelStage.style.display = "none";

  panelAnchors.forEach(item => {
    const panelWorldGroup = new THREE.Group();
    panelWorldGroup.position.copy(item.anchor.position);
    panelWorldGroup.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      item.facing.clone().normalize()
    );

    const wrapper = document.createElement("div");
    wrapper.style.width = `${item.pixelWidth}px`;
    wrapper.style.background = "transparent";
    wrapper.style.transformStyle = "preserve-3d";
    wrapper.style.pointerEvents = "none";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";

    item.element.style.position = "relative";
    item.element.style.top = "0";
    item.element.style.left = "0";
    item.element.style.margin = "0";
    item.element.style.transform = "none";
    item.element.style.width = `${item.pixelWidth}px`;
    item.element.style.visibility = "visible";
    item.element.style.opacity = "1";
    item.element.style.pointerEvents = "auto";
    item.element.style.willChange = "auto";
    item.element.style.transformOrigin = "center center";
    item.element.style.transition = "none";

    wrapper.appendChild(item.element);

    const cssObject = new CSS3DObject(wrapper);
    cssObject.position.z = (item.size.d || 0.18) * 0.70;
    cssObject.scale.setScalar(item.cssScale);

    panelWorldGroup.add(cssObject);
    cssScene.add(panelWorldGroup);

    item.cssGroup = panelWorldGroup;
    item.cssObject = cssObject;
    item.cssWrapper = wrapper;
    item.baseCssScale = item.cssScale;
  });
}

function updatePanelPositions(){
  const camWorld = new THREE.Vector3();
  camera.getWorldPosition(camWorld);

  panelAnchors.forEach(item => {
    if(!item.cssGroup || !item.cssObject) return;

    if(state.modalOpen){
      item.cssObject.visible = false;
      item.element.style.pointerEvents = "none";
      item.basePanelAlpha = 0;
      item.element.style.opacity = "0";
      return;
    }

    const anchorWorld = new THREE.Vector3();
    item.cssGroup.getWorldPosition(anchorWorld);

    const toCamera = camWorld.clone().sub(anchorWorld).normalize();
    const facing = item.facing.clone().normalize();
    const frontness = facing.dot(toCamera);

    const visible = state.mode !== "menu" && frontness > 0.035;
    const alpha = clamp((frontness - 0.035) / 0.965, 0, 1);

    item.cssObject.visible = visible;
    item.element.style.pointerEvents = visible ? "auto" : "none";
    item.basePanelAlpha = alpha;
    item.element.style.opacity = String(alpha);
  });
}

/* =========================================================
   EVENTS
========================================================= */
function setupEvents(){
  enterRoomBtn.addEventListener("click", () => enterExperience());
  assetModalClose?.addEventListener("click", () => closeAssetModal());
  assetModal?.addEventListener("click", e=>{ if(e.target===assetModal) closeAssetModal(); });

  document.addEventListener("keydown", e=>{
    if(e.code==="Escape"){
      e.preventDefault();
      assetModal.classList.contains("is-open") ? closeAssetModal() : showMenu();
      return;
    }
    if(state.mode!=="experience") return;
    const tag = document.activeElement?.tagName;
    const typing = tag==="INPUT"||tag==="TEXTAREA"||tag==="BUTTON"||tag==="VIDEO"||tag==="IFRAME";
    if(typing) return;

    if(e.code==="KeyW") moveState.forward=true;
    if(e.code==="KeyS") moveState.backward=true;
    if(e.code==="KeyA") moveState.left=true;
    if(e.code==="KeyD") moveState.right=true;
    if(e.code==="ShiftLeft"||e.code==="ShiftRight") moveState.sprint=true;
  });

  document.addEventListener("keyup", e=>{
    if(e.code==="KeyW") moveState.forward=false;
    if(e.code==="KeyS") moveState.backward=false;
    if(e.code==="KeyA") moveState.left=false;
    if(e.code==="KeyD") moveState.right=false;
    if(e.code==="ShiftLeft"||e.code==="ShiftRight") moveState.sprint=false;
  });

  window.addEventListener("pointerdown", e=>{
    if(state.mode!=="experience") return;
    if(e.button!==0) return;
    if(hitsUI(e)){
      state.dragging=false;
      updateCursor();
      return;
    }
    state.dragging=true;
    state.lastMouseX=e.clientX;
    state.lastMouseY=e.clientY;
    updateCursor();
  }, true);

  window.addEventListener("pointerup", ()=>{
    state.dragging=false;
    updateCursor();
  });

  window.addEventListener("pointermove", e=>{
    if(state.mode!=="experience" || !state.dragging) return;

    const dx = e.clientX - state.lastMouseX;
    const dy = e.clientY - state.lastMouseY;

    /* Inverted drag */
    state.yaw += dx * 0.003;
    state.pitch += dy * 0.00215;

    state.pitch = clamp(state.pitch, -0.76, 0.44);

    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
  });

  window.addEventListener("blur", ()=>{
    state.dragging=false;
    stopMovement();
    updateCursor();
  });
}

/* =========================================================
   MOVEMENT
========================================================= */
function updateMovement(delta){
  if(state.mode !== "experience"){
    velocity.lerp(new THREE.Vector3(), Math.min(1, delta * 8));
    state.bobOffset += (0 - state.bobOffset) * Math.min(1, delta * 8);
    state.strafeTilt += (0 - state.strafeTilt) * Math.min(1, delta * 8);
    state.forwardTilt += (0 - state.forwardTilt) * Math.min(1, delta * 8);
    return;
  }

  const typing = isTyping(document.activeElement);
  let ix = 0;
  let iz = 0;

  if(!typing){
    ix = Number(moveState.right) - Number(moveState.left);
    iz = Number(moveState.forward) - Number(moveState.backward);
  }

  const hasInput = ix !== 0 || iz !== 0;
  const moveLen = Math.hypot(ix, iz) || 1;
  ix /= moveLen;
  iz /= moveLen;

  const walkSpeed = moveState.sprint ? 5.3 : 3.8;
  const accel = hasInput ? (moveState.sprint ? 7.5 : 6.6) : 5.5;
  const damping = hasInput ? 5.2 : 7.8;

  moveForward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  moveRight.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));

  moveTarget.set(0, 0, 0);
  if(hasInput){
    moveTarget
      .addScaledVector(moveRight, ix * walkSpeed)
      .addScaledVector(moveForward, iz * walkSpeed);
  }

  velocity.lerp(moveTarget, Math.min(1, delta * accel));
  if(!hasInput){
    velocity.multiplyScalar(Math.max(0, 1 - delta * damping));
  }

  camera.position.addScaledVector(velocity, delta);

  camera.position.x = clamp(camera.position.x, -room.halfWidth + 0.52, room.halfWidth - 0.52);
  camera.position.z = clamp(camera.position.z, room.minZ + 0.9, room.maxZ - 0.48);

  const planarSpeed = Math.hypot(velocity.x, velocity.z);
  const normalizedSpeed = clamp(planarSpeed / walkSpeed, 0, 1);

  if(planarSpeed > 0.03){
    state.walkBob += delta * (moveState.sprint ? 10.5 : 7.4) * (0.55 + normalizedSpeed * 0.9);
  }

  const bobStrength = (moveState.sprint ? 0.020 : 0.013) * normalizedSpeed;
  const bob =
    Math.sin(state.walkBob) * bobStrength +
    Math.abs(Math.cos(state.walkBob * 0.5)) * bobStrength * 0.42;

  state.bobOffset += (bob - state.bobOffset) * Math.min(1, delta * 10);

  const targetStrafeTilt = clamp(-ix * (moveState.sprint ? 0.040 : 0.026) * (0.4 + normalizedSpeed), -0.055, 0.055);
  state.strafeTilt += (targetStrafeTilt - state.strafeTilt) * Math.min(1, delta * 7.5);

  const targetForwardTilt = clamp(-iz * 0.010 * normalizedSpeed, -0.014, 0.014);
  state.forwardTilt += (targetForwardTilt - state.forwardTilt) * Math.min(1, delta * 6.5);

  const targetY = 1.82 + state.bobOffset;
  camera.position.y += (targetY - camera.position.y) * Math.min(1, delta * 10);

  if(hudCoords){
    hudCoords.textContent = `X: ${camera.position.x.toFixed(2)}\u00a0\u00a0 Z: ${camera.position.z.toFixed(2)}`;
  }
}

function updateCamera(){
  if(state.mode === "menu"){
    camera.position.lerp(new THREE.Vector3(-0.42, 1.82, 3.05), 0.08);
    camera.lookAt(new THREE.Vector3(0, 1.82, -7.8));
    camera.rotation.z = 0;
    return;
  }

  if(state.mode === "transition" && cinematic.active){
    const now = clock.getElapsedTime();
    const rawT = (now - cinematic.start) / cinematic.duration;
    const t = clamp(rawT, 0, 1);
    const eased = easeInOutCubic(t);

    camera.position.lerpVectors(cinematic.fromPos, cinematic.toPos, eased);

    const lookTarget = new THREE.Vector3().lerpVectors(
      cinematic.fromLook,
      cinematic.toLook,
      eased
    );
    lookTarget.y = camera.position.y;
    camera.lookAt(lookTarget);
    camera.rotation.z = 0;

    if(t >= 1){
      cinematic.active = false;

      const finalAngles = getYawPitchFromLook(cinematic.toPos, cinematic.toLook);
      state.yaw = finalAngles.yaw;
      state.pitch = 0;

      camera.position.copy(cinematic.toPos);
      camera.rotation.order = "YXZ";
      camera.rotation.y = state.yaw;
      camera.rotation.x = 0;
      camera.rotation.z = 0;

      state.mode = "experience";
    }

    return;
  }

  camera.rotation.order = "YXZ";
  camera.rotation.y = state.yaw;
  camera.rotation.x = state.pitch + state.forwardTilt;
  camera.rotation.z = state.strafeTilt;
}

/* =========================================================
   WORLD ANIMATION
========================================================= */
function animateWorld(elapsed){
  shaderUniforms.forEach(u => { if(u.uTime) u.uTime.value = elapsed; });
  if(cinematicPass.uniforms.uTime) cinematicPass.uniforms.uTime.value = elapsed;

  if(portalGroup){
    portalGroup.rotation.z += 0.0007;
    portalGroup.position.y = 2.70 + Math.sin(elapsed*0.75)*0.040;
  }

  if(centralHub){
    centralHub.rotation.y += 0.0014;
    centralHub.position.y = 1.30 + Math.sin(elapsed*1.0)*0.016;
  }


  animatedMeshes.forEach((mesh, index) => {
    if(mesh.userData.orbit){
      mesh.userData.angle = (mesh.userData.angle||0) + mesh.userData.speed;
      const r = mesh.userData.radius;
      const tilt = mesh.userData.tiltX;
      mesh.position.x = Math.cos(mesh.userData.angle) * r;
      mesh.position.y = Math.sin(mesh.userData.angle) * r * Math.sin(tilt);
      mesh.position.z = Math.sin(mesh.userData.angle) * r * Math.cos(tilt);
    }
    else if(mesh.userData.spin){
      mesh.rotation.z += mesh.userData.spin;
      mesh.rotation.y += 0.00030 + index*0.000015;
    }
    if(mesh.userData.floaty){
      const bY = mesh.userData.baseY||0;
      const off= mesh.userData.offset||index;
      mesh.position.y = bY + Math.sin(elapsed*1.0+off)*0.080;
      mesh.rotation.x += mesh.userData.spinX||0.0016;
      mesh.rotation.y += mesh.userData.spinY||0.0028;
    }
  });

  dnaHelices.forEach((h, hi) => {
    h.rotation.y = elapsed * (hi===0?0.12:-0.12);
    h.position.y = Math.sin(elapsed*0.6+hi)*0.04;
  });

  neuralData.forEach(nd => {
    nd.base.forEach((pos, i) => {
      const dummy2 = new THREE.Object3D();
      dummy2.position.set(
        pos.x + Math.sin(elapsed*0.7+i*0.4)*0.08,
        pos.y + Math.sin(elapsed*1.1+i*0.6)*0.10,
        pos.z + Math.cos(elapsed*0.5+i*0.3)*0.06
      );
      dummy2.updateMatrix();
      nd.inst.setMatrixAt(i, dummy2.matrix);
    });
    nd.inst.instanceMatrix.needsUpdate = true;
  });

  energyBeams.forEach(ring => {
    ring.position.y = ring.userData.baseY + Math.sin(elapsed*1.4+ring.userData.offset)*0.18 + elapsed*0.015 % 3.5;
    ring.rotation.z += ring.userData.speed;
    if(ring.position.y > 4.2) ring.position.y = 0.55;
  });

  tesseractParts.forEach(obj => {
  if(obj.type === "Group"){
    obj.rotation.x = elapsed * 0.35;
    obj.rotation.y = elapsed * 0.52;
    obj.rotation.z = Math.sin(elapsed * 0.7) * 0.12;
    obj.position.y = 2.15 + Math.sin(elapsed * 1.2) * 0.08;

    if(obj.userData.orbit1) obj.userData.orbit1.rotation.z += 0.010;
    if(obj.userData.orbit2) obj.userData.orbit2.rotation.x += 0.012;

    if(obj.userData.halo1) obj.userData.halo1.rotation.z -= 0.006;
    if(obj.userData.halo2) obj.userData.halo2.rotation.y += 0.008;
  }
});

tesseractOrbiters.forEach((p, i) => {
  p.userData.angle += p.userData.speed;

  p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
  p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
  p.position.y = p.userData.yBase + Math.sin(elapsed * 2.2 + p.userData.phase) * p.userData.yAmp;

  const pulse = 0.72 + Math.sin(elapsed * 3.0 + i) * 0.18;
  p.material.opacity = pulse;
});

miniTesseractParts.forEach(obj => {
  if(obj.type === "Group"){
    obj.rotation.x = elapsed * 0.35;
    obj.rotation.y = elapsed * 0.52;
    obj.rotation.z = Math.sin(elapsed * 0.7) * 0.12;
    obj.position.y = obj.userData.baseY + Math.sin(elapsed * 1.2) * 0.06;

    if(obj.userData.orbit1) obj.userData.orbit1.rotation.z += 0.010;
    if(obj.userData.orbit2) obj.userData.orbit2.rotation.x += 0.012;
    if(obj.userData.halo1)  obj.userData.halo1.rotation.z -= 0.006;
    if(obj.userData.halo2)  obj.userData.halo2.rotation.y += 0.008;
  }
});

miniTesseractOrbiters.forEach((p, i) => {
  p.userData.angle += p.userData.speed;
  p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
  p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
  p.position.y = p.userData.yBase + Math.sin(elapsed * 2.2 + p.userData.phase) * p.userData.yAmp;

  const pulse = 0.72 + Math.sin(elapsed * 3.0 + i) * 0.18;
  p.material.opacity = pulse;
});

  floatingPanels.forEach((mesh, i) => {
    const baseY = mesh.userData.baseY ?? mesh.position.y;
    const offset = mesh.userData.offset ?? i;
    mesh.position.y = baseY + Math.sin(elapsed*1.25+offset)*0.04;
    mesh.rotation.z = Math.sin(elapsed*0.7+i)*0.015;
  });

  pulsingLights.forEach((l, i) => {
    if(l.material) l.material.opacity = 0.07 + (Math.sin(elapsed*1.4+i*0.42)+1)*0.040;
  });

  lightBands.forEach((b, i) => {
    if(b.material) b.material.opacity = 0.030 + (Math.sin(elapsed*1.1+i*0.36)+1)*0.026;
  });

    floorCoreSpinners.forEach((group, i) => {
    group.rotation.y = elapsed * group.userData.spin;

    group.children.forEach((mesh, j) => {
      const pulse = (Math.sin(elapsed * 2.2 + group.userData.pulseOffset + j * 0.9) + 1) * 0.5;

      if(mesh.material){
        mesh.material.opacity = mesh.userData.baseOpacity + pulse * 0.16;
      }

      const s = 1 + pulse * 0.035;
      mesh.scale.set(s, s, s);
    });
  });

  serverBars.forEach((bar, i) => {
    bar.material.opacity = 0.14 + (Math.sin(elapsed*2.0+i)*0.5+0.5)*0.14;
  });

  if(ambientParticles){
    ambientParticles.rotation.y += 0.00012;
    ambientParticles.material.opacity = 0.38 + Math.sin(elapsed * 0.9) * 0.06;
    const pos = ambientParticles.geometry.attributes.position.array;
    const vels = ambientParticles.userData.velocities;
    const phases = ambientParticles.userData.phases;
    for(let i=0; i<pos.length/3; i++){
      pos[i*3+0] += Math.sin(elapsed * 0.55 + phases[i]) * vels[i] * 0.3;
      pos[i*3+1] += Math.cos(elapsed * 0.75 + phases[i]) * vels[i] * 0.18;
      pos[i*3+2] += vels[i];
      if(pos[i*3+2] > room.maxZ + 1.0){
        pos[i*3+2] = room.minZ - 1.0;
        pos[i*3+0] = rnd(-6.8, 6.8);
        pos[i*3+1] = rnd(0.3, 5.2);
      }
    }
    ambientParticles.geometry.attributes.position.needsUpdate = true;
  }

  if(foregroundDust){
    const pos = foregroundDust.geometry.attributes.position.array;
    const vels = foregroundDust.userData.velocities;
    for(let i=0; i<pos.length/3; i++){
      pos[i*3+2] += vels[i];
      pos[i*3+0] += Math.sin(elapsed * 0.8 + i) * 0.0018;
      if(pos[i*3+2] > room.maxZ+0.8){
        pos[i*3+2]=room.minZ-0.8;
        pos[i*3+0]=rnd(-5.2,5.2);
        pos[i*3+1]=rnd(0.4,4.5);
      }
    }
    foregroundDust.geometry.attributes.position.needsUpdate = true;
  }

  if(sparkSystem){
    const pos  = sparkSystem.geometry.attributes.position.array;
    const vels = sparkSystem.userData.velocities;
    sparkSystem.material.rotation = Math.sin(elapsed * 1.2) * 0.15;
    for(let i=0; i<pos.length/3; i++){
      pos[i*3+1] += vels[i];
      pos[i*3+0] += Math.sin(elapsed * 1.6 + i) * 0.0022;
      if(pos[i*3+1] > 5.2){
        pos[i*3+1]=0.05;
        pos[i*3+0]=rnd(-room.halfWidth+1, room.halfWidth-1);
        pos[i*3+2]=rnd(room.minZ+1, room.maxZ-1);
      }
    }
    sparkSystem.geometry.attributes.position.needsUpdate = true;
  }

  if(ceilingDrip){
    const pos  = ceilingDrip.geometry.attributes.position.array;
    const vels = ceilingDrip.userData.velocities;
    ceilingDrip.material.rotation = Math.cos(elapsed * 1.4) * 0.10;
    for(let i=0; i<pos.length/3; i++){
      pos[i*3+1] -= vels[i];
      pos[i*3+0] += Math.sin(elapsed * 1.1 + i * 0.4) * 0.0016;
      if(pos[i*3+1] < 0.02){
        pos[i*3+1]=room.ceilingY-0.1;
        pos[i*3+0]=rnd(-room.halfWidth+0.5, room.halfWidth-0.5);
        pos[i*3+2]=rnd(room.minZ, room.maxZ);
      }
    }
    ceilingDrip.geometry.attributes.position.needsUpdate = true;
  }

  lightCurrents.forEach((pts, pi) => {
    const pos = pts.geometry.attributes.position.array;
    const { speeds, phases, spec, zMin, zMax, direction } = pts.userData;
    pts.material.opacity = 0.32 + Math.sin(elapsed * 1.4 + pi) * 0.10;
    for(let i=0; i<pos.length/3; i++){
      pos[i*3+2] += speeds[i];
      const zz = pos[i*3+2];
      pos[i*3+0] = spec.x + Math.sin(zz * 0.55 + elapsed * 1.2 + phases[i]) * spec.ampX;
      pos[i*3+1] = spec.y + Math.cos(zz * 0.40 + elapsed * 1.5 + phases[i]) * spec.ampY;
      if(direction > 0 && zz > zMax + 0.5) pos[i*3+2] = zMin - 0.5;
      if(direction < 0 && zz < zMin - 0.5) pos[i*3+2] = zMax + 0.5;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  reflectionFlashes.forEach((mesh, i) => {
    const pulse = (Math.sin(elapsed * 2.2 + mesh.userData.offset) + 1) * 0.5;
    mesh.material.opacity = 0.025 + pulse * 0.09;
    mesh.scale.x = 1 + pulse * 0.20;
    mesh.scale.y = 1 + pulse * 0.12;
    mesh.rotation.z = Math.sin(elapsed * 0.9 + i) * 0.05;
  });

  dataRiverParticles.forEach(stream => {
    const pos = stream.pts.geometry.attributes.position.array;
    const zMin = Math.min(stream.zStart, stream.zEnd);
    const zMax = Math.max(stream.zStart, stream.zEnd);
    for(let i=0; i<pos.length/3; i++){
      pos[i*3+2] += stream.speeds[i];
      if(stream.direction > 0 && pos[i*3+2] > zMax+0.5) pos[i*3+2] = zMin-0.5;
      if(stream.direction < 0 && pos[i*3+2] < zMin-0.5) pos[i*3+2] = zMax+0.5;
    }
    stream.pts.geometry.attributes.position.needsUpdate = true;
  });
}

/* =========================================================
   RESIZE
========================================================= */
function onResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  updatePanelPositions();
}

/* =========================================================
   PANEL FOCUS
========================================================= */
function updatePanelFocus(delta){
  if(state.mode !== "experience"){
    panelAnchors.forEach(item => {
      item.focusAmount = (item.focusAmount || 0) + (0 - (item.focusAmount || 0)) * Math.min(1, delta * 5);

      const f = item.focusAmount || 0;

      if(item.cssObject){
        item.cssObject.scale.setScalar(item.baseCssScale * (1 + f * 0.045));
        item.cssObject.position.z = (item.size.d || 0.18) * (0.70 + f * 0.07);
      }

      if(item.element){
        const alpha = item.basePanelAlpha ?? 1;
        item.element.style.opacity = String(alpha);
        item.element.style.filter = `brightness(${1 + f * 0.14}) saturate(${1 + f * 0.22})`;
        item.element.style.boxShadow =
          `0 0 ${18 + f * 22}px rgba(56,232,255,${0.08 + f * 0.14}), ` +
          `0 0 ${30 + f * 28}px rgba(255,50,200,${0.04 + f * 0.10})`;
      }

      if(item.frameRefs){
        item.frameRefs.shell.material.emissiveIntensity = 0.32 + f * 0.20;
        item.frameRefs.frontPlate.material.emissiveIntensity = 0.28 + f * 0.30;
        item.frameRefs.backPlate.material.emissiveIntensity = 0.18 + f * 0.22;
        item.frameRefs.rearFrame.material.emissiveIntensity = 0.08 + f * 0.18;
        item.frameRefs.rearGlow.material.opacity = 0.12 + f * 0.20;
        item.frameRefs.rearSeal.material.opacity = 0.14 + f * 0.16;
        item.frameRefs.lowerAccent.material.opacity = 0.18 + f * 0.14;
        item.frameRefs.sideAccentL.material.opacity = 0.12 + f * 0.12;
        item.frameRefs.sideAccentR.material.opacity = 0.12 + f * 0.12;
      }
    });

    state.focusedPanel = null;
    return;
  }

  const camWorld = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  camera.getWorldPosition(camWorld);
  camera.getWorldDirection(camDir);

  let bestPanel = null;
  let bestScore = 0;

  panelAnchors.forEach(item => {
    const anchorWorld = new THREE.Vector3();
    item.anchor.getWorldPosition(anchorWorld);

    const toPanel = anchorWorld.clone().sub(camWorld);
    const dist = toPanel.length();
    const dirToPanel = toPanel.clone().normalize();

    const alignment = Math.max(0, camDir.dot(dirToPanel));
    const frontness = Math.max(0, item.facing.clone().dot(camWorld.clone().sub(anchorWorld).normalize()));
    const distanceFactor = clamp(1 - (dist - 1.8) / 8.8, 0, 1);

    let score = alignment * 0.58 + frontness * 0.20 + distanceFactor * 0.22;

    if(item.id === "title"){
      score += 0.06;
    }

    if(dist < 11.2 && alignment > 0.70 && frontness > 0.06 && score > bestScore){
      bestScore = score;
      bestPanel = item;
    }
  });

  panelAnchors.forEach(item => {
    let targetFocus = bestPanel === item ? clamp(bestScore, 0, 1) : 0;

    if(item.id === "title" && bestPanel !== item && (item.basePanelAlpha ?? 0) > 0.20){
      targetFocus = 0.08;
    }

    item.focusAmount = (item.focusAmount || 0) + (targetFocus - (item.focusAmount || 0)) * Math.min(1, delta * 5.5);

    const f = item.focusAmount || 0;

    if(item.cssObject){
      item.cssObject.scale.setScalar(item.baseCssScale * (1 + f * 0.045));
      item.cssObject.position.z = (item.size.d || 0.18) * (0.70 + f * 0.07);
    }

    if(item.element){
      const alpha = item.basePanelAlpha ?? 1;
      item.element.style.opacity = String(alpha);
      item.element.style.filter = `brightness(${1 + f * 0.14}) saturate(${1 + f * 0.22})`;
      item.element.style.boxShadow =
        `0 0 ${18 + f * 22}px rgba(56,232,255,${0.08 + f * 0.14}), ` +
        `0 0 ${30 + f * 28}px rgba(255,50,200,${0.04 + f * 0.10})`;
    }

    if(item.frameRefs){
      item.frameRefs.shell.material.emissiveIntensity = 0.32 + f * 0.20;
      item.frameRefs.frontPlate.material.emissiveIntensity = 0.28 + f * 0.30;
      item.frameRefs.backPlate.material.emissiveIntensity = 0.18 + f * 0.22;
      item.frameRefs.rearFrame.material.emissiveIntensity = 0.08 + f * 0.18;
      item.frameRefs.rearGlow.material.opacity = 0.12 + f * 0.20;
      item.frameRefs.rearSeal.material.opacity = 0.14 + f * 0.16;
      item.frameRefs.lowerAccent.material.opacity = 0.18 + f * 0.14;
      item.frameRefs.sideAccentL.material.opacity = 0.12 + f * 0.12;
      item.frameRefs.sideAccentR.material.opacity = 0.12 + f * 0.12;
    }
  });

  state.focusedPanel = bestPanel ? bestPanel.id : null;
}

/* =========================================================
   DYNAMIC LIGHTS
========================================================= */
function updateDynamicLights(elapsed){
  panelAccentLights.forEach((entry, index) => {
    const item = panelAnchors.find(p => p.id === entry.id);
    const focus = item?.focusAmount || 0;
    const pulse = (Math.sin(elapsed * 1.8 + index * 0.9) + 1) * 0.5;

    entry.light.intensity = entry.base + pulse * 0.38 + focus * entry.boost;
  });

  if(bloomPass){
    const focusedItem = panelAnchors.find(p => p.id === state.focusedPanel);
    const focus = focusedItem?.focusAmount || 0;
    bloomPass.strength = 0.78 + focus * 0.14;
    bloomPass.radius = 0.58 + focus * 0.04;
    bloomPass.threshold = 0.18 - focus * 0.03;
  }

  reflectionFlashes.forEach((mesh, i) => {
    const extra = state.focusedPanel ? 0.03 : 0;
    const pulse = (Math.sin(elapsed * 2.1 + i * 0.8) + 1) * 0.5;
    mesh.material.opacity = 0.030 + pulse * (0.06 + extra);
  });
}

/* =========================================================
   ATMOSPHERIC FX UPDATE
========================================================= */
function updateAtmosphericFX(elapsed){
  volumetricVeils.forEach((mesh, i) => {
    const pulse = (Math.sin(elapsed * 1.25 + mesh.userData.offset) + 1) * 0.5;
    mesh.position.y = mesh.userData.baseY + Math.sin(elapsed * 0.7 + mesh.userData.offset) * mesh.userData.floatAmp;
    mesh.rotation.z = Math.sin(elapsed * 0.45 + i) * 0.035;
    mesh.material.opacity = mesh.userData.baseOpacity + pulse * 0.050;
  });

  wallEnergySheets.forEach((mesh, i) => {
    const pulse = (Math.sin(elapsed * 1.7 + mesh.userData.offset) + 1) * 0.5;
    mesh.scale.y = mesh.userData.baseScaleY + pulse * 0.08;
    mesh.material.opacity = mesh.userData.baseOpacity + pulse * 0.040;
  });

  floorSweepBands.forEach((mesh, i) => {
    const pulse = (Math.sin(elapsed * 1.55 + mesh.userData.offset) + 1) * 0.5;
    mesh.scale.x = mesh.userData.baseScaleX + pulse * 0.14;
    mesh.scale.y = mesh.userData.baseScaleY + pulse * 0.20;
    mesh.material.opacity = mesh.userData.baseOpacity + pulse * 0.025;
  });

  ambientHaloOrbs.forEach((mesh, i) => {
    const pulse = (Math.sin(elapsed * 1.05 + mesh.userData.offset) + 1) * 0.5;
    mesh.position.y = mesh.userData.baseY + Math.sin(elapsed * 0.55 + mesh.userData.offset) * 0.18;
    mesh.scale.setScalar(1 + pulse * 0.12);
    mesh.material.opacity = mesh.userData.baseOpacity + pulse * 0.040;
  });
}

/* =========================================================
   RENDER LOOP
========================================================= */

function isTrendTechVideoFullscreen(){
  const fs =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    null;

  return !!fs && fs.id === "trendtech-video-frame";
}

function animate(){
  const delta   = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if(isTrendTechVideoFullscreen()){
    requestAnimationFrame(animate);
    return;
  }

  updateMovement(delta);
  updateCamera();
  animateWorld(elapsed);
  updatePanelPositions();
  updatePanelFocus(delta);
  updateDynamicLights(elapsed);
  updateAtmosphericFX(elapsed);
  updateCursor();

  composer.render();
  cssRenderer.render(cssScene, camera);
  requestAnimationFrame(animate);
}

/* ========================================================= 
   INIT
========================================================= */
async function init(){
  setLoadProgress(5, "INICIANDO ENTORNO INMERSIVO DE TRENDTECH…");
  await tick();

  renderLogoPanel();
  renderBannerPanel();
  renderVideoPanel();
  setupSubscribePanel();
  setLoadProgress(15, "CONFIGURANDO INTERFAZ CORPORATIVA Y PANELES DE INFORMACIÓN…");
  await tick();

  addLights();
  setLoadProgress(22, "SINCRONIZANDO ILUMINACIÓN ESCÉNICA DEL PORTAL TRENDTECH…");
  await tick();

  createFloor();
  setLoadProgress(34, "GENERANDO SUPERFICIE TECNOLÓGICA Y BASE VISUAL DEL ENTORNO…");
  await tick();

  createCeiling();
  setLoadProgress(44, "DESPLEGANDO ESTRUCTURA ARQUITECTÓNICA DEL HABITÁCULO DIGITAL…");
  await tick();

  createWalls();
  createArchColumns();
  createPanelStructures();
  createCSS3DPanels();
  setLoadProgress(54, "INTEGRANDO PANELES LATERALES Y SOPORTES DEL ESPACIO INTERACTIVO…");
  await tick();

  createDNAHelix(-4.90, -8.2, 6.5, 3.2);
  createDNAHelix( 4.90, -8.2, 6.5, 3.2);
  setLoadProgress(63, "ACTIVANDO MÓDULOS VISUALES DE INNOVACIÓN Y DATOS…");
  await tick();

  createNeuralWeb();
  setLoadProgress(70, "CONECTANDO RED NEURONAL DEL ECOSISTEMA TRENDTECH…");
  await tick();

  //createHoloPrisms();
  setLoadProgress(76, "MATERIALIZANDO COMPONENTES HOLOGRÁFICOS DEL ESCENARIO…");
  await tick();

  createTesseract();
  createMiniTesseracts();

  createEnergyBeams();
  setLoadProgress(82, "OPTIMIZANDO FLUJOS ENERGÉTICOS Y ELEMENTOS DE SEÑALIZACIÓN…");
  await tick();

  createDataRivers();
  setLoadProgress(86, "SINCRONIZANDO FLUJOS DE DATOS DEL PORTAL TECNOLÓGICO…");
  await tick();

  createPortal();
  createCentralHub();
  createRearPlatform();
  setLoadProgress(92, "ENSAMBLANDO NÚCLEO CENTRAL DE LA EXPERIENCIA TRENDTECH…");
  await tick();

  createParticles();
  createAtmosphericFX();
  setLoadProgress(98, "FINALIZANDO EFECTOS ATMOSFÉRICOS Y SISTEMAS DE PARTÍCULAS…");
  await tick();

  setupEvents();
  showMenu();
  onResize();
  setLoadProgress(100, "ENTORNO TRENDTECH LISTO PARA ACCESO");
  await tick(500);

  finishLoading();
  animate();
}

function tick(ms=0){ return new Promise(r=>setTimeout(r,ms)); }

document.addEventListener("fullscreenchange", () => {
  const active = isTrendTechVideoFullscreen();
  const shell = document.getElementById("video-frame-shell");

  document.body.classList.toggle("video-fullscreen-active", active);

  if(renderer?.domElement){
    renderer.domElement.style.visibility = active ? "hidden" : "visible";
    renderer.domElement.style.opacity = active ? "0" : "1";
    renderer.domElement.style.transition = "opacity 0.28s ease";
  }

  if(cssRenderer?.domElement){
    cssRenderer.domElement.style.visibility = active ? "hidden" : "visible";
    cssRenderer.domElement.style.opacity = active ? "0" : "1";
    cssRenderer.domElement.style.transition = "opacity 0.28s ease";
  }

  if(shell){
    shell.style.transform = active ? "scale(1.01)" : "";
    shell.style.filter = active ? "saturate(1.04)" : "";
  }
});



window.addEventListener("resize", onResize);
init();
}
}
