import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** An authored hierarchy: shoulder → elbow → wrist → five jointed fingers. */
export function buildRobot() {
  const geometries = new Map();
  const materials = {
    pearl: new THREE.MeshPhysicalMaterial({ color: "#f5f1e6", roughness: .3, metalness: .12, clearcoat: .45, clearcoatRoughness: .32 }),
    ivory: new THREE.MeshStandardMaterial({ color: "#e5ddcb", roughness: .42, metalness: .24 }),
    sage: new THREE.MeshStandardMaterial({ color: "#9ca687", roughness: .47, metalness: .25 }),
    olive: new THREE.MeshStandardMaterial({ color: "#6a7444", roughness: .42, metalness: .28 }),
    champagne: new THREE.MeshStandardMaterial({ color: "#c7b495", roughness: .35, metalness: .6 }),
    face: new THREE.MeshPhysicalMaterial({ color: "#dfe3d1", roughness: .36, metalness: .08, clearcoat: .4 }),
    eye: new THREE.MeshStandardMaterial({ color: "#7d9865", emissive: "#94b979", emissiveIntensity: .36, roughness: .28, metalness: .08 }),
    lens: new THREE.MeshStandardMaterial({ color: "#728064", roughness: .32, metalness: .25 }),
  };
  function geometry(key, make) {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  }
  function mesh(parent, geo, mat, position = [0, 0, 0], scale = [1, 1, 1]) {
    const object = new THREE.Mesh(geo, materials[mat]);
    object.position.set(...position);
    object.scale.set(...scale);
    parent.add(object);
    return object;
  }
  const sphere = geometry("sphere", () => new THREE.SphereGeometry(1, 24, 16));
  function ellipsoid(parent, mat, position, scale) { return mesh(parent, sphere, mat, position, scale); }
  function box(parent, mat, size, radius, position) {
    return mesh(parent, geometry(`box-${size}-${radius}`, () => new RoundedBoxGeometry(...size, 3, radius)), mat, position);
  }
  // Shallow panels need a rounded 2D outline: a rounded box limits radius to depth/2.
  function panel(parent, mat, width, height, depth, radius, position) {
    const geo = geometry(`panel-${width}-${height}-${depth}-${radius}`, () => {
      const shape = new THREE.Shape();
      const x = -width / 2, y = -height / 2, r = radius;
      shape.moveTo(x + r, y);
      shape.lineTo(x + width - r, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + r);
      shape.lineTo(x + width, y + height - r);
      shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      shape.lineTo(x + r, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      const result = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .008, bevelThickness: .008, curveSegments: 12 });
      result.translate(0, 0, -depth / 2);
      return result;
    });
    return mesh(parent, geo, mat, position);
  }
  function capsule(parent, mat, radius, length, position) {
    return mesh(parent, geometry(`capsule-${radius}-${length}`, () => new THREE.CapsuleGeometry(radius, length, 5, 12)), mat, position);
  }
  function cylinder(parent, mat, top, bottom, height, position) {
    return mesh(parent, geometry(`cylinder-${top}-${bottom}-${height}`, () => new THREE.CylinderGeometry(top, bottom, height, 32)), mat, position);
  }
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // A continuous closed profile replaces the source's exposed hips and black bar.
  const profile = new THREE.SplineCurve([
    new THREE.Vector2(0, -.98), new THREE.Vector2(.23, -.95),
    new THREE.Vector2(.44, -.78), new THREE.Vector2(.56, -.44),
    new THREE.Vector2(.67, -.1), new THREE.Vector2(.8, .28),
    new THREE.Vector2(.78, .5), new THREE.Vector2(.57, .67),
    new THREE.Vector2(.28, .74), new THREE.Vector2(0, .74),
  ]).getPoints(48);
  const torsoGeometry = geometry("torso", () => new THREE.LatheGeometry(profile, 64));
  const torso = mesh(body, torsoGeometry, "pearl", [0, 0, 0], [1, 1, .67]);
  torso.name = "Continuous ivory torso";
  // Recessed champagne insignia, a small sage status light and delicate panel line.
  const crest = new THREE.Group();
  crest.position.set(0, .32, .553);
  body.add(crest);
  const leftStroke = capsule(crest, "champagne", .012, .17, [-.036, 0, 0]);
  leftStroke.rotation.z = -.4;
  const rightStroke = capsule(crest, "champagne", .012, .17, [.036, 0, 0]);
  rightStroke.rotation.z = .4;
  const crossStroke = capsule(crest, "champagne", .009, .063, [0, -.022, .005]);
  crossStroke.rotation.z = Math.PI / 2;
  box(body, "sage", [.17, .021, .018], .009, [0, -.36, .399]);
  box(body, "eye", [.055, .014, .022], .006, [0, -.36, .411]);

  cylinder(body, "ivory", .22, .29, .12, [0, .73, 0]);
  cylinder(body, "sage", .16, .18, .18, [0, .84, 0]);
  cylinder(body, "champagne", .165, .165, .026, [0, .91, 0]);
  const head = new THREE.Group();
  head.position.set(0, 1.38, 0);
  body.add(head);
  box(head, "pearl", [1.42, 1.08, .96], .34, [0, 0, 0]);
  panel(head, "ivory", 1.24, .73, .045, .27, [0, -.035, .466]);
  panel(head, "face", 1.18, .67, .04, .24, [0, -.031, .498]);
  const gaze = new THREE.Group();
  gaze.position.set(0, .013, .533);
  head.add(gaze);
  const eyes = [];
  for (const x of [-.29, .29]) {
    const eye = new THREE.Group();
    eye.position.x = x;
    gaze.add(eye);
    panel(eye, "lens", .153, .252, .015, .075, [0, 0, 0]);
    panel(eye, "eye", .108, .204, .014, .052, [0, .003, .015]);
    // Fine LED divisions retain a sense of optics instead of cartoon eyeballs.
    for (const y of [-.049, 0, .049]) box(eye, "sage", [.087, .005, .004], .002, [0, y, .031]);
    eyes.push(eye);
  }
  box(head, "sage", [.135, .016, .015], .007, [0, -.228, .531]);
  ellipsoid(head, "champagne", [.47, .328, .427], [.025, .025, .012]);
  for (const side of [-1, 1]) {
    const ear = cylinder(head, "ivory", .185, .185, .068, [side * .705, -.015, -.01]);
    ear.rotation.z = Math.PI / 2;
    const insert = cylinder(head, "sage", .11, .11, .071, [side * .737, -.015, -.01]);
    insert.rotation.z = Math.PI / 2;
    const disc = cylinder(head, "pearl", .074, .074, .074, [side * .749, -.015, -.01]);
    disc.rotation.z = Math.PI / 2;
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * .81, .48, 0);
    body.add(shoulder);
    ellipsoid(shoulder, "sage", [0, 0, 0], [.195, .195, .195]);
    ellipsoid(shoulder, "pearl", [side * .04, -.035, .025], [.225, .25, .235]);
    capsule(shoulder, "pearl", .155, .32, [0, -.31, 0]);
    const elbow = new THREE.Group();
    elbow.position.y = -.61;
    shoulder.add(elbow);
    ellipsoid(elbow, "sage", [0, 0, 0], [.125, .125, .125]);
    const elbowCap = cylinder(elbow, "ivory", .106, .106, .245, [0, 0, 0]);
    elbowCap.rotation.z = Math.PI / 2;
    capsule(elbow, "pearl", .128, .29, [0, -.27, 0]);
    const wrist = new THREE.Group();
    wrist.position.set(0, -.53, .015);
    elbow.add(wrist);
    cylinder(wrist, "sage", .075, .078, .085, [0, 0, 0]);
    cylinder(wrist, "champagne", .08, .08, .018, [0, -.039, 0]);
    box(wrist, "pearl", [.253, .265, .155], .065, [0, -.175, .012]);
    box(wrist, "ivory", [.174, .167, .015], .04, [0, -.167, -.064]);
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const length = [.105, .14, .13, .095][i];
      const finger = new THREE.Group();
      finger.position.set((i - 1.5) * .061, -.287, .018);
      finger.rotation.z = (i - 1.5) * .04;
      wrist.add(finger);
      ellipsoid(finger, "sage", [0, 0, 0], [.026, .026, .025]);
      capsule(finger, "pearl", .027, length - .048, [0, -length / 2, 0]);
      const tip = new THREE.Group();
      tip.position.y = -length;
      tip.rotation.x = -.16;
      finger.add(tip);
      ellipsoid(tip, "ivory", [0, 0, 0], [.024, .024, .023]);
      capsule(tip, "pearl", .024, .047, [0, -.043, .003]);
      fingers.push({ base: finger, tip, phase: i * .83 });
    }
    const thumb = new THREE.Group();
    thumb.position.set(-side * .127, -.128, .025);
    thumb.rotation.z = -side * .68;
    thumb.rotation.x = -.3;
    wrist.add(thumb);
    ellipsoid(thumb, "ivory", [0, 0, 0], [.039, .039, .035]);
    capsule(thumb, "pearl", .035, .055, [0, -.06, 0]);
    const thumbTip = new THREE.Group();
    thumbTip.position.y = -.115;
    thumb.add(thumbTip);
    capsule(thumbTip, "pearl", .03, .031, [0, -.031, .008]);
    fingers.push({ base: thumb, tip: thumbTip, phase: 3.7, thumb: true });
    arms.push({ shoulder, elbow, wrist, fingers, side });
  }
  return {
    root, body, head, eyes, gaze, arms,
    dispose() {
      for (const geo of geometries.values()) geo.dispose();
      for (const material of Object.values(materials)) material.dispose();
    },
  };
}
