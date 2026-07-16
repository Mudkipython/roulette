import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const TAU = Math.PI * 2;
const BALL_RADIUS = 0.19;
const OUTER_TRACK_RADIUS = 5.96;
const LAUNCH_RADIUS = 6.38;
const POCKET_RADIUS = 4.57;
const RED_NUMBERS = new Set(['1','3','5','7','9','12','14','16','18','19','21','23','25','27','30','32','34','36']);

function clamp01(value) { return Math.min(1, Math.max(0, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
function normalizeAngle(angle) { return ((angle % TAU) + TAU) % TAU; }
function shortestAngle(from, to) {
  let delta = normalizeAngle(to) - normalizeAngle(from);
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return delta;
}
function pocketColor(number) {
  if (number === '0' || number === '00') return 0x0d9d66;
  return RED_NUMBERS.has(number) ? 0xc93643 : 0x151b25;
}

class CasinoAudio {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.lastRailTick = 0;
  }
  setEnabled(enabled) { this.enabled = Boolean(enabled); }
  ensure() {
    if (!this.enabled) return null;
    if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  }
  tone(frequency, duration = 0.05, volume = 0.02, type = 'sine', delay = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  launch() {
    this.tone(145, 0.14, 0.045, 'sawtooth');
    this.tone(310, 0.10, 0.025, 'triangle', 0.06);
  }
  rail(speed) {
    const now = performance.now();
    const interval = Math.max(38, 130 - speed * 10);
    if (now - this.lastRailTick < interval) return;
    this.lastRailTick = now;
    this.tone(680 + speed * 70, 0.018, 0.007, 'square');
  }
  deflector() {
    this.tone(1220, 0.025, 0.025, 'square');
    this.tone(760, 0.045, 0.018, 'triangle', 0.012);
  }
  pocket() {
    this.tone(520, 0.05, 0.025, 'triangle');
    this.tone(340, 0.08, 0.02, 'sine', 0.035);
  }
  win() {
    [523.25, 659.25, 783.99].forEach((frequency, index) => this.tone(frequency, 0.28, 0.035, 'sine', index * 0.08));
  }
  lose() { this.tone(210, 0.18, 0.025, 'triangle'); }
}

export class RouletteScene {
  constructor(container, options = {}) {
    this.container = container;
    this.order = [...(options.order || [])];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.audio = new CasinoAudio();
    this.ready = false;
    this.disposed = false;
    this.spinning = false;
    this.phase = 'idle';
    this.rotorAngle = 0;
    this.wheelOmega = 0;
    this.ballAngle = 0.18;
    this.ballAngularVelocity = 0;
    this.ballRadius = LAUNCH_RADIUS;
    this.ballHeight = 1.22;
    this.ballRadialVelocity = 0;
    this.ballBounceHeight = 0;
    this.ballBounceVelocity = 0;
    this.spinState = null;
    this.lastCountdown = null;
    this.homeCamera = new THREE.Vector3(0, 9.7, 11.6);
    this.homeTarget = new THREE.Vector3(0, 0.72, 0);
    this.launchAngle = 0.16;
    this.clock = new THREE.Clock();
    this.confetti = [];
    this.pulses = [];
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.hoveredPocket = null;
  }

  init() {
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(Math.max(1, this.container.clientWidth), Math.max(1, this.container.clientHeight), false);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D roulette wheel');
      this.renderer.domElement.className = 'roulette-webgl-canvas';
      this.container.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x06101c);
      this.scene.fog = new THREE.FogExp2(0x06101c, 0.024);

      this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
      this.camera.position.copy(this.homeCamera);
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.055;
      this.controls.enablePan = false;
      this.controls.minDistance = 9;
      this.controls.maxDistance = 16;
      this.controls.minPolarAngle = 0.42;
      this.controls.maxPolarAngle = 1.18;
      this.controls.target.copy(this.homeTarget);

      this.buildLighting();
      this.buildEnvironment();
      this.buildMachine();
      this.buildBall();
      this.buildPostProcessing();
      this.bindPointerInteraction();

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
      this.resize();
      this.ready = true;
      this.container.classList.add('has-webgl');
      this.animate = this.animate.bind(this);
      this.renderer.setAnimationLoop(this.animate);
      return true;
    } catch (error) {
      console.error('3D roulette initialization failed. Falling back to 2D.', error);
      this.container.classList.add('webgl-fallback');
      return false;
    }
  }

  buildLighting() {
    this.scene.add(new THREE.HemisphereLight(0xbcdcff, 0x190b05, 1.65));

    const key = new THREE.DirectionalLight(0xffe0ac, 3.25);
    key.position.set(7, 13, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -9;
    key.shadow.camera.right = 9;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    this.scene.add(key);

    const cool = new THREE.PointLight(0x5fc8ff, 42, 24, 2);
    cool.position.set(-6, 5.5, -4);
    this.scene.add(cool);

    this.resultLight = new THREE.PointLight(0xffc861, 0, 14, 2);
    this.resultLight.position.set(0, 4.2, 0);
    this.scene.add(this.resultLight);
  }

  buildEnvironment() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(24, 96),
      new THREE.MeshStandardMaterial({ color: 0x071b19, roughness: 0.94, metalness: 0.01 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(8.25, 8.65, 0.72, 96),
      new THREE.MeshStandardMaterial({ color: 0x063d31, roughness: 0.74, metalness: 0.06 })
    );
    table.position.y = 0.23;
    table.receiveShadow = true;
    table.castShadow = true;
    this.scene.add(table);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(8.12, 0.18, 18, 128),
      new THREE.MeshStandardMaterial({ color: 0x956124, roughness: 0.3, metalness: 0.62 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.62;
    rim.castShadow = true;
    this.scene.add(rim);
  }

  buildMachine() {
    if (this.machineRoot) {
      this.scene.remove(this.machineRoot);
      this.disposeObject(this.machineRoot);
    }

    this.machineRoot = new THREE.Group();
    this.machineRoot.position.y = 0.55;
    this.scene.add(this.machineRoot);

    this.buildStaticBowl();
    this.buildRotor();
    this.buildLauncher();
  }

  buildStaticBowl() {
    const casing = new THREE.Mesh(
      new THREE.CylinderGeometry(6.38, 6.5, 0.56, 128),
      new THREE.MeshStandardMaterial({ color: 0x27150c, roughness: 0.24, metalness: 0.52 })
    );
    casing.castShadow = true;
    casing.receiveShadow = true;
    this.machineRoot.add(casing);

    const outerGold = new THREE.Mesh(
      new THREE.TorusGeometry(6.18, 0.16, 20, 160),
      new THREE.MeshStandardMaterial({ color: 0xd3a64b, roughness: 0.18, metalness: 0.9, emissive: 0x2b1500, emissiveIntensity: 0.18 })
    );
    outerGold.rotation.x = Math.PI / 2;
    outerGold.position.y = 0.45;
    outerGold.castShadow = true;
    this.machineRoot.add(outerGold);

    const track = new THREE.Mesh(
      new THREE.TorusGeometry(OUTER_TRACK_RADIUS, 0.25, 22, 160),
      new THREE.MeshStandardMaterial({ color: 0xc8b17e, roughness: 0.22, metalness: 0.72 })
    );
    track.rotation.x = Math.PI / 2;
    track.position.y = 1.02;
    track.castShadow = true;
    track.receiveShadow = true;
    this.machineRoot.add(track);

    const bowlPoints = [
      new THREE.Vector2(3.58, 0.28),
      new THREE.Vector2(4.30, 0.32),
      new THREE.Vector2(4.90, 0.39),
      new THREE.Vector2(5.38, 0.56),
      new THREE.Vector2(5.72, 0.79),
      new THREE.Vector2(5.93, 0.98)
    ];
    const bowl = new THREE.Mesh(
      new THREE.LatheGeometry(bowlPoints, 128),
      new THREE.MeshStandardMaterial({ color: 0x9f875d, roughness: 0.3, metalness: 0.52, side: THREE.DoubleSide })
    );
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    this.machineRoot.add(bowl);

    const innerLip = new THREE.Mesh(
      new THREE.TorusGeometry(5.28, 0.07, 12, 128),
      new THREE.MeshStandardMaterial({ color: 0xdeb65f, roughness: 0.19, metalness: 0.88 })
    );
    innerLip.rotation.x = Math.PI / 2;
    innerLip.position.y = this.surfaceHeight(5.28) + 0.04;
    this.machineRoot.add(innerLip);

    this.deflectorGroup = new THREE.Group();
    const deflectorMaterial = new THREE.MeshStandardMaterial({ color: 0xd7ad58, roughness: 0.2, metalness: 0.86 });
    for (let i = 0; i < 8; i++) {
      const angle = i * TAU / 8 + Math.PI / 8;
      const deflector = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 4), deflectorMaterial);
      const radius = i % 2 === 0 ? 5.22 : 5.08;
      deflector.position.set(Math.cos(angle) * radius, this.surfaceHeight(radius) + 0.17, Math.sin(angle) * radius);
      deflector.rotation.y = -angle + Math.PI / 4;
      deflector.castShadow = true;
      this.deflectorGroup.add(deflector);
    }
    this.machineRoot.add(this.deflectorGroup);
  }

  buildRotor() {
    this.rotorGroup = new THREE.Group();
    this.machineRoot.add(this.rotorGroup);

    const rotorBase = new THREE.Mesh(
      new THREE.CylinderGeometry(5.18, 5.34, 0.48, 128),
      new THREE.MeshStandardMaterial({ color: 0x1b2a40, roughness: 0.24, metalness: 0.58 })
    );
    rotorBase.position.y = 0.37;
    rotorBase.castShadow = true;
    rotorBase.receiveShadow = true;
    this.rotorGroup.add(rotorBase);

    this.pocketsGroup = new THREE.Group();
    this.pocketsGroup.position.y = 0.42;
    this.rotorGroup.add(this.pocketsGroup);
    this.pocketMeshes = [];

    const arc = TAU / this.order.length;
    for (let i = 0; i < this.order.length; i++) {
      const center = this.baseAngle(i);
      const geometry = this.createRingSectorGeometry(3.72, 5.06, center - arc * 0.475, center + arc * 0.475, 0.18);
      const number = this.order[i];
      const material = new THREE.MeshStandardMaterial({
        color: pocketColor(number),
        roughness: 0.4,
        metalness: 0.22,
        emissive: pocketColor(number),
        emissiveIntensity: 0.03
      });
      const pocket = new THREE.Mesh(geometry, material);
      pocket.castShadow = true;
      pocket.receiveShadow = true;
      pocket.userData = { number, index: i, baseEmissive: 0.03 };
      this.pocketsGroup.add(pocket);
      this.pocketMeshes.push(pocket);

      const label = this.createNumberLabel(number);
      label.position.set(Math.cos(center) * 4.46, 0.23, Math.sin(center) * 4.46);
      label.rotation.x = -Math.PI / 2;
      label.rotation.z = -center + Math.PI / 2;
      this.pocketsGroup.add(label);

      const separator = new THREE.Mesh(
        new THREE.BoxGeometry(0.048, 0.27, 1.37),
        new THREE.MeshStandardMaterial({ color: 0xe4bc63, roughness: 0.2, metalness: 0.86 })
      );
      separator.position.set(Math.cos(center - arc * 0.5) * 4.39, 0.22, Math.sin(center - arc * 0.5) * 4.39);
      separator.rotation.y = -(center - arc * 0.5) + Math.PI / 2;
      separator.castShadow = true;
      this.pocketsGroup.add(separator);
    }

    const innerCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 3.68, 0.66, 96),
      new THREE.MeshStandardMaterial({ color: 0x193653, roughness: 0.25, metalness: 0.55 })
    );
    innerCone.position.y = 0.73;
    innerCone.castShadow = true;
    this.rotorGroup.add(innerCone);

    const spokeMaterial = new THREE.MeshStandardMaterial({ color: 0x557da3, roughness: 0.24, metalness: 0.62 });
    for (let i = 0; i < 12; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 3.0), spokeMaterial);
      spoke.position.y = 1.08;
      spoke.rotation.y = i * Math.PI / 6;
      this.rotorGroup.add(spoke);
    }

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.22, 0.78, 64),
      new THREE.MeshStandardMaterial({ color: 0xd8aa4c, roughness: 0.17, metalness: 0.9, emissive: 0x2a1500, emissiveIntensity: 0.2 })
    );
    hub.position.y = 1.25;
    hub.castShadow = true;
    this.rotorGroup.add(hub);

    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.17, 1.85, 24),
      new THREE.MeshStandardMaterial({ color: 0xffda82, roughness: 0.12, metalness: 0.96 })
    );
    spindle.position.y = 2.2;
    this.rotorGroup.add(spindle);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 28, 18),
      new THREE.MeshStandardMaterial({ color: 0xffd16a, roughness: 0.14, metalness: 0.92 })
    );
    cap.position.y = 3.13;
    this.rotorGroup.add(cap);
  }

  buildLauncher() {
    const launcher = new THREE.Group();
    const angle = this.launchAngle;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    launcher.position.copy(radial.clone().multiplyScalar(6.32));
    launcher.position.y = 1.22;
    launcher.rotation.y = -angle;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.38, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x202b3a, roughness: 0.26, metalness: 0.72 })
    );
    body.castShadow = true;
    launcher.add(body);

    const mouth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.19, 0.52, 28),
      new THREE.MeshStandardMaterial({ color: 0xc3a466, roughness: 0.18, metalness: 0.82 })
    );
    mouth.rotation.x = Math.PI / 2;
    mouth.position.copy(tangent.clone().multiplyScalar(-0.48));
    launcher.add(mouth);
    this.machineRoot.add(launcher);
  }

  buildBall() {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.07,
      metalness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      emissive: 0xb8dcff,
      emissiveIntensity: 0.055
    });
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 32, 22), material);
    this.ball.castShadow = true;
    this.scene.add(this.ball);

    this.ballGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.255, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xaedfff, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.scene.add(this.ballGlow);
    this.updateBallTransform();
  }

  buildPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.48, 0.38, 0.84);
    this.composer.addPass(this.bloomPass);
  }

  createRingSectorGeometry(innerRadius, outerRadius, startAngle, endAngle, depth) {
    const shape = new THREE.Shape();
    const segments = 7;
    for (let i = 0; i <= segments; i++) {
      const angle = lerp(startAngle, endAngle, i / segments);
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    for (let i = segments; i >= 0; i--) {
      const angle = lerp(startAngle, endAngle, i / segments);
      shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    }
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }

  createNumberLabel(number) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.font = '900 78px Inter, Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 9;
    context.strokeStyle = 'rgba(0,0,0,.55)';
    context.strokeText(number, 128, 68);
    context.fillStyle = '#fff';
    context.fillText(number, 128, 68);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return new THREE.Mesh(
      new THREE.PlaneGeometry(0.67, 0.34),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
  }

  surfaceHeight(radius) {
    if (radius >= 5.93) return 0.98;
    if (radius >= 5.72) return lerp(0.79, 0.98, (radius - 5.72) / 0.21);
    if (radius >= 5.38) return lerp(0.56, 0.79, (radius - 5.38) / 0.34);
    if (radius >= 4.90) return lerp(0.39, 0.56, (radius - 4.90) / 0.48);
    if (radius >= 4.30) return lerp(0.32, 0.39, (radius - 4.30) / 0.60);
    return lerp(0.28, 0.32, clamp01((radius - 3.58) / 0.72));
  }

  baseAngle(index) { return -Math.PI / 2 + index * (TAU / Math.max(1, this.order.length)); }

  bindPointerInteraction() {
    this.renderer.domElement.addEventListener('pointermove', event => {
      if (this.spinning) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.pocketMeshes, false)[0];
      const next = hit?.object || null;
      if (next === this.hoveredPocket) return;
      if (this.hoveredPocket) this.hoveredPocket.material.emissiveIntensity = this.hoveredPocket.userData.baseEmissive;
      this.hoveredPocket = next;
      if (next) next.material.emissiveIntensity = 0.28;
      this.renderer.domElement.style.cursor = next ? 'pointer' : 'grab';
    });
    this.renderer.domElement.addEventListener('pointerleave', () => {
      if (this.hoveredPocket) this.hoveredPocket.material.emissiveIntensity = this.hoveredPocket.userData.baseEmissive;
      this.hoveredPocket = null;
      this.renderer.domElement.style.cursor = 'grab';
    });
    this.renderer.domElement.addEventListener('click', () => {
      if (!this.spinning && this.hoveredPocket) {
        this.container.dispatchEvent(new CustomEvent('roulette-pocket-select', { detail: { number: this.hoveredPocket.userData.number } }));
      }
    });
  }

  emit(name, detail = {}) {
    this.container.dispatchEvent(new CustomEvent(name, { detail }));
    const hookName = {
      'roulette-phase': 'onPhase',
      'roulette-countdown': 'onCountdown',
      'roulette-bets-closed': 'onBetsClosed'
    }[name];
    if (hookName && typeof this.spinState?.hooks?.[hookName] === 'function') this.spinState.hooks[hookName](detail);
  }

  setPhase(phase, detail = {}) {
    if (this.phase === phase) return;
    this.phase = phase;
    this.container.dataset.phase = phase;
    this.emit('roulette-phase', { phase, ...detail });
  }

  setOrder(order) {
    this.order = [...order];
    this.rotorAngle = 0;
    this.ballAngle = this.launchAngle;
    this.ballRadius = LAUNCH_RADIUS;
    this.ballHeight = 1.22;
    this.buildMachine();
    this.updateBallTransform();
  }

  setCinematic() { /* retained as a harmless compatibility no-op */ }
  setSound(enabled) { this.audio.setEnabled(enabled); }

  spinTo(result, hooks = {}) {
    if (!this.ready || this.spinning) return Promise.resolve();
    const index = this.order.indexOf(String(result));
    if (index < 0) return Promise.resolve();

    this.clearEffects();
    this.audio.launch();
    this.spinning = true;
    this.controls.enabled = false;
    this.container.classList.add('is-spinning');
    this.container.classList.remove('is-win', 'is-loss');

    const now = performance.now();
    const bettingDuration = this.reducedMotion ? 2600 : 7000;
    const descentDuration = this.reducedMotion ? 1700 : 4300;
    const captureDuration = this.reducedMotion ? 900 : 2200;
    const collisionSigns = Array.from({ length: 3 }, () => (Math.random() < 0.5 ? -1 : 1));

    this.rotorAngle = normalizeAngle(this.rotorAngle);
    this.wheelOmega = this.reducedMotion ? 1.25 : 1.72; // positive Y rotation appears counter-clockwise from above
    this.ballAngle = this.launchAngle;
    this.ballAngularVelocity = this.reducedMotion ? 4.2 : 2.8; // positive world-angle motion appears clockwise from the fixed camera
    this.ballRadius = LAUNCH_RADIUS;
    this.ballHeight = 1.22;
    this.ballRadialVelocity = 0;
    this.ballBounceHeight = 0;
    this.ballBounceVelocity = 0;
    this.lastCountdown = null;

    this.spinState = {
      result: String(result),
      index,
      hooks,
      startTime: now,
      lastTime: now,
      bettingDuration,
      descentDuration,
      captureDuration,
      betCloseAt: now + bettingDuration,
      captureAt: now + bettingDuration + descentDuration,
      endAt: now + bettingDuration + descentDuration + captureDuration,
      betsClosed: false,
      captureStarted: false,
      captureStartRadius: null,
      captureStartRelative: null,
      captureOffset: null,
      collisionThresholds: [0.34, 0.56, 0.74],
      collisionSigns,
      collisionIndex: 0,
      resolve: null
    };

    this.setPhase('betting-open', { seconds: Math.ceil(bettingDuration / 1000) });
    return new Promise(resolve => { this.spinState.resolve = resolve; });
  }

  updateSpin(now) {
    const state = this.spinState;
    if (!state) return;
    const dt = Math.min(0.035, Math.max(0, (now - state.lastTime) / 1000));
    state.lastTime = now;

    this.wheelOmega *= Math.exp(-0.018 * dt);
    this.rotorAngle += this.wheelOmega * dt;
    this.rotorGroup.rotation.y = this.rotorAngle;

    if (now < state.betCloseAt) {
      this.updateOuterTrack(now, dt, state);
    } else if (now < state.captureAt) {
      if (!state.betsClosed) {
        state.betsClosed = true;
        this.setPhase('bets-closed');
        this.emit('roulette-bets-closed', { resultPending: true });
      }
      this.updateDescent(now, dt, state);
    } else if (now < state.endAt) {
      if (!state.captureStarted) this.beginCapture(state);
      this.updateCapture(now, state);
    } else {
      this.finishSpin(state);
    }

    this.updateBallTransform();
  }

  updateOuterTrack(now, dt, state) {
    const elapsed = now - state.startTime;
    const launchProgress = clamp01(elapsed / (this.reducedMotion ? 420 : 680));
    const cruiseTarget = this.reducedMotion ? 5.0 : 7.2;
    const response = launchProgress < 1 ? 4.8 : 0.34;
    this.ballAngularVelocity += (cruiseTarget - this.ballAngularVelocity) * clamp01(dt * response);
    if (launchProgress >= 1) this.ballAngularVelocity *= Math.exp(-0.022 * dt);
    this.ballAngle += this.ballAngularVelocity * dt;

    const targetRadius = lerp(LAUNCH_RADIUS, OUTER_TRACK_RADIUS, easeOutCubic(launchProgress));
    this.ballRadius += (targetRadius - this.ballRadius) * clamp01(dt * 8.5);
    this.ballHeight = lerp(1.22, 1.19, easeInOutCubic(launchProgress)) + Math.sin(elapsed * 0.018) * 0.009;

    const remaining = Math.max(0, Math.ceil((state.betCloseAt - now) / 1000));
    if (remaining !== this.lastCountdown) {
      this.lastCountdown = remaining;
      this.emit('roulette-countdown', { seconds: remaining });
    }
    this.audio.rail(Math.abs(this.ballAngularVelocity));
  }

  updateDescent(now, dt, state) {
    const progress = clamp01((now - state.betCloseAt) / state.descentDuration);
    this.setPhase('descending', { progress });

    this.ballAngularVelocity *= Math.exp(-(this.reducedMotion ? 0.44 : 0.35) * dt);
    this.ballAngle += this.ballAngularVelocity * dt;

    const gravityTarget = lerp(OUTER_TRACK_RADIUS, POCKET_RADIUS + 0.28, easeInOutCubic(progress));
    const centrifugalLift = clamp01((Math.abs(this.ballAngularVelocity) - 0.8) / 5.5) * 0.14;
    const targetRadius = gravityTarget + centrifugalLift;
    const radialAcceleration = (targetRadius - this.ballRadius) * 7.2 - this.ballRadialVelocity * 3.7;
    this.ballRadialVelocity += radialAcceleration * dt;
    this.ballRadius += this.ballRadialVelocity * dt;

    while (state.collisionIndex < state.collisionThresholds.length && progress >= state.collisionThresholds[state.collisionIndex]) {
      const sign = state.collisionSigns[state.collisionIndex];
      this.ballAngularVelocity += sign * (0.48 - state.collisionIndex * 0.09);
      this.ballRadialVelocity += 0.16;
      this.ballBounceVelocity = 1.05 - state.collisionIndex * 0.16;
      this.audio.deflector();
      state.collisionIndex += 1;
    }

    this.ballBounceVelocity -= 5.8 * dt;
    this.ballBounceHeight += this.ballBounceVelocity * dt;
    if (this.ballBounceHeight < 0) {
      this.ballBounceHeight = 0;
      if (this.ballBounceVelocity < -0.35) this.ballBounceVelocity *= -0.22;
      else this.ballBounceVelocity = 0;
    }

    this.ballHeight = this.surfaceHeight(this.ballRadius) + BALL_RADIUS + this.ballBounceHeight;
    this.audio.rail(Math.max(0.5, Math.abs(this.ballAngularVelocity) * 0.7));
  }

  beginCapture(state) {
    state.captureStarted = true;
    state.captureStartRadius = this.ballRadius;
    state.captureStartRelative = normalizeAngle(this.ballAngle + this.rotorAngle);
    const targetRelative = this.baseAngle(state.index);
    state.captureOffset = shortestAngle(targetRelative, state.captureStartRelative);
    this.audio.pocket();
    this.setPhase('settling');
  }

  updateCapture(now, state) {
    const progress = clamp01((now - state.captureAt) / state.captureDuration);
    const eased = easeOutCubic(progress);
    const targetRelative = this.baseAngle(state.index);
    const arc = TAU / this.order.length;
    const pocketRattle = Math.sin(progress * Math.PI * 7) * (1 - progress) * arc * 0.28;
    const relative = targetRelative + state.captureOffset * (1 - eased) + pocketRattle;

    this.ballAngle = relative - this.rotorAngle;
    this.ballRadius = lerp(state.captureStartRadius, POCKET_RADIUS, easeInOutCubic(progress)) + Math.sin(progress * Math.PI * 5) * (1 - progress) * 0.045;
    this.ballHeight = 0.66 + Math.abs(Math.sin(progress * Math.PI * 6)) * (1 - progress) * 0.15;
  }

  finishSpin(state) {
    const targetRelative = this.baseAngle(state.index);
    this.ballAngle = targetRelative - this.rotorAngle;
    this.ballRadius = POCKET_RADIUS;
    this.ballHeight = 0.66;
    this.updateBallTransform();

    const resolve = state.resolve;
    this.spinState = null;
    this.spinning = false;
    this.wheelOmega = 0;
    this.ballAngularVelocity = 0;
    this.controls.enabled = true;
    this.container.classList.remove('is-spinning');
    this.setPhase('resolved', { result: state.result });
    if (resolve) resolve();
  }

  resolveResult(won, result) {
    if (!this.ready) return Promise.resolve();
    this.resultLight.color.set(won ? 0xffc861 : 0xff596a);
    this.resultLight.intensity = won ? 65 : 24;
    this.container.classList.add(won ? 'is-win' : 'is-loss');
    if (won) {
      this.audio.win();
      this.spawnConfetti(pocketColor(String(result)));
      this.spawnPulse(0xffd875);
    } else {
      this.audio.lose();
      this.spawnPulse(0xff596a);
    }
    this.highlightPocket(String(result), won);
    return new Promise(resolve => window.setTimeout(resolve, this.reducedMotion ? 260 : 850));
  }

  highlightPocket(result, won) {
    const pocket = this.pocketMeshes.find(mesh => mesh.userData.number === result);
    if (!pocket) return;
    pocket.material.emissive.set(won ? 0xffbd45 : 0xff4055);
    pocket.material.emissiveIntensity = won ? 1.15 : 0.65;
    window.setTimeout(() => {
      pocket.material.emissive.set(pocketColor(result));
      pocket.material.emissiveIntensity = pocket.userData.baseEmissive;
    }, this.reducedMotion ? 420 : 1500);
  }

  setResult(result) {
    if (!this.ready) return;
    const index = this.order.indexOf(String(result));
    if (index < 0) return;
    this.rotorAngle = normalizeAngle(this.rotorAngle + 0.34);
    this.rotorGroup.rotation.y = this.rotorAngle;
    this.ballAngle = this.baseAngle(index) - this.rotorAngle;
    this.ballRadius = POCKET_RADIUS;
    this.ballHeight = 0.66;
    this.updateBallTransform();
  }

  reset() {
    this.clearEffects();
    this.spinState = null;
    this.spinning = false;
    this.phase = 'idle';
    this.container.dataset.phase = 'idle';
    this.rotorAngle = 0;
    this.wheelOmega = 0;
    this.rotorGroup.rotation.y = 0;
    this.ballAngle = this.launchAngle;
    this.ballAngularVelocity = 0;
    this.ballRadius = LAUNCH_RADIUS;
    this.ballHeight = 1.22;
    this.ballRadialVelocity = 0;
    this.ballBounceHeight = 0;
    this.ballBounceVelocity = 0;
    this.updateBallTransform();
    this.controls.enabled = true;
    this.controls.target.copy(this.homeTarget);
    this.camera.position.copy(this.homeCamera);
    this.container.classList.remove('is-spinning', 'is-win', 'is-loss');
  }

  spawnConfetti(baseColor) {
    const origin = this.getBallWorldPosition().add(new THREE.Vector3(0, 0.25, 0));
    const palette = [0xffd36b, 0xffffff, baseColor, 0x66e7c1];
    for (let i = 0; i < 38; i++) {
      const piece = new THREE.Mesh(
        new THREE.BoxGeometry(0.035 + Math.random() * 0.04, 0.018, 0.055 + Math.random() * 0.06),
        new THREE.MeshBasicMaterial({ color: palette[i % palette.length], transparent: true, opacity: 1 })
      );
      piece.position.copy(origin);
      piece.rotation.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU);
      this.scene.add(piece);
      this.confetti.push({
        mesh: piece,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 3.2, 1.7 + Math.random() * 3.2, (Math.random() - 0.5) * 3.2),
        life: 1 + Math.random() * 0.65,
        age: 0,
        spin: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5)
      });
    }
  }

  spawnPulse(color) {
    const pulse = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.03, 10, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    pulse.rotation.x = Math.PI / 2;
    pulse.position.copy(this.getBallWorldPosition());
    pulse.position.y += 0.03;
    this.scene.add(pulse);
    this.pulses.push({ mesh: pulse, age: 0, life: 0.95 });
  }

  updateEffects(dt) {
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const item = this.confetti[i];
      item.age += dt;
      item.velocity.y -= 5.8 * dt;
      item.mesh.position.addScaledVector(item.velocity, dt);
      item.mesh.rotation.x += item.spin.x * dt;
      item.mesh.rotation.y += item.spin.y * dt;
      item.mesh.rotation.z += item.spin.z * dt;
      item.mesh.material.opacity = Math.max(0, 1 - item.age / item.life);
      if (item.age >= item.life) {
        this.scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
        this.confetti.splice(i, 1);
      }
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const item = this.pulses[i];
      item.age += dt;
      const progress = item.age / item.life;
      item.mesh.scale.setScalar(1 + progress * 5.5);
      item.mesh.material.opacity = Math.max(0, 0.85 * (1 - progress));
      if (progress >= 1) {
        this.scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
        this.pulses.splice(i, 1);
      }
    }
    this.resultLight.intensity *= Math.pow(0.08, dt);
  }

  clearEffects() {
    for (const item of this.confetti) {
      this.scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      item.mesh.material.dispose();
    }
    for (const item of this.pulses) {
      this.scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      item.mesh.material.dispose();
    }
    this.confetti = [];
    this.pulses = [];
    if (this.resultLight) this.resultLight.intensity = 0;
  }

  updateBallTransform() {
    if (!this.ball) return;
    const local = new THREE.Vector3(
      Math.cos(this.ballAngle) * this.ballRadius,
      this.ballHeight,
      Math.sin(this.ballAngle) * this.ballRadius
    );
    local.y += this.machineRoot?.position.y || 0;
    this.ball.position.copy(local);
    this.ballGlow.position.copy(local);
  }

  getBallWorldPosition() { return this.ball ? this.ball.position.clone() : new THREE.Vector3(); }

  animate(now) {
    if (this.disposed) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.spinState) this.updateSpin(now);
    this.updateEffects(dt);
    if (!this.spinning) this.controls.update();

    const tangentialSpeed = Math.abs(this.ballAngularVelocity * Math.max(this.ballRadius, 0.1));
    this.ball.rotation.x += dt * tangentialSpeed / BALL_RADIUS * 0.55;
    this.ball.rotation.z += dt * tangentialSpeed / BALL_RADIUS * 0.24;
    this.ballGlow.material.opacity = 0.075 + Math.sin(now * 0.004) * 0.018;
    this.bloomPass.strength = 0.44 + (this.resultLight.intensity / 65) * 0.5;
    this.composer.render();
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.bloomPass?.setSize(width, height);
  }

  disposeObject(root) {
    root.traverse(object => {
      object.geometry?.dispose();
      if (!object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.map?.dispose();
        material.dispose();
      }
    });
  }

  dispose() {
    this.disposed = true;
    this.renderer?.setAnimationLoop(null);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.clearEffects();
    if (this.scene) this.disposeObject(this.scene);
    this.composer?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
