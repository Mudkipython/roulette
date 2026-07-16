import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoulettePhysics, ROULETTE_PHYSICS_CONSTANTS } from './roulettePhysics.js';

const TAU = Math.PI * 2;
const { MACHINE_Y, BALL_RADIUS, OUTER_TRACK_RADIUS, POCKET_RADIUS, OUTER_TRACK_Y, POCKET_BALL_Y } = ROULETTE_PHYSICS_CONSTANTS;
const RED_NUMBERS = new Set(['1','3','5','7','9','12','14','16','18','19','21','23','25','27','30','32','34','36']);

function clamp01(value) { return Math.min(1, Math.max(0, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { const x = clamp01(t); return x * x * (3 - 2 * x); }
function easeOutCubic(t) { return 1 - Math.pow(1 - clamp01(t), 3); }
function normalizeAngle(angle) { return ((angle % TAU) + TAU) % TAU; }
function shortestAngle(from, to) {
  let delta = normalizeAngle(to) - normalizeAngle(from);
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return delta;
}
function pocketColor(number) {
  if (number === '0' || number === '00') return 0x087a50;
  return RED_NUMBERS.has(number) ? 0xb62635 : 0x10151d;
}

class CasinoAudio {
  constructor() {
    this.context = null;
    this.effectsEnabled = true;
    this.ambienceEnabled = true;
    this.masterVolume = 0.62;
    this.lastTick = 0;
    this.masterGain = null;
    this.fxGain = null;
    this.ambienceGain = null;
    this.ambienceNodes = [];
    this.ambienceTimer = null;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.fxGain = this.context.createGain();
      this.ambienceGain = this.context.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.fxGain.gain.value = 1;
      this.ambienceGain.gain.value = 1;
      this.fxGain.connect(this.masterGain);
      this.ambienceGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
    }
    return this.context;
  }

  async unlock() {
    const ctx = this.ensure();
    if (!ctx) return false;
    if (ctx.state === 'suspended') await ctx.resume();
    if (this.ambienceEnabled) this.startAmbience();
    return ctx.state === 'running';
  }

  setEffectsEnabled(enabled) { this.effectsEnabled = Boolean(enabled); }

  setAmbienceEnabled(enabled) {
    this.ambienceEnabled = Boolean(enabled);
    if (!this.ambienceEnabled) this.stopAmbience();
    else if (this.context?.state === 'running') this.startAmbience();
  }

  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.context.currentTime, 0.035);
    }
  }

  tone(frequency, duration = 0.05, volume = 0.015, type = 'sine', delay = 0, destination = 'fx') {
    if (destination === 'fx' && !this.effectsEnabled) return;
    if (destination === 'ambience' && !this.ambienceEnabled) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(destination === 'ambience' ? this.ambienceGain : this.fxGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  makeNoiseBuffer(seconds = 4) {
    const ctx = this.ensure();
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[i] = last * 3.4;
    }
    return buffer;
  }

  startAmbience() {
    if (!this.ambienceEnabled || this.ambienceNodes.length) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;

    const roomSource = ctx.createBufferSource();
    roomSource.buffer = this.makeNoiseBuffer(5);
    roomSource.loop = true;
    const roomFilter = ctx.createBiquadFilter();
    roomFilter.type = 'lowpass';
    roomFilter.frequency.value = 780;
    roomFilter.Q.value = 0.7;
    const roomGain = ctx.createGain();
    roomGain.gain.value = 0.032;
    roomSource.connect(roomFilter).connect(roomGain).connect(this.ambienceGain);
    roomSource.start();

    const murmurSource = ctx.createBufferSource();
    murmurSource.buffer = this.makeNoiseBuffer(6);
    murmurSource.loop = true;
    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 430;
    murmurFilter.Q.value = 0.55;
    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.012;
    murmurSource.connect(murmurFilter).connect(murmurGain).connect(this.ambienceGain);
    murmurSource.start();

    const padBus = ctx.createGain();
    padBus.gain.value = 0.012;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 620;
    padBus.connect(padFilter).connect(this.ambienceGain);
    const padOscillators = [110, 138.59, 164.81].map((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index === 1 ? 'triangle' : 'sine';
      osc.frequency.value = frequency;
      osc.detune.value = (index - 1) * 3;
      gain.gain.value = index === 1 ? 0.42 : 0.32;
      osc.connect(gain).connect(padBus);
      osc.start();
      return osc;
    });
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.004;
    lfo.connect(lfoGain).connect(padBus.gain);
    lfo.start();

    this.ambienceNodes = [roomSource, murmurSource, ...padOscillators, lfo];
    const scheduleDistantCasinoDetail = () => {
      if (!this.ambienceEnabled || !this.context || this.context.state !== 'running') return;
      const base = 820 + Math.random() * 600;
      this.tone(base, 0.025, 0.0045, 'triangle', 0, 'ambience');
      if (Math.random() > 0.55) this.tone(base * 1.22, 0.018, 0.003, 'sine', 0.055, 'ambience');
      this.ambienceTimer = window.setTimeout(scheduleDistantCasinoDetail, 3200 + Math.random() * 5200);
    };
    this.ambienceTimer = window.setTimeout(scheduleDistantCasinoDetail, 1800);
  }

  stopAmbience() {
    if (this.ambienceTimer) window.clearTimeout(this.ambienceTimer);
    this.ambienceTimer = null;
    for (const node of this.ambienceNodes) {
      try { node.stop?.(); } catch {}
      try { node.disconnect?.(); } catch {}
    }
    this.ambienceNodes = [];
  }

  launch() {
    this.tone(165, 0.11, 0.025, 'sawtooth');
    this.tone(390, 0.08, 0.014, 'triangle', 0.05);
  }
  rolling(speed) {
    const now = performance.now();
    const interval = Math.max(42, 145 - speed * 10);
    if (now - this.lastTick < interval) return;
    this.lastTick = now;
    this.tone(590 + speed * 55, 0.014, 0.0045, 'square');
  }
  deflector() {
    this.tone(1040, 0.024, 0.019, 'square');
    this.tone(630, 0.04, 0.012, 'triangle', 0.012);
  }
  pocket() {
    this.tone(480, 0.05, 0.02, 'triangle');
    this.tone(305, 0.09, 0.014, 'sine', 0.035);
  }
  win() {
    [523.25, 659.25, 783.99].forEach((frequency, index) => this.tone(frequency, 0.22, 0.025, 'sine', index * 0.075));
  }
  lose() { this.tone(190, 0.16, 0.018, 'triangle'); }
  dispose() {
    this.stopAmbience();
    this.context?.close?.().catch?.(() => {});
  }
}

