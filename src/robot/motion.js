export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const smoothstep = (start, end, value) => {
  const x = clamp((value - start) / (end - start), 0, 1);
  return x * x * (3 - 2 * x);
};
export const damp = (value, target, speed, dt) => value + (target - value) * (1 - Math.exp(-speed * dt));

// The same envelope drives every joint. Interrupts cannot create competing tweens.
export function waveEnvelope(age) {
  return smoothstep(0, .8, age) * (1 - smoothstep(2.3, 3.3, age));
}

export function blinkScale(age) {
  if (age < 0 || age > .19) return 1;
  return 1 - Math.sin(Math.PI * age / .19) ** 2 * .94;
}

export function animateRobot(robot, state, dt) {
  const { time: t, reduced, pointer, gestureStart, hover } = state;
  const motion = reduced ? 0 : 1;
  // The controller uses -Infinity for an inactive gesture. Never feed that
  // sentinel into trigonometry: NaN * 0 would hide the head and wrist groups.
  const age = Number.isFinite(gestureStart) ? t - gestureStart : 4;
  const wave = reduced ? 0 : waveEnvelope(age);
  const idle = motion * (1 - wave * .65);
  const rise = reduced ? 1 : smoothstep(0, 1.4, t);
  robot.root.position.y = -.28 * (1 - rise) + Math.sin(t * .91) * .035 * idle;
  robot.root.rotation.y = -.13 + Math.sin(t * .37) * .018 * idle;
  robot.body.rotation.z = Math.sin(t * .62 + .4) * .012 * idle;
  robot.body.rotation.x = Math.sin(t * .73) * .009 * idle;
  const glance = pointer.active ? 0 : Math.sin(t * .47) * Math.sin(t * .19) * .09 * idle;
  const targetX = reduced ? 0 : clamp(pointer.x * .29 + glance, -.32, .32);
  const targetY = reduced ? 0 : clamp(-pointer.y * .16, -.19, .19);
  robot.head.rotation.y = damp(robot.head.rotation.y, targetX * (1 - .55 * wave), 4.5, dt);
  robot.head.rotation.x = damp(robot.head.rotation.x, targetY + Math.sin(age * 2.4) * wave * .035, 4, dt);
  robot.head.rotation.z = damp(robot.head.rotation.z, (hover ? -.045 : .01 * Math.sin(t * .6)) * idle, 3, dt);
  robot.gaze.position.x = damp(robot.gaze.position.x, reduced ? 0 : pointer.x * .043, 12, dt);
  robot.gaze.position.y = damp(robot.gaze.position.y, .013 + (reduced ? 0 : pointer.y * .027), 12, dt);
  const blink = reduced ? 1 : blinkScale(t - state.blinkStart);
  for (const eye of robot.eyes) eye.scale.y = blink;
  for (const arm of robot.arms) {
    const { side, shoulder, elbow, wrist, fingers } = arm;
    const greeting = side === 1 ? wave : 0;
    shoulder.rotation.z = side * (.16 + Math.sin(t * .63 + side) * .018 * idle) + greeting * .84;
    shoulder.rotation.x = -.045 - greeting * .12;
    elbow.rotation.z = side * .085 + greeting * 1.67;
    elbow.rotation.x = -.11 - greeting * .03;
    wrist.rotation.z = side * .04 + greeting * (.28 + Math.sin((age - .8) * 8) * .16 * smoothstep(.7, 1, age));
    wrist.rotation.y = side * -.1 + greeting * .26;
    for (const finger of fingers) {
      const curl = .12 + Math.sin(t * 1.12 + finger.phase + side) * .045 * idle;
      finger.base.rotation.x = finger.thumb ? -.3 : -curl * (1 - greeting * .8);
      finger.tip.rotation.x = -.16 * (1 - greeting * .9) + Math.sin(t * .87 + finger.phase) * .024 * idle;
    }
  }
}
