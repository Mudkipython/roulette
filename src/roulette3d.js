import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const TAU = Math.PI * 2;
const RED_NUMBERS = new Set(['1','3','5','7','9','12','14','16','18','19','21','23','25','27','30','32','34','36']);

function clamp01(value) { return Math.min(1, Math.max(0, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
function shortestAngle(from, to) {
  let delta = (to - from) % TAU;
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
    this.lastTick = 0;
  }
  setEnabled(enabled) { this.enabled = Boolean(enabled); }
  ensure() {
    if (!this.enabled) return null;
    if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  }
  tone(frequency, duration = 0.05, volume = 0.025, type = 'sine', delay = 0) {
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
    oscillator.stop(start + duration + 0.01);
  }
  tick(speed = 1) {
    const now = performance.now();
    if (now - this.lastTick < Math.max(22, 68 / speed)) return;
    this.lastTick = now;
    this.tone(900 + Math.min(900, speed * 120), 0.022, 0.012, 'square');
  }
  launch() {
    this.tone(180, 0.12, 0.045, 'sawtooth');
    this.tone(340, 0.10, 0.025, 'triangle', 0.05);
  }
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.34, 0.045, 'sine', i * 0.08));
  }
  lose() {
    this.tone(220, 0.22, 0.035, 'sawtooth');
    this.tone(155, 0.28, 0.03, 'triangle', 0.12);
  }
}

export class RouletteScene {
  constructor(container, options = {}) {
    this.container = container;
    this.order = options.order || [];
    this.cinematic = options.cinematic !== false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.audio = new CasinoAudio();
    this.ready = false;
    this.spinning = false;
    this.wheelAngle = 0;
    this.ballAngle = Math.PI * 0.15;
    this.ballRadius = 5.72;
    this.ballHeight = 1.22;
    this.resultAngle = 0;
    this.animation = null;
    this.returnCameraAnimation = null;
    this.lastPocketStep = null;
    this.homeCamera = new THREE.Vector3(0, 8.7, 10.8);
    this.homeTarget = new THREE.Vector3(0, 0.5, 0);
    this.clock = new THREE.Clock();
    this.confetti = [];
    this.pulses = [];
    this.resizeObserver = null;
    this.disposed = false;
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
      this.renderer.toneMappingExposure = 1.08;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D roulette wheel');
      this.renderer.domElement.className = 'roulette-webgl-canvas';
      this.container.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x06101c);
      this.scene.fog = new THREE.FogExp2(0x06101c, 0.026);
      this.camera = new THREE.PerspectiveCamera(39, 1, 0.1, 80);
      this.camera.position.copy(this.homeCamera);

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.055;
      this.controls.minDistance = 7.8;
      this.controls.maxDistance = 17;
      this.controls.minPolarAngle = 0.32;
      this.controls.maxPolarAngle = 1.32;
      this.controls.target.copy(this.homeTarget);
      this.controls.enablePan = false;

      this.buildLighting();
      this.buildEnvironment();
      this.buildWheel();
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
    const hemisphere = new THREE.HemisphereLight(0xb8d9ff, 0x1b0c06, 1.8);
    this.scene.add(hemisphere);

    const key = new THREE.DirectionalLight(0xffe1ad, 3.4);
    key.position.set(6, 12, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -9;
    key.shadow.camera.right = 9;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    this.scene.add(key);

    this.rimLight = new THREE.PointLight(0x63c9ff, 55, 25, 2);
    this.rimLight.position.set(-6, 5, -4);
    this.scene.add(this.rimLight);

    this.resultLight = new THREE.PointLight(0xffc861, 0, 14, 2);
    this.resultLight.position.set(0, 4, 0);
    this.scene.add(this.resultLight);
  }