export class RouletteScene {
  constructor(container, options = {}) {
    this.container = container;
    this.order = [...(options.order || [])];
    this.onPocketClick = options.onPocketClick || null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.audio = new CasinoAudio();
    this.ready = false;
    this.disposed = false;
    this.spinning = false;
    this.phase = 'idle';
    this.spinState = null;
    this.physics = null;
    this.lastPhysicsSnapshot = null;
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.hoveredPocket = null;
    this.confetti = [];
    this.pulses = [];
  }

  async init() {
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.04;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.domElement.className = 'roulette-webgl-canvas';
      this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D roulette wheel. Drag to orbit and use the wheel or pinch to zoom.');
      this.container.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x06101b);
      this.scene.fog = new THREE.FogExp2(0x06101b, 0.022);

      this.cameraTarget = new THREE.Vector3(0, 0.82, 0);
      this.defaultCameraPosition = new THREE.Vector3(0, 12.9, 9.3);
      this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
      this.camera.position.copy(this.defaultCameraPosition);
      this.camera.lookAt(this.cameraTarget);
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.target.copy(this.cameraTarget);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.075;
      this.controls.enablePan = false;
      this.controls.minDistance = 10.2;
      this.controls.maxDistance = 18.2;
      this.controls.minPolarAngle = 0.40;
      this.controls.maxPolarAngle = 1.08;
      this.controls.minAzimuthAngle = -0.78;
      this.controls.maxAzimuthAngle = 0.78;
      this.controls.rotateSpeed = 0.42;
      this.controls.zoomSpeed = 0.78;
      this.controls.zoomToCursor = true;
      this.controls.saveState();

