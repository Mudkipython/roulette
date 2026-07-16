const TAU = Math.PI * 2;
const MACHINE_Y = 0.55;
const BALL_RADIUS = 0.18;
const OUTER_TRACK_RADIUS = 6.02;
const POCKET_RADIUS = 4.47;
const OUTER_TRACK_Y = 1.34;
const POCKET_BALL_Y = 0.74;
const POCKET_ENTRY_RADIUS = 5.02;
const PHYSICS_DT = 1 / 240;
const MAX_FRAME_STEPS = 22;
const GRAVITY = 9.81;
const STATOR_ANGLE = 13 * Math.PI / 180;
const RIM_DRAG = 0.415;
const RIM_QUADRATIC_DRAG = 0.0075;
const STATOR_ANGULAR_DRAG = 0.20;
const DEFLECTOR_RESTITUTION = 0.14;
const FLOOR_RESTITUTION = 0.075;
const SEPARATOR_RESTITUTION = 0.10;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function normalizeAngle(angle) { return ((angle % TAU) + TAU) % TAU; }
function signedAngle(angle) {
  let value = normalizeAngle(angle);
  if (value > Math.PI) value -= TAU;
  return value;
}
function quatY(angle) { return { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) }; }
function axisAngle(axis, angle) {
  const half = angle * 0.5;
  const scale = Math.sin(half);
  return { x: axis.x * scale, y: axis.y * scale, z: axis.z * scale, w: Math.cos(half) };
}
function cryptoUnit() {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] / 0x100000000;
  }
  return Math.random();
}
function randomBetween(min, max) { return min + (max - min) * cryptoUnit(); }

function surfaceHeight(radius) {
  if (radius >= 5.95) return 1.16;
  if (radius <= POCKET_ENTRY_RADIUS) return 0.76;
  const t = clamp((radius - POCKET_ENTRY_RADIUS) / (5.95 - POCKET_ENTRY_RADIUS), 0, 1);
  const smooth = t * t * (3 - 2 * t);
  return 0.76 + (1.16 - 0.76) * smooth;
}

function cartesianVelocity(radius, angle, radialVelocity, angularVelocity) {
  const radial = { x: Math.cos(angle), z: Math.sin(angle) };
  const tangent = { x: -Math.sin(angle), z: Math.cos(angle) };
  return {
    x: radial.x * radialVelocity + tangent.x * radius * angularVelocity,
    z: radial.z * radialVelocity + tangent.z * radius * angularVelocity
  };
}

function polarVelocity(radius, angle, velocity) {
  const radial = { x: Math.cos(angle), z: Math.sin(angle) };
  const tangent = { x: -Math.sin(angle), z: Math.cos(angle) };
  return {
    radial: velocity.x * radial.x + velocity.z * radial.z,
    angular: (velocity.x * tangent.x + velocity.z * tangent.z) / Math.max(radius, 1e-5)
  };
}

export class RoulettePhysics {
  static async create(order) { return new RoulettePhysics(order); }

  constructor(order) {
    this.order = [...order];
    this.accumulator = 0;
    this.phase = 'idle';
    this.mode = 'idle';
    this.deflectors = Array.from({ length: 8 }, (_, index) => ({
      angle: index * TAU / 8 + Math.PI / 8,
      radius: index % 2 === 0 ? 5.30 : 5.18,
      collisionRadius: 0.15 + BALL_RADIUS
    }));
    this.reset();
  }

  baseAngle(index) { return Math.PI / 2 - index * TAU / this.order.length; }

  setOrder(order) {
    this.order = [...order];
    this.reset();
  }

  launch() {
    this.elapsed = 0;
    this.accumulator = 0;
    this.stableTime = 0;
    this.betsClosed = false;
    this.result = null;
    this.safetyResolved = false;

    // Positive ball angle is clockwise in the fixed camera view. Positive
    // rotorAngle maps to a counter-clockwise visual rotation through quatY.
    this.rotorAngle = randomBetween(0, TAU);
    this.rotorOmega = randomBetween(0.22, 0.32);
    this.ballAngle = 0.15 + randomBetween(-0.035, 0.035);
    this.ballRadius = OUTER_TRACK_RADIUS;
    this.ballRadialVelocity = 0;
    this.ballAngularVelocity = randomBetween(4.70, 5.35);
    this.ballHeightOffset = 0;
    this.ballVerticalVelocity = 0;
    this.ballRollAngle = 0;
    this.lastDeflectorTime = -Infinity;
    this.lastSeparatorTime = -Infinity;
    this.deflectorHits = 0;
    this.separatorHits = 0;

    this.criticalOmega = Math.sqrt(
      GRAVITY / OUTER_TRACK_RADIUS * Math.tan(STATOR_ANGLE)
    );
    this.phase = 'betting-open';
    this.mode = 'rim';
  }