  buildEnvironment() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(24, 96),
      new THREE.MeshStandardMaterial({ color: 0x081a18, roughness: 0.92, metalness: 0.02 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(8.3, 8.7, 0.72, 96),
      new THREE.MeshStandardMaterial({ color: 0x073b31, roughness: 0.72, metalness: 0.08 })
    );
    table.position.y = 0.22;
    table.receiveShadow = true;
    table.castShadow = true;
    this.scene.add(table);

    const tableRim = new THREE.Mesh(
      new THREE.TorusGeometry(8.15, 0.18, 18, 128),
      new THREE.MeshStandardMaterial({ color: 0x966125, roughness: 0.32, metalness: 0.58 })
    );
    tableRim.rotation.x = Math.PI / 2;
    tableRim.position.y = 0.62;
    tableRim.castShadow = true;
    this.scene.add(tableRim);

    const feltRing = new THREE.Mesh(
      new THREE.RingGeometry(6.45, 7.75, 96),
      new THREE.MeshStandardMaterial({ color: 0x0b5a45, roughness: 0.9, side: THREE.DoubleSide })
    );
    feltRing.rotation.x = -Math.PI / 2;
    feltRing.position.y = 0.6;
    feltRing.receiveShadow = true;
    this.scene.add(feltRing);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 360;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 10 + Math.random() * 24;
      const angle = Math.random() * TAU;
      positions[i*3] = Math.cos(angle) * radius;
      positions[i*3+1] = 2 + Math.random() * 12;
      positions[i*3+2] = Math.sin(angle) * radius;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x6fa7d6, size: 0.045, transparent: true, opacity: 0.38, depthWrite: false }));
    this.scene.add(stars);
  }

  buildWheel() {
    if (this.wheelRoot) {
      this.scene.remove(this.wheelRoot);
      this.disposeObject(this.wheelRoot);
    }
    this.wheelRoot = new THREE.Group();
    this.wheelRoot.position.y = 0.55;
    this.scene.add(this.wheelRoot);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(6.25, 6.38, 0.58, 96),
      new THREE.MeshStandardMaterial({ color: 0x26150d, roughness: 0.24, metalness: 0.52 })
    );
    base.castShadow = true;
    base.receiveShadow = true;
    this.wheelRoot.add(base);

    const outerGold = new THREE.Mesh(
      new THREE.TorusGeometry(6.05, 0.16, 18, 128),
      new THREE.MeshStandardMaterial({ color: 0xd5a84a, roughness: 0.18, metalness: 0.88, emissive: 0x2d1600, emissiveIntensity: 0.25 })
    );
    outerGold.rotation.x = Math.PI / 2;
    outerGold.position.y = 0.32;
    outerGold.castShadow = true;
    this.wheelRoot.add(outerGold);

    const track = new THREE.Mesh(
      new THREE.TorusGeometry(5.69, 0.23, 20, 128),
      new THREE.MeshStandardMaterial({ color: 0xc6ad78, roughness: 0.2, metalness: 0.78 })
    );
    track.rotation.x = Math.PI / 2;
    track.position.y = 0.58;
    track.castShadow = true;
    this.wheelRoot.add(track);

    this.pocketsGroup = new THREE.Group();
    this.pocketsGroup.position.y = 0.3;
    this.wheelRoot.add(this.pocketsGroup);
    this.pocketMeshes = [];

    const arc = TAU / this.order.length;
    for (let i = 0; i < this.order.length; i++) {
      const start = this.baseAngle(i) - arc * 0.48;
      const end = this.baseAngle(i) + arc * 0.48;
      const geometry = this.createRingSectorGeometry(3.72, 5.34, start, end, 0.22);
      const number = this.order[i];
      const material = new THREE.MeshStandardMaterial({
        color: pocketColor(number),
        roughness: 0.42,
        metalness: 0.2,
        emissive: pocketColor(number),
        emissiveIntensity: 0.035
      });
      const pocket = new THREE.Mesh(geometry, material);
      pocket.castShadow = true;
      pocket.receiveShadow = true;
      pocket.userData = { number, index: i, baseEmissive: 0.035 };
      this.pocketsGroup.add(pocket);
      this.pocketMeshes.push(pocket);

      const label = this.createNumberLabel(number, pocketColor(number));
      const angle = this.baseAngle(i);
      const radius = 4.62;
      label.position.set(Math.cos(angle) * radius, 0.28, Math.sin(angle) * radius);
      label.rotation.x = -Math.PI / 2;
      label.rotation.z = -angle + Math.PI / 2;
      label.userData = { number, index: i };
      this.pocketsGroup.add(label);

      const separator = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.26, 1.62),
        new THREE.MeshStandardMaterial({ color: 0xe5bd62, roughness: 0.22, metalness: 0.82 })
      );
      separator.position.set(Math.cos(start) * 4.52, 0.23, Math.sin(start) * 4.52);
      separator.rotation.y = -start + Math.PI / 2;
      separator.castShadow = true;
      this.pocketsGroup.add(separator);
    }

    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(3.72, 3.95, 0.48, 96),
      new THREE.MeshStandardMaterial({ color: 0x102844, roughness: 0.25, metalness: 0.58 })
    );
    bowl.position.y = 0.42;
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    this.wheelRoot.add(bowl);

    const bowlRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.7, 0.09, 14, 96),
      new THREE.MeshStandardMaterial({ color: 0xe3b655, roughness: 0.2, metalness: 0.9 })
    );
    bowlRing.rotation.x = Math.PI / 2;
    bowlRing.position.y = 0.68;
    this.wheelRoot.add(bowlRing);

    const radialMaterial = new THREE.MeshStandardMaterial({ color: 0x41678f, roughness: 0.25, metalness: 0.6, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 12; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 3.1), radialMaterial);
      spoke.position.y = 0.71;
      spoke.rotation.y = i * Math.PI / 6;
      this.wheelRoot.add(spoke);
    }

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.25, 0.75, 64),
      new THREE.MeshStandardMaterial({ color: 0xd7aa4c, roughness: 0.18, metalness: 0.88, emissive: 0x2b1500, emissiveIntensity: 0.25 })
    );
    hub.position.y = 0.9;
    hub.castShadow = true;
    this.wheelRoot.add(hub);

    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 2.1, 24),
      new THREE.MeshStandardMaterial({ color: 0xffdc85, roughness: 0.12, metalness: 0.95 })
    );
    spindle.position.y = 1.75;
    this.wheelRoot.add(spindle);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 32, 18),
      new THREE.MeshStandardMaterial({ color: 0xffd36b, roughness: 0.15, metalness: 0.92 })
    );
    cap.position.y = 2.8;
    this.wheelRoot.add(cap);
  }

  buildBall() {
    const ballMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      emissive: 0xc6e5ff,
      emissiveIntensity: 0.08
    });
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 20), ballMaterial);
    this.ball.castShadow = true;
    this.scene.add(this.ball);

    this.ballGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.scene.add(this.ballGlow);
    this.updateBallTransform();
  }

  buildPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.44, 0.78);
    this.composer.addPass(this.bloomPass);
  }

  createRingSectorGeometry(innerRadius, outerRadius, startAngle, endAngle, depth) {
    const shape = new THREE.Shape();
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const a = lerp(startAngle, endAngle, i / segments);
      const x = Math.cos(a) * outerRadius;
      const y = Math.sin(a) * outerRadius;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    for (let i = segments; i >= 0; i--) {
      const a = lerp(startAngle, endAngle, i / segments);
      shape.lineTo(Math.cos(a) * innerRadius, Math.sin(a) * innerRadius);
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
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '900 78px Inter, Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 9;
    context.strokeStyle = 'rgba(0,0,0,.55)';
    context.strokeText(number, 128, 68);
    context.fillStyle = '#ffffff';
    context.fillText(number, 128, 68);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.37), material);
  }

  baseAngle(index) {
    return -Math.PI / 2 + index * (TAU / Math.max(1, this.order.length));
  }

  bindPointerInteraction() {
    this.renderer.domElement.addEventListener('pointermove', (event) => {
      if (this.spinning) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.pocketMeshes, false)[0];
      const next = hit?.object || null;
      if (next !== this.hoveredPocket) {
        if (this.hoveredPocket) this.hoveredPocket.material.emissiveIntensity = this.hoveredPocket.userData.baseEmissive;
        this.hoveredPocket = next;
        if (this.hoveredPocket) this.hoveredPocket.material.emissiveIntensity = 0.35;
        this.renderer.domElement.style.cursor = next ? 'pointer' : 'grab';
      }
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

  setOrder(order) {
    this.order = [...order];
    this.wheelAngle = 0;
    this.ballAngle = Math.PI * 0.15;
    this.buildWheel();
    this.updateBallTransform();
  }

  setCinematic(enabled) { this.cinematic = Boolean(enabled); }
  setSound(enabled) { this.audio.setEnabled(enabled); }

  spinTo(result) {
    if (!this.ready || this.spinning) return Promise.resolve();
    const index = this.order.indexOf(String(result));
    if (index < 0) return Promise.resolve();
    this.audio.launch();
    this.spinning = true;
    this.controls.enabled = false;
    this.container.classList.add('is-spinning');
    this.container.classList.remove('is-win', 'is-loss');
    this.clearEffects();

    const duration = this.reducedMotion ? 1.45 : 5.9;
    const startWheel = this.wheelAngle;
    const wheelTurns = this.reducedMotion ? 1.3 : 5.35;
    const finalWheel = startWheel + wheelTurns * TAU + 0.22;
    const targetAngle = this.baseAngle(index) + finalWheel;
    const startBall = this.ballAngle;
    let endBall = targetAngle;
    while (endBall > startBall - (this.reducedMotion ? 2.2 : 9.4) * TAU) endBall -= TAU;

    this.animation = {
      startTime: performance.now(),
      duration: duration * 1000,
      startWheel,
      finalWheel,
      startBall,
      endBall,
      result: String(result),
      index,
      resolve: null
    };
    return new Promise(resolve => { this.animation.resolve = resolve; });
  }

  updateSpin(now) {
    if (!this.animation) return;
    const a = this.animation;
    const t = clamp01((now - a.startTime) / a.duration);
    const wheelT = easeOutCubic(t);
    const ballT = easeOutQuint(t);
    this.wheelAngle = lerp(a.startWheel, a.finalWheel, wheelT);
    this.pocketsGroup.rotation.y = -this.wheelAngle;

    this.ballAngle = lerp(a.startBall, a.endBall, ballT);
    const drop = clamp01((t - 0.53) / 0.38);
    const settle = clamp01((t - 0.78) / 0.22);
    this.ballRadius = lerp(5.72, 4.63, easeInOutCubic(drop));
    const bounce = Math.sin(settle * Math.PI * 8) * (1 - settle) * 0.14;
    this.ballHeight = lerp(1.78, 1.06, easeOutCubic(drop)) + Math.abs(bounce);
    this.updateBallTransform();

    const step = Math.floor(Math.abs(this.ballAngle) / (TAU / this.order.length));
    if (step !== this.lastPocketStep) {
      this.lastPocketStep = step;
      const speed = lerp(7, 0.35, t);
      this.audio.tick(speed);
    }

    if (this.cinematic && !this.reducedMotion) this.updateCinematicCamera(t);

    if (t >= 1) {
      this.wheelAngle = a.finalWheel % TAU;
      this.pocketsGroup.rotation.y = -this.wheelAngle;
      this.resultAngle = this.baseAngle(a.index) + a.finalWheel;
      this.ballAngle = this.resultAngle;
      this.ballRadius = 4.63;
      this.ballHeight = 1.055;
      this.updateBallTransform();
      const resolve = a.resolve;
      this.animation = null;
      this.spinning = false;
      this.container.classList.remove('is-spinning');
      if (resolve) resolve();
    }
  }

  updateCinematicCamera(t) {
    const ballWorld = this.getBallWorldPosition();
    let desired = this.homeCamera.clone();
    let target = this.homeTarget.clone();
    if (t < 0.72) {
      const blend = easeInOutCubic(clamp01(t / 0.2));
      const camAngle = this.ballAngle + 0.42;
      const follow = new THREE.Vector3(Math.cos(camAngle) * 8.7, 4.25, Math.sin(camAngle) * 8.7);
      desired.lerp(follow, blend);
      target.lerp(ballWorld.clone().multiplyScalar(0.68), blend);
    } else {
      const closeT = easeInOutCubic((t - 0.72) / 0.28);
      const outward = new THREE.Vector3(Math.cos(this.ballAngle), 0, Math.sin(this.ballAngle));
      const close = ballWorld.clone().add(outward.multiplyScalar(3.05)).add(new THREE.Vector3(0, 2.35, 0));
      const orbit = new THREE.Vector3(Math.cos(this.ballAngle + 0.35) * 8.2, 4.15, Math.sin(this.ballAngle + 0.35) * 8.2);
      desired.copy(orbit).lerp(close, closeT);
      target.copy(ballWorld).lerp(new THREE.Vector3(0, 0.7, 0), 0.18 * (1-closeT));
    }
    this.camera.position.lerp(desired, 0.095);
    this.controls.target.lerp(target, 0.13);
    this.camera.lookAt(this.controls.target);
  }

  resolveResult(won, result) {
    if (!this.ready) return Promise.resolve();
    const color = pocketColor(String(result));
    this.resultLight.color.set(won ? 0xffc861 : 0xff334f);
    this.resultLight.intensity = won ? 85 : 42;
    this.container.classList.add(won ? 'is-win' : 'is-loss');
    if (won) {
      this.audio.win();
      this.spawnConfetti(color);
      this.spawnPulse(0xffd875);
    } else {
      this.audio.lose();
      this.spawnPulse(0xff344e);
    }
    this.highlightPocket(String(result), won);
    const hold = this.reducedMotion ? 350 : 1150;
    return new Promise(resolve => {
      window.setTimeout(() => {
        this.beginCameraReturn();
        this.controls.enabled = true;
        resolve();
      }, hold);
    });
  }

  highlightPocket(result, won) {
    const pocket = this.pocketMeshes.find(mesh => mesh.userData.number === result);
    if (!pocket) return;
    pocket.material.emissive.set(won ? 0xffbd45 : 0xff2348);
    pocket.material.emissiveIntensity = won ? 1.4 : 0.8;
    window.setTimeout(() => {
      pocket.material.emissive.set(pocketColor(result));
      pocket.material.emissiveIntensity = pocket.userData.baseEmissive;
    }, this.reducedMotion ? 450 : 1700);
  }

  beginCameraReturn() {
    this.returnCameraAnimation = {
      start: performance.now(),
      duration: this.reducedMotion ? 250 : 1200,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone()
    };
  }

  updateCameraReturn(now) {
    if (!this.returnCameraAnimation || this.spinning) return;
    const a = this.returnCameraAnimation;
    const t = clamp01((now - a.start) / a.duration);
    const eased = easeInOutCubic(t);
    this.camera.position.copy(a.fromPos).lerp(this.homeCamera, eased);
    this.controls.target.copy(a.fromTarget).lerp(this.homeTarget, eased);
    if (t >= 1) this.returnCameraAnimation = null;
  }

  setResult(result) {
    if (!this.ready) return;
    const index = this.order.indexOf(String(result));
    if (index < 0) return;
    this.wheelAngle = (this.wheelAngle + 0.48) % TAU;
    this.pocketsGroup.rotation.y = -this.wheelAngle;
    this.ballAngle = this.baseAngle(index) + this.wheelAngle;
    this.ballRadius = 4.63;
    this.ballHeight = 1.055;
    this.updateBallTransform();
  }

  reset() {
    this.clearEffects();
    this.spinning = false;
    this.animation = null;
    this.wheelAngle = 0;
    this.pocketsGroup.rotation.y = 0;
    this.ballAngle = Math.PI * 0.15;
    this.ballRadius = 5.72;
    this.ballHeight = 1.22;
    this.updateBallTransform();
    this.camera.position.copy(this.homeCamera);
    this.controls.target.copy(this.homeTarget);
    this.controls.enabled = true;
    this.container.classList.remove('is-spinning', 'is-win', 'is-loss');
  }

  spawnConfetti(baseColor) {
    const origin = this.getBallWorldPosition().add(new THREE.Vector3(0, 0.3, 0));
    const palette = [0xffd36b, 0xffffff, baseColor, 0x66e7c1];
    for (let i = 0; i < 95; i++) {
      const geometry = new THREE.BoxGeometry(0.035 + Math.random()*0.055, 0.02, 0.06 + Math.random()*0.09);
      const material = new THREE.MeshBasicMaterial({ color: palette[i % palette.length], transparent: true, opacity: 1 });
      const piece = new THREE.Mesh(geometry, material);
      piece.position.copy(origin);
      piece.rotation.set(Math.random()*TAU, Math.random()*TAU, Math.random()*TAU);
      const velocity = new THREE.Vector3((Math.random()-.5)*4.6, 2.1+Math.random()*4.8, (Math.random()-.5)*4.6);
      this.scene.add(piece);
      this.confetti.push({ mesh: piece, velocity, life: 1.25 + Math.random()*0.9, age: 0, spin: new THREE.Vector3(Math.random()*7, Math.random()*7, Math.random()*7) });
    }
  }

  spawnPulse(color) {
    const pulse = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.035, 10, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    pulse.rotation.x = Math.PI / 2;
    pulse.position.copy(this.getBallWorldPosition());
    pulse.position.y += 0.04;
    this.scene.add(pulse);
    this.pulses.push({ mesh: pulse, age: 0, life: 1.05 });
  }

  updateEffects(dt) {
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const item = this.confetti[i];
      item.age += dt;
      item.velocity.y -= 5.6 * dt;
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
      const t = item.age / item.life;
      item.mesh.scale.setScalar(1 + t * 6);
      item.mesh.material.opacity = Math.max(0, 0.9 * (1 - t));
      if (t >= 1) {
        this.scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
        this.pulses.splice(i, 1);
      }
    }
    this.resultLight.intensity *= Math.pow(0.07, dt);
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
    const position = new THREE.Vector3(
      Math.cos(this.ballAngle) * this.ballRadius,
      this.ballHeight,
      Math.sin(this.ballAngle) * this.ballRadius
    );
    this.ball.position.copy(position);
    this.ballGlow.position.copy(position);
  }

  getBallWorldPosition() { return this.ball ? this.ball.position.clone() : new THREE.Vector3(); }

  animate(now) {
    if (this.disposed) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.animation) this.updateSpin(now);
    this.updateCameraReturn(now);
    this.updateEffects(dt);
    if (!this.spinning) this.controls.update();
    this.ball.rotation.x += dt * (this.spinning ? 15 : 1.5);
    this.ball.rotation.z += dt * (this.spinning ? 10 : 1);
    this.ballGlow.material.opacity = 0.11 + Math.sin(now * 0.004) * 0.035;
    this.bloomPass.strength = 0.52 + (this.resultLight.intensity / 85) * 0.62;
    this.composer.render();
  }

  resize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.bloomPass?.setSize(width, height);
  }

  disposeObject(root) {
    root.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const material of materials) {
          if (material.map) material.map.dispose();
          material.dispose();
        }
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