      this.buildLighting();
      this.buildEnvironment();
      this.buildMachine();
      this.buildBall();
      this.buildPostProcessing();
      this.bindPointerInteraction();
      this.physics = await RoulettePhysics.create(this.order);
      this.syncPhysicsSnapshot(this.physics.snapshot());

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
    this.scene.add(new THREE.HemisphereLight(0xc7ddff, 0x1d0c06, 1.7));

    const key = new THREE.DirectionalLight(0xffdfaa, 3.1);
    key.position.set(7, 14, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -9;
    key.shadow.camera.right = 9;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    this.scene.add(key);

    const fill = new THREE.PointLight(0x55bfff, 33, 24, 2);
    fill.position.set(-6, 6, -5);
    this.scene.add(fill);

    this.resultLight = new THREE.PointLight(0xffc95f, 0, 14, 2);
    this.resultLight.position.set(0, 4.4, 0);
    this.scene.add(this.resultLight);
  }

  buildEnvironment() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(25, 96),
      new THREE.MeshStandardMaterial({ color: 0x071b18, roughness: 0.96, metalness: 0.01 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(8.25, 8.65, 0.72, 96),
      new THREE.MeshStandardMaterial({ color: 0x063a2f, roughness: 0.78, metalness: 0.05 })
    );
    table.position.y = 0.23;
    table.receiveShadow = true;
    table.castShadow = true;
    this.scene.add(table);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(8.12, 0.18, 18, 128),
      new THREE.MeshStandardMaterial({ color: 0x9c6728, roughness: 0.3, metalness: 0.66 })
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
      new THREE.CylinderGeometry(6.44, 6.56, 0.56, 128),
      new THREE.MeshStandardMaterial({ color: 0x29170d, roughness: 0.26, metalness: 0.52 })
    );
    casing.castShadow = true;
    casing.receiveShadow = true;
    this.machineRoot.add(casing);

    const outerGold = new THREE.Mesh(
      new THREE.TorusGeometry(6.21, 0.16, 20, 160),
      new THREE.MeshStandardMaterial({ color: 0xd4a54d, roughness: 0.18, metalness: 0.9, emissive: 0x2d1600, emissiveIntensity: 0.16 })
    );
    outerGold.rotation.x = Math.PI / 2;
    outerGold.position.y = 0.47;
    this.machineRoot.add(outerGold);

    const track = new THREE.Mesh(
      new THREE.TorusGeometry(OUTER_TRACK_RADIUS, 0.24, 22, 160),
      new THREE.MeshStandardMaterial({ color: 0xc8b17c, roughness: 0.23, metalness: 0.72 })
    );
    track.rotation.x = Math.PI / 2;
    track.position.y = 1.13;
    track.castShadow = true;
    track.receiveShadow = true;
    this.machineRoot.add(track);

    const bowlPoints = [
      new THREE.Vector2(3.55, 0.42),
      new THREE.Vector2(4.35, 0.48),
      new THREE.Vector2(4.92, 0.58),
      new THREE.Vector2(5.40, 0.79),
      new THREE.Vector2(5.78, 1.02),
      new THREE.Vector2(5.98, 1.18)
    ];
    const bowl = new THREE.Mesh(
      new THREE.LatheGeometry(bowlPoints, 128),
      new THREE.MeshStandardMaterial({ color: 0xa28b61, roughness: 0.32, metalness: 0.5, side: THREE.DoubleSide })
    );
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    this.machineRoot.add(bowl);