  step(frameDt) {
    if (this.phase === 'idle' || this.phase === 'resolved') return this.snapshot();
    this.accumulator = Math.min(
      this.accumulator + Math.min(frameDt, 0.10),
      PHYSICS_DT * MAX_FRAME_STEPS
    );
    let steps = 0;
    while (this.accumulator >= PHYSICS_DT && steps < MAX_FRAME_STEPS) {
      this.fixedStep(PHYSICS_DT);
      this.accumulator -= PHYSICS_DT;
      steps += 1;
    }
    return this.snapshot();
  }

  fixedStep(dt) {
    this.elapsed += dt;
    this.rotorOmega *= Math.exp(-(this.mode === 'pockets' ? 0.055 : 0.018) * dt);
    this.rotorAngle = normalizeAngle(this.rotorAngle + this.rotorOmega * dt);

    if (this.mode === 'rim') this.integrateRim(dt);
    else if (this.mode === 'stator') this.integrateStator(dt);
    else if (this.mode === 'pockets') this.integratePockets(dt);

    this.integrateVertical(dt);
    this.ballRollAngle += Math.abs(this.ballAngularVelocity * this.ballRadius) / BALL_RADIUS * dt;

    if (this.elapsed > 22 && this.phase !== 'resolved') {
      this.safetyResolved = true;
      this.resolvePhysicalResult();
    }
  }

  integrateRim(dt) {
    const deceleration = RIM_DRAG + RIM_QUADRATIC_DRAG * this.ballAngularVelocity ** 2;
    this.ballAngularVelocity = Math.max(0, this.ballAngularVelocity - deceleration * dt);
    this.ballAngle = normalizeAngle(this.ballAngle + this.ballAngularVelocity * dt);
    this.ballRadius = OUTER_TRACK_RADIUS;

    if (this.ballAngularVelocity <= this.criticalOmega) {
      this.betsClosed = true;
      this.phase = 'descending';
      this.mode = 'stator';
      this.ballRadialVelocity = 0;
    }
  }

  integrateStator(dt) {
    // Polar equations for a ball rolling on an inclined, axisymmetric stator.
    // The radial term compares centrifugal support with gravity down the slope;
    // the angular term approximately conserves angular momentum while adding
    // rolling resistance.
    const radialAcceleration =
      this.ballRadius * this.ballAngularVelocity ** 2 * Math.cos(STATOR_ANGLE) -
      GRAVITY * Math.sin(STATOR_ANGLE) -
      0.72 * this.ballRadialVelocity;
    const angularAcceleration =
      -2 * this.ballRadialVelocity * this.ballAngularVelocity / Math.max(this.ballRadius, 0.2) -
      STATOR_ANGULAR_DRAG * this.ballAngularVelocity;

    this.ballRadialVelocity = clamp(this.ballRadialVelocity + radialAcceleration * dt, -3.2, 0.9);
    this.ballAngularVelocity = Math.max(0.12, this.ballAngularVelocity + angularAcceleration * dt);
    this.ballRadius += this.ballRadialVelocity * dt;
    this.ballAngle = normalizeAngle(this.ballAngle + this.ballAngularVelocity * dt);

    this.resolveDeflectorCollisions();

    if (this.ballRadius <= POCKET_ENTRY_RADIUS) {
      this.ballRadius = POCKET_ENTRY_RADIUS;
      this.mode = 'pockets';
      this.phase = 'settling';
      // The ball drops from the stator into the rotating fret ring.
      this.ballVerticalVelocity -= 0.18;
    }
  }

  resolveDeflectorCollisions() {
    const x = Math.cos(this.ballAngle) * this.ballRadius;
    const z = Math.sin(this.ballAngle) * this.ballRadius;
    let velocity = cartesianVelocity(
      this.ballRadius,
      this.ballAngle,
      this.ballRadialVelocity,
      this.ballAngularVelocity
    );

    for (const deflector of this.deflectors) {
      if (this.elapsed - this.lastDeflectorTime < 0.05) break;
      const dx = x - Math.cos(deflector.angle) * deflector.radius;
      const dz = z - Math.sin(deflector.angle) * deflector.radius;
      const distance = Math.hypot(dx, dz);
      if (distance >= deflector.collisionRadius || distance < 1e-6) continue;

      const nx = dx / distance;
      const nz = dz / distance;
      const normalSpeed = velocity.x * nx + velocity.z * nz;
      if (normalSpeed >= 0) continue;

      const impulse = -(1 + DEFLECTOR_RESTITUTION) * normalSpeed;
      velocity.x += nx * impulse;
      velocity.z += nz * impulse;

      // Coulomb-like tangential loss at the impact point.
      const tx = -nz;
      const tz = nx;
      const tangentSpeed = velocity.x * tx + velocity.z * tz;
      velocity.x -= tx * tangentSpeed * 0.12;
      velocity.z -= tz * tangentSpeed * 0.12;

      const correctedRadius = deflector.collisionRadius + 0.002;
      const correctedX = Math.cos(deflector.angle) * deflector.radius + nx * correctedRadius;
      const correctedZ = Math.sin(deflector.angle) * deflector.radius + nz * correctedRadius;
      this.ballRadius = Math.hypot(correctedX, correctedZ);
      this.ballAngle = normalizeAngle(Math.atan2(correctedZ, correctedX));

      const polar = polarVelocity(this.ballRadius, this.ballAngle, velocity);
      // Diamond deflectors are angled to send the ball across the inner rim;
      // retain the impulse-derived tangent while preventing an artificial
      // outward orbit around the same obstacle.
      this.ballRadialVelocity = Math.min(polar.radial, -0.10);
      this.ballAngularVelocity = polar.angular;
      this.ballVerticalVelocity = Math.max(
        this.ballVerticalVelocity,
        Math.min(0.34, impulse * 0.045)
      );
      this.lastDeflectorTime = this.elapsed;
      this.deflectorHits += 1;
      break;
    }
  }

