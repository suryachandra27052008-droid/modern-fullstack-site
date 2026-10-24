import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { companionMarkup } from "./template.js";
import { buildRobot } from "./model.js";
import { animateRobot, clamp } from "./motion.js";

/** Mount once; animation lives outside React. Returns full, StrictMode-safe cleanup. */
export function createCompanion(host, { motionPaused = () => false, covered = () => false } = {}) {
  host.innerHTML = companionMarkup;
  const stage = host.querySelector(".robot-stage");
  const canvas = host.querySelector("canvas");
  const button = host.querySelector(".hello-button");
  const status = host.querySelector(".robot-status");
  const instructions = host.querySelector(".robot-instructions > span");
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const pointerQuery = matchMedia("(pointer: coarse)");
  const abort = new AbortController();
  const eventOptions = { signal: abort.signal };
  let renderer, robot, environment, resizeObserver, intersectionObserver;
  let disposed = false;
  let inView = true;
  let contextLost = false;
  let previousTime = 0;
  let bounds;
  let lastPointer = -10;
  let nextBlink = 1.1;
  let slowFrames = 0;
  let quality = 1;
  const state = {
    time: 0, reduced: motionQuery.matches || motionPaused(), hover: false,
    pointer: { x: 0, y: 0, active: false },
    gestureStart: motionQuery.matches || motionPaused() ? -Infinity : 1,
    blinkStart: -Infinity,
  };
  function setPhase(phase, text) {
    if (stage.dataset.state !== phase) stage.dataset.state = phase;
    if (status.textContent !== text) status.textContent = text;
  }
  function unavailable() {
    contextLost = true;
    renderer?.setAnimationLoop(null);
    delete stage.dataset.ready;
    stage.setAttribute("aria-busy", "false");
    setPhase("unavailable", "Your companion, at rest");
    button.disabled = true;
    canvas.tabIndex = -1;
    instructions.textContent = "A quiet preview. Interactive 3D is unavailable on this device.";
  }
  function cleanup() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    renderer?.setAnimationLoop(null);
    robot?.dispose();
    environment?.dispose();
    renderer?.dispose();
    // Lose the unused context immediately when React remounts or an embed is removed.
    renderer?.forceContextLoss();
    host.replaceChildren();
  }
  try {
    const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "default" });
    if (!context) { unavailable(); return cleanup; }
    renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: "default" });
    renderer.setClearColor(0xede6d6, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .92;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3, 3, 2.5, -2.5, .1, 30);
    camera.position.set(0, 1.1, 9);
    camera.lookAt(0, .24, 0);
    function buildEnvironment() {
      environment?.dispose();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, .04, .1, 100, { size: 128 });
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
    }
    buildEnvironment();
    scene.environmentIntensity = .6;
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0xc3bdab, 1.25));
    const key = new THREE.DirectionalLight(0xfffaf1, 2.7);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8eddc, .65);
    fill.position.set(4, 1, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff7e7, 1.7);
    rim.position.set(2, 3, -4);
    scene.add(rim);
    robot = buildRobot();
    scene.add(robot.root);

    function resize() {
      bounds = stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height || disposed) return;
      const aspect = bounds.width / bounds.height;
      // Always fit both the fully raised hand and the relaxed fingertip silhouette.
      const compact = bounds.width < 560;
      const height = Math.max(4.55, (compact ? 4.2 : 4.65) / aspect);
      // A slight offset gives the greeting hand room in a portrait viewport.
      camera.position.x = compact ? .18 : 0;
      camera.lookAt(compact ? .18 : 0, .24, 0);
      camera.left = -height * aspect / 2;
      camera.right = height * aspect / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      const cap = pointerQuery.matches ? 1.25 : 1.75;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap) * quality);
      renderer.setSize(bounds.width, bounds.height, false);
      if (state.reduced && !contextLost) draw();
    }
    function draw() {
      animateRobot(robot, state, 1 / 60);
      renderer.render(scene, camera);
    }
    function frame(timestamp) {
      if (disposed || contextLost) return;
      const rawDelta = previousTime ? (timestamp - previousTime) / 1000 : 1 / 60;
      previousTime = timestamp;
      const dt = Math.min(rawDelta, .05);
      // Keep gesture duration tied to elapsed time on throttled/slow devices;
      // only interpolation steps are capped. Visibility resumes reset the clock.
      state.time += rawDelta;
      if (state.time - lastPointer > 3.8) {
        state.pointer.active = false;
        state.pointer.x = 0;
        state.pointer.y = 0;
        state.hover = false;
      }
      if (state.time >= nextBlink) {
        state.blinkStart = state.time;
        nextBlink = state.time + 3.2 + Math.random() * 3.4;
      }
      const age = state.time - state.gestureStart;
      if (state.time < 1.4 && !state.reduced) setPhase("arriving", "Getting acquainted");
      else if (age >= 0 && age < 3.3 && !state.reduced) setPhase("greeting", "Hello, human");
      else setPhase("idle", "Here with you");
      animateRobot(robot, state, dt);
      const renderStart = performance.now();
      renderer.render(scene, camera);
      const renderCost = performance.now() - renderStart;
      // A sustained slow GPU gets fewer pixels, with a single downgrade per mount.
      // A 30 Hz display alone is not evidence of an overloaded renderer.
      if (quality === 1 && state.time > 5 && rawDelta > .029 && rawDelta < .2 && renderCost > 12) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 90) { quality = .75; resize(); }
    }
    function updateLoop() {
      previousTime = 0;
      const active = !document.hidden && inView && !contextLost && !covered();
      renderer.setAnimationLoop(active && !state.reduced ? frame : null);
      if (active && state.reduced) {
        state.gestureStart = -Infinity;
        setPhase("idle", "Here with you");
        draw();
      }
    }
    function greet() {
      if (contextLost) return;
      if (state.reduced) {
        setPhase("idle", status.textContent === "Hello, human" ? "Here with you" : "Hello, human");
        return;
      }
      // Repeated clicks finish the current gesture instead of snapping back to frame zero.
      if (state.time - state.gestureStart < 3.3) return;
      state.gestureStart = state.time;
      setPhase("greeting", "Hello, human");
    }
    function resetPointer() {
      state.pointer.active = false;
      state.pointer.x = 0;
      state.pointer.y = 0;
      state.hover = false;
    }
    const raycaster = new THREE.Raycaster();
    const cursor = new THREE.Vector2();
    document.addEventListener("pointermove", (event) => {
      if (!inView || covered() || event.pointerType === "touch" || state.reduced || contextLost) return;
      bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
      const y = 1 - (event.clientY - bounds.top) / bounds.height * 2;
      state.pointer.x = clamp(x, -1, 1);
      state.pointer.y = clamp(y, -1, 1);
      state.pointer.active = true;
      lastPointer = state.time;
      cursor.set(x, y);
      raycaster.setFromCamera(cursor, camera);
      state.hover = Math.abs(x) < 1 && Math.abs(y) < 1 && raycaster.intersectObject(robot.root, true).length > 0;
    }, { ...eventOptions, passive: true });
    document.documentElement.addEventListener("pointerleave", resetPointer, eventOptions);
    window.addEventListener("blur", resetPointer, eventOptions);
    canvas.addEventListener("pointerleave", resetPointer, eventOptions);
    button.addEventListener("click", greet, eventOptions);
    canvas.addEventListener("click", greet, eventOptions);
    canvas.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); greet(); }
    }, eventOptions);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      unavailable();
      // Release target handles while the old context is lost, before a restored
      // context can mistake their stale GPU objects for newly allocated handles.
      environment?.dispose();
      environment = undefined;
      scene.environment = null;
    }, eventOptions);
    canvas.addEventListener("webglcontextrestored", () => {
      contextLost = false;
      buildEnvironment();
      stage.dataset.ready = "true";
      button.disabled = false;
      canvas.tabIndex = 0;
      state.gestureStart = -Infinity;
      updateLoop();
      updateInstructions();
    }, eventOptions);
    function updateInstructions() {
      instructions.textContent = state.reduced ? "A quiet presence. Reduced motion is on." : pointerQuery.matches ? "Tap your companion to say hello." : "Move your cursor. Make a connection.";
    }
    function syncMotion() {
      state.reduced = motionQuery.matches || motionPaused();
      resetPointer();
      if (state.reduced) {
        robot.head.rotation.set(0, 0, 0);
        robot.gaze.position.set(0, .013, .533);
      }
      updateInstructions();
      updateLoop();
    }
    motionQuery.addEventListener("change", syncMotion, eventOptions);
    window.addEventListener("autixai:motionchange", syncMotion, eventOptions);
    window.addEventListener("autixai:introchange", updateLoop, eventOptions);
    pointerQuery.addEventListener("change", () => { updateInstructions(); resize(); }, eventOptions);
    document.addEventListener("visibilitychange", updateLoop, eventOptions);
    window.addEventListener("scroll", () => { bounds = stage.getBoundingClientRect(); }, { ...eventOptions, passive: true });
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    intersectionObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updateLoop(); }, { threshold: .01 });
    intersectionObserver.observe(stage);
    resize();
    draw();
    stage.dataset.ready = "true";
    stage.setAttribute("aria-busy", "false");
    updateInstructions();
    updateLoop();
  } catch {
    unavailable();
    robot?.dispose();
    environment?.dispose();
    renderer?.dispose();
  }
  return cleanup;
}