    this.deflectorGroup = new THREE.Group();
    const deflectorMaterial = new THREE.MeshStandardMaterial({ color: 0xdab25d, roughness: 0.2, metalness: 0.86 });
    for (let i = 0; i < 8; i++) {
      const angle = i * TAU / 8 + Math.PI / 8;
      const deflector = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 4), deflectorMaterial);
      const radius = i % 2 === 0 ? 5.24 : 5.10;
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
      new THREE.CylinderGeometry(5.18, 5.32, 0.46, 128),
      new THREE.MeshStandardMaterial({ color: 0x18283b, roughness: 0.27, metalness: 0.57 })
    );
    rotorBase.position.y = 0.32;
    rotorBase.castShadow = true;
    rotorBase.receiveShadow = true;
    this.rotorGroup.add(rotorBase);

    this.pocketsGroup = new THREE.Group();
    this.pocketsGroup.position.y = 0.57;
    this.rotorGroup.add(this.pocketsGroup);
    this.pocketMeshes = [];

    const arc = TAU / this.order.length;
    const separatorMaterial = new THREE.MeshStandardMaterial({ color: 0xe7bd62, roughness: 0.2, metalness: 0.88 });

    for (let i = 0; i < this.order.length; i++) {
      const center = this.baseAngle(i);
      const number = this.order[i];
      const geometry = this.createHorizontalSectorGeometry(3.82, 5.03, center - arc * 0.48, center + arc * 0.48);
      const material = new THREE.MeshStandardMaterial({
        color: pocketColor(number),
        roughness: 0.42,
        metalness: 0.2,
        emissive: pocketColor(number),
        emissiveIntensity: 0.035,
        side: THREE.DoubleSide
      });
      const pocket = new THREE.Mesh(geometry, material);
      pocket.userData = { number, index: i, baseEmissive: 0.035 };
      pocket.receiveShadow = true;
      this.pocketsGroup.add(pocket);
      this.pocketMeshes.push(pocket);

      const label = this.createNumberLabel(number);
      label.position.set(Math.cos(center) * 4.47, 0.055, Math.sin(center) * 4.47);
      this.pocketsGroup.add(label);

      const boundary = center - arc * 0.5;
      const separator = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.21, 1.23), separatorMaterial);
      separator.position.set(Math.cos(boundary) * 4.42, 0.10, Math.sin(boundary) * 4.42);
      separator.rotation.y = -boundary + Math.PI / 2;
      separator.castShadow = true;
      this.pocketsGroup.add(separator);
    }

    const outerPocketWall = new THREE.Mesh(
      new THREE.TorusGeometry(5.06, 0.075, 12, 160),
      separatorMaterial
    );
    outerPocketWall.rotation.x = Math.PI / 2;
    outerPocketWall.position.y = 0.12;
    this.pocketsGroup.add(outerPocketWall);

    const innerPocketWall = new THREE.Mesh(
      new THREE.TorusGeometry(3.79, 0.07, 12, 160),
      separatorMaterial
    );
    innerPocketWall.rotation.x = Math.PI / 2;
    innerPocketWall.position.y = 0.12;
    this.pocketsGroup.add(innerPocketWall);

    const innerCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 3.68, 0.68, 96),
      new THREE.MeshStandardMaterial({ color: 0x183650, roughness: 0.25, metalness: 0.56 })
    );
    innerCone.position.y = 0.73;
    innerCone.castShadow = true;
    this.rotorGroup.add(innerCone);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 1.22, 0.78, 64),
      new THREE.MeshStandardMaterial({ color: 0xd9ab4f, roughness: 0.17, metalness: 0.9, emissive: 0x2c1600, emissiveIntensity: 0.18 })
    );
    hub.position.y = 1.24;
    hub.castShadow = true;
    this.rotorGroup.add(hub);

    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.17, 1.75, 24),
      new THREE.MeshStandardMaterial({ color: 0xffd982, roughness: 0.12, metalness: 0.96 })
    );
    spindle.position.y = 2.16;
    this.rotorGroup.add(spindle);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.31, 28, 18),
      new THREE.MeshStandardMaterial({ color: 0xffd16a, roughness: 0.14, metalness: 0.92 })
    );
    cap.position.y = 3.04;
    this.rotorGroup.add(cap);
  }

  buildLauncher() {
    const launcher = new THREE.Group();
    const angle = 0.15;
    launcher.position.set(Math.cos(angle) * 6.34, 1.28, Math.sin(angle) * 6.34);
    launcher.rotation.y = -angle;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.38, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x202b39, roughness: 0.27, metalness: 0.72 })
    );
    body.castShadow = true;
    launcher.add(body);

    const mouth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.19, 0.52, 28),
      new THREE.MeshStandardMaterial({ color: 0xc5a568, roughness: 0.18, metalness: 0.82 })
    );
    mouth.rotation.x = Math.PI / 2;
    mouth.position.z = -0.49;
    launcher.add(mouth);
    this.machineRoot.add(launcher);
  }

  buildBall() {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.07,
      metalness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      emissive: 0xb7dcff,
      emissiveIntensity: 0.05
    });
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 32, 22), material);
    this.ball.castShadow = true;
    this.machineRoot.add(this.ball);

    this.ballGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xaedfff, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.machineRoot.add(this.ballGlow);
    this.updateBallTransform();
  }

  buildPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.34, 0.86);
    this.composer.addPass(this.bloomPass);
  }

  createHorizontalSectorGeometry(innerRadius, outerRadius, startAngle, endAngle) {
    const shape = new THREE.Shape();
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const angle = lerp(startAngle, endAngle, i / segments);
      const x = Math.cos(angle) * outerRadius;
      const y = -Math.sin(angle) * outerRadius;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    for (let i = segments; i >= 0; i--) {
      const angle = lerp(startAngle, endAngle, i / segments);
      shape.lineTo(Math.cos(angle) * innerRadius, -Math.sin(angle) * innerRadius);
    }
    shape.closePath();
    const geometry = new THREE.ShapeGeometry(shape, 8);
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }

  createNumberLabel(number) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${String(number).length > 1 ? 46 : 54}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.75)';
    ctx.shadowBlur = 8;
    ctx.fillText(String(number), 64, 66);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true }));
    sprite.scale.set(0.64, 0.64, 0.64);
    return sprite;
  }

  surfaceHeight(radius) {
    if (radius >= 5.95) return 1.16;
    if (radius <= 4.45) return 0.58;
    const t = (radius - 4.45) / 1.5;
    return lerp(0.58, 1.16, smoothstep(t));
  }

  baseAngle(index) {
    return Math.PI / 2 - index * TAU / this.order.length;
  }

  bindPointerInteraction() {
    const canvas = this.renderer.domElement;
    let pointerStart = null;
    let dragged = false;

    const updatePointer = event => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.pocketMeshes, false);
      return hits[0]?.object || null;
    };

    canvas.addEventListener('pointerdown', event => {
      pointerStart = { x: event.clientX, y: event.clientY };
      dragged = false;
      canvas.classList.add('is-grabbing');
    });

    canvas.addEventListener('pointermove', event => {
      if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) dragged = true;
      if (dragged) {
        if (this.hoveredPocket) this.hoveredPocket.material.emissiveIntensity = this.hoveredPocket.userData.baseEmissive;
        this.hoveredPocket = null;
        canvas.style.cursor = 'grabbing';
        return;
      }
      const pocket = updatePointer(event);
      if (this.hoveredPocket && this.hoveredPocket !== pocket) {
        this.hoveredPocket.material.emissiveIntensity = this.hoveredPocket.userData.baseEmissive;
      }
      this.hoveredPocket = pocket;
      if (pocket) {
        pocket.material.emissiveIntensity = 0.25;
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'grab';
      }
    });

    canvas.addEventListener('pointerup', event => {
      canvas.classList.remove('is-grabbing');
      const shouldSelect = pointerStart && !dragged;
      pointerStart = null;
      if (!shouldSelect) return;
      const pocket = updatePointer(event);
      if (pocket && typeof this.onPocketClick === 'function') this.onPocketClick(pocket.userData.number);
    });

    canvas.addEventListener('pointercancel', () => {
      pointerStart = null;
      dragged = false;
      canvas.classList.remove('is-grabbing');
    });

    canvas.addEventListener('pointerleave', () => {
      if (this.hoveredPocket) this.hoveredPocket.material.emissiveIntensity = this.hoveredPocket.userData.baseEmissive;
      this.hoveredPocket = null;
      pointerStart = null;
      dragged = false;
      canvas.classList.remove('is-grabbing');
      canvas.style.cursor = 'grab';
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
    if (this.machineRoot && this.ball) {
      this.machineRoot.remove(this.ball);
      this.machineRoot.remove(this.ballGlow);
    }
    this.order = [...order];
    this.buildMachine();
    if (this.ball) {
      this.machineRoot.add(this.ball);
      this.machineRoot.add(this.ballGlow);
    }
    this.physics?.setOrder(this.order);
    if (this.physics) this.syncPhysicsSnapshot(this.physics.snapshot());
  }

  setSound(enabled) { this.audio.setEffectsEnabled(enabled); }
  setAmbience(enabled) { this.audio.setAmbienceEnabled(enabled); }
  setMasterVolume(value) { this.audio.setMasterVolume(value); }
  unlockAudio() { return this.audio.unlock(); }
  resetCamera() {
    if (!this.controls) return;
    this.controls.reset();
    this.camera.position.copy(this.defaultCameraPosition);
    this.controls.target.copy(this.cameraTarget);
    this.controls.update();
  }
  getCameraState() {
    return { position: this.camera?.position?.toArray?.() || [], target: this.controls?.target?.toArray?.() || [] };
  }

  spin(hooks = {}) {
    if (!this.ready || this.spinning || !this.physics) return Promise.resolve(null);
    this.clearEffects();
    this.audio.launch();
    this.spinning = true;
    this.container.classList.add('is-spinning');
    this.container.classList.remove('is-win', 'is-loss', 'is-push');
    this.physics.launch();
    const initial = this.physics.snapshot();
    this.syncPhysicsSnapshot(initial);
    this.spinState = {
      hooks,
      resolve: null,
      lastCountdown: null,
      betsClosed: false,
      lastMode: initial.mode,
      lastPhase: initial.phase
    };
    this.setPhase('betting-open', { seconds: initial.countdown });
    return new Promise(resolve => { this.spinState.resolve = resolve; });
  }

  // Backward-compatible alias. The result is now determined by the simulated
  // motion instead of being supplied by the caller.
  spinTo(_ignoredResult, hooks = {}) { return this.spin(hooks); }

  updatePhysicalSpin(dt) {
    const state = this.spinState;
    if (!state || !this.physics) return;
    const snapshot = this.physics.step(dt);
    this.syncPhysicsSnapshot(snapshot);

    if (!snapshot.betsClosed && snapshot.countdown !== state.lastCountdown) {
      state.lastCountdown = snapshot.countdown;
      this.emit('roulette-countdown', { seconds: snapshot.countdown });
    }

    if (snapshot.betsClosed && !state.betsClosed) {
      state.betsClosed = true;
      this.setPhase('bets-closed');
      this.emit('roulette-bets-closed', { resultPending: true });
    }

    if (snapshot.phase !== state.lastPhase) {
      state.lastPhase = snapshot.phase;
      if (snapshot.phase === 'descending') this.setPhase('descending');
      if (snapshot.phase === 'settling') {
        this.audio.deflector();
        this.setPhase('settling');
      }
    }

    const velocity = snapshot.ballVelocity;
    const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
    if (speed > 0.25) this.audio.rolling(Math.min(8, speed * 0.45));

    if (snapshot.phase === 'resolved' && snapshot.result != null) {
      this.finishPhysicalSpin(snapshot.result);
    }
  }

  finishPhysicalSpin(result) {
    const state = this.spinState;
    if (!state) return;
    this.audio.pocket();
    const resolve = state.resolve;
    this.spinState = null;
    this.spinning = false;
    this.container.classList.remove('is-spinning');
    this.setPhase('resolved', { result });
    if (resolve) resolve(String(result));
  }

  syncPhysicsSnapshot(snapshot) {
    if (!snapshot || !this.ball || !this.rotorGroup) return;
    this.lastPhysicsSnapshot = snapshot;
    const p = snapshot.ballPosition;
    const q = snapshot.ballRotation;
    const rq = snapshot.rotorRotation;
    this.ball.position.set(p.x, p.y - MACHINE_Y, p.z);
    this.ball.quaternion.set(q.x, q.y, q.z, q.w);
    this.ballGlow.position.copy(this.ball.position);
    this.rotorGroup.quaternion.set(rq.x, rq.y, rq.z, rq.w);
  }

  resolveResult(net, result) {
    if (!this.ready) return Promise.resolve();
    const won = net > 0;
    const lost = net < 0;
    this.resultLight.color.set(won ? 0xffc861 : lost ? 0xff596a : 0x7aa7ff);
    this.resultLight.intensity = won ? 52 : lost ? 18 : 12;
    this.container.classList.add(won ? 'is-win' : lost ? 'is-loss' : 'is-push');
    if (won) {
      this.audio.win();
      this.spawnConfetti(pocketColor(String(result)));
      this.spawnPulse(0xffd875);
    } else if (lost) {
      this.audio.lose();
      this.spawnPulse(0xff596a);
    }
    this.highlightPocket(String(result), won);
    return new Promise(resolve => window.setTimeout(resolve, this.reducedMotion ? 260 : 650));
  }

  highlightPocket(result, won) {
    const pocket = this.pocketMeshes.find(mesh => mesh.userData.number === result);
    if (!pocket) return;
    pocket.material.emissive.set(won ? 0xffbd45 : 0x5ab7ff);
    pocket.material.emissiveIntensity = won ? 1.0 : 0.65;
    window.setTimeout(() => {
      pocket.material.emissive.set(pocketColor(result));
      pocket.material.emissiveIntensity = pocket.userData.baseEmissive;
    }, this.reducedMotion ? 420 : 1500);
  }

  setResult(result) {
    if (!this.ready || !this.physics) return;
    this.physics.placeBallInPocket(String(result));
    this.syncPhysicsSnapshot(this.physics.snapshot());
  }

  reset() {
    this.clearEffects();
    this.spinState = null;
    this.spinning = false;
    this.phase = 'idle';
    this.physics?.reset();
    if (this.physics) this.syncPhysicsSnapshot(this.physics.snapshot());
    this.container.classList.remove('is-spinning', 'is-win', 'is-loss', 'is-push');
  }

  spawnConfetti(color) {
    if (this.reducedMotion) return;
    for (let i = 0; i < 52; i++) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.10, 0.19),
        new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffd76a : color, side: THREE.DoubleSide })
      );
      mesh.position.set((Math.random() - 0.5) * 4, 4.2 + Math.random() * 2.5, (Math.random() - 0.5) * 4);
      this.scene.add(mesh);
      this.confetti.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 2.2, 0.2 + Math.random() * 1.4, (Math.random() - 0.5) * 2.2),
        spin: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
        life: 2.3 + Math.random() * 1.2
      });
    }
  }

  spawnPulse(color) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(3.8, 3.9, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 1.16;
    this.scene.add(mesh);
    this.pulses.push({ mesh, life: 1.0 });
  }

  updateEffects(dt) {
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const item = this.confetti[i];
      item.life -= dt;
      item.velocity.y -= 2.7 * dt;
      item.mesh.position.addScaledVector(item.velocity, dt);
      item.mesh.rotation.x += item.spin.x * dt;
      item.mesh.rotation.y += item.spin.y * dt;
      item.mesh.rotation.z += item.spin.z * dt;
      if (item.life <= 0) {
        this.scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
        this.confetti.splice(i, 1);
      }
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const item = this.pulses[i];
      item.life -= dt;
      const progress = 1 - item.life;
      item.mesh.scale.setScalar(1 + progress * 0.55);
      item.mesh.material.opacity = Math.max(0, item.life) * 0.55;
      if (item.life <= 0) {
        this.scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
        this.pulses.splice(i, 1);
      }
    }
    this.resultLight.intensity *= Math.pow(0.08, dt);
  }

  clearEffects() {
    this.container.classList.remove('is-win', 'is-loss', 'is-push');
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
    if (this.physics) this.syncPhysicsSnapshot(this.physics.snapshot());
  }

  animate(now) {
    if (this.disposed) return;
    if (!this.lastFrame) this.lastFrame = now;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;

    if (this.spinState) this.updatePhysicalSpin(dt);
    this.controls?.update();
    this.updateEffects(dt);

    this.ballGlow.material.opacity = 0.058 + Math.sin(now * 0.004) * 0.010;
    this.bloomPass.strength = 0.34 + (this.resultLight.intensity / 52) * 0.38;
    this.composer.render();
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  disposeObject(root) {
    root.traverse(object => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose?.());
      else object.material?.dispose?.();
      if (object.material?.map) object.material.map.dispose?.();
    });
  }

  dispose() {
    this.disposed = true;
    this.renderer?.setAnimationLoop(null);
    this.resizeObserver?.disconnect();
    this.clearEffects();
    this.disposeObject(this.scene);
    this.controls?.dispose?.();
    this.audio?.dispose?.();
    this.composer?.dispose?.();
    this.physics?.free();
    this.renderer?.dispose();
    this.renderer?.domElement?.remove();
  }
}