  integratePockets(dt) {
    const targetRadius = POCKET_RADIUS;

    // A damped radial potential represents the curved pocket floor and its
    // raised inner/outer lips. It is a force, not a position clamp.
    const radialAcceleration =
      -14.5 * (this.ballRadius - targetRadius) -
      5.8 * this.ballRadialVelocity;
    this.ballRadialVelocity += radialAcceleration * dt;
    this.ballRadius += this.ballRadialVelocity * dt;

    // Rolling friction acts against motion relative to the rotating rotor.
    let relativeOmega = this.ballAngularVelocity + this.rotorOmega;
    const rollingDamping = this.ballHeightOffset > 0.02 ? 0.22 : 1.35;
    relativeOmega *= Math.exp(-rollingDamping * dt);
    this.ballAngularVelocity = relativeOmega - this.rotorOmega;
    this.ballAngle = normalizeAngle(this.ballAngle + this.ballAngularVelocity * dt);

    this.resolveSeparatorCollision();

    const relativeTangentialSpeed = Math.abs(
      (this.ballAngularVelocity + this.rotorOmega) * this.ballRadius
    );
    const stable =
      Math.abs(this.ballRadius - targetRadius) < 0.035 &&
      Math.abs(this.ballRadialVelocity) < 0.045 &&
      relativeTangentialSpeed < 0.12 &&
      this.ballHeightOffset < 0.005 &&
      Math.abs(this.ballVerticalVelocity) < 0.03;

    if (stable) this.stableTime += dt;
    else this.stableTime = Math.max(0, this.stableTime - dt * 0.6);

    if (this.stableTime > 0.48) this.resolvePhysicalResult();
  }

  resolveSeparatorCollision() {
    if (this.ballHeightOffset > 0.12) return;

    const arc = TAU / this.order.length;
    const relative = normalizeAngle(this.ballAngle + this.rotorAngle);
    const nearestIndex = this.nearestPocketIndex(relative);
    const centre = this.baseAngle(nearestIndex);
    const offset = signedAngle(relative - centre);
    const ballAngularRadius = Math.asin(clamp(BALL_RADIUS / this.ballRadius, 0, 0.95));
    const limit = Math.max(arc * 0.18, arc * 0.5 - ballAngularRadius);
    let relativeOmega = this.ballAngularVelocity + this.rotorOmega;

    if (Math.abs(offset) <= limit) return;
    const movingIntoBoundary = Math.sign(offset) === Math.sign(relativeOmega);
    if (!movingIntoBoundary || this.elapsed - this.lastSeparatorTime < 0.018) return;

    const correctedOffset = Math.sign(offset) * limit;
    this.ballAngle = normalizeAngle(centre + correctedOffset - this.rotorAngle);
    const impactSpeed = Math.abs(relativeOmega * this.ballRadius);
    relativeOmega = -relativeOmega * SEPARATOR_RESTITUTION;
    this.ballAngularVelocity = relativeOmega - this.rotorOmega;
    this.ballVerticalVelocity = Math.max(
      this.ballVerticalVelocity,
      Math.min(0.22, impactSpeed * 0.028)
    );
    this.lastSeparatorTime = this.elapsed;
    this.separatorHits += 1;
  }

  integrateVertical(dt) {
    if (this.ballHeightOffset <= 0 && this.ballVerticalVelocity <= 0) {
      this.ballHeightOffset = 0;
      this.ballVerticalVelocity = 0;
      return;
    }

    this.ballVerticalVelocity -= GRAVITY * dt;
    this.ballHeightOffset += this.ballVerticalVelocity * dt;
    if (this.ballHeightOffset < 0) {
      this.ballHeightOffset = 0;
      if (Math.abs(this.ballVerticalVelocity) > 0.17) {
        this.ballVerticalVelocity = -this.ballVerticalVelocity * FLOOR_RESTITUTION;
      } else {
        this.ballVerticalVelocity = 0;
      }
    }
  }

  nearestPocketIndex(relativeAngle) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let index = 0; index < this.order.length; index += 1) {
      const distance = Math.abs(signedAngle(relativeAngle - this.baseAngle(index)));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    return bestIndex;
  }

  resolvePhysicalResult() {
    if (this.phase === 'resolved') return;
    const relativeAngle = normalizeAngle(this.ballAngle + this.rotorAngle);
    this.result = this.order[this.nearestPocketIndex(relativeAngle)];
    this.phase = 'resolved';
    this.mode = 'resolved';
    this.ballRadius = POCKET_RADIUS;
    this.ballRadialVelocity = 0;
    this.ballHeightOffset = 0;
    this.ballVerticalVelocity = 0;
    // A captured ball shares the rotor's angular velocity in the world frame.
    this.ballAngularVelocity = -this.rotorOmega;
  }

  getCountdown() {
    if (this.betsClosed) return 0;
    const a = RIM_DRAG;
    const b = RIM_QUADRATIC_DRAG;
    const scale = Math.sqrt(b / a);
    const remaining = (
      Math.atan(this.ballAngularVelocity * scale) -
      Math.atan(this.criticalOmega * scale)
    ) / Math.sqrt(a * b);
    return Math.max(0, Math.ceil(remaining));
  }

  ballWorldHeight() {
    const base = this.mode === 'rim'
      ? OUTER_TRACK_Y
      : this.mode === 'stator'
        ? surfaceHeight(this.ballRadius) + BALL_RADIUS
        : POCKET_BALL_Y;
    return MACHINE_Y + base + this.ballHeightOffset;
  }

  snapshot() {
    const x = Math.cos(this.ballAngle) * this.ballRadius;
    const z = Math.sin(this.ballAngle) * this.ballRadius;
    const planarVelocity = cartesianVelocity(
      this.ballRadius,
      this.ballAngle,
      this.ballRadialVelocity,
      this.ballAngularVelocity
    );
    const radialAxis = { x: Math.cos(this.ballAngle), y: 0, z: Math.sin(this.ballAngle) };
    return {
      phase: this.phase,
      mode: this.mode,
      elapsed: this.elapsed || 0,
      betsClosed: Boolean(this.betsClosed),
      countdown: this.getCountdown(),
      result: this.result,
      safetyResolved: Boolean(this.safetyResolved),
      ballPosition: { x, y: this.ballWorldHeight(), z },
      ballRotation: axisAngle(radialAxis, this.ballRollAngle),
      ballVelocity: {
        x: planarVelocity.x,
        y: this.ballVerticalVelocity,
        z: planarVelocity.z
      },
      rotorRotation: quatY(this.rotorAngle),
      rotorOmega: this.rotorOmega || 0,
      radius: this.ballRadius,
      relativeAngularVelocity: this.ballAngularVelocity + this.rotorOmega,
      deflectorHits: this.deflectorHits || 0,
      separatorHits: this.separatorHits || 0
    };
  }

  placeBallInPocket(result) {
    const index = this.order.indexOf(String(result));
    if (index < 0) return;
    this.result = String(result);
    this.phase = 'resolved';
    this.mode = 'resolved';
    this.ballAngle = normalizeAngle(this.baseAngle(index) - this.rotorAngle);
    this.ballRadius = POCKET_RADIUS;
    this.ballRadialVelocity = 0;
    this.ballAngularVelocity = -this.rotorOmega;
    this.ballHeightOffset = 0;
    this.ballVerticalVelocity = 0;
  }

  reset() {
    this.phase = 'idle';
    this.mode = 'idle';
    this.elapsed = 0;
    this.result = null;
    this.betsClosed = false;
    this.rotorAngle = 0;
    this.rotorOmega = 0;
    this.ballAngle = 0.15;
    this.ballRadius = OUTER_TRACK_RADIUS;
    this.ballRadialVelocity = 0;
    this.ballAngularVelocity = 0;
    this.ballHeightOffset = 0;
    this.ballVerticalVelocity = 0;
    this.ballRollAngle = 0;
    this.stableTime = 0;
    this.safetyResolved = false;
    this.deflectorHits = 0;
    this.separatorHits = 0;
  }

  free() {}
}

export const ROULETTE_PHYSICS_CONSTANTS = {
  MACHINE_Y,
  BALL_RADIUS,
  OUTER_TRACK_RADIUS,
  POCKET_RADIUS,
  OUTER_TRACK_Y,
  POCKET_BALL_Y,
  POCKET_ENTRY_RADIUS,
  PHYSICS_DT,
  GRAVITY,
  STATOR_ANGLE
};
