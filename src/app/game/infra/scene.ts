/**
 * @fileoverview Infra: the Three.js scene. Consumes a plain {@link ViewModel}
 * from the engine each frame — no game rules live here. Colors, lighting and
 * fog derive from the approved STYLE FORMULA v1 (design/plan.md).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ViewModel } from '../engine/level-run';

export const LANE_X = 3;        // lane separation (agency metric, frozen)
export const ROOF_Y = 2.6;      // wagon roof height
export const WAGON_LEN = 12;    // wagon pitch fallback: 10.8 body + 1.2 gap
export const DRAW_DIST = 130;

const ASSETS = 'assets/game';

const C = {
  sky: 0xf7b267,
  fog: 0xf2a35e,
  ground: 0xd99a5b,
  teal: 0x2a9d8f,
  amber: 0xc77b3f,
  charcoal: 0x3a3335,
  cream: 0xfff3dd,
  cobalt: 0x2456d6,
  magenta: 0xe63966,
  gold: 0xffc53d,
};

function matte(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

// ——— canvas signboard texture ———

/**
 * Answer signboard: a rounded, gradient-filled canvas texture on a plane,
 * mounted on a pole. `setText` re-paints the canvas; the render loop drives
 * a pop-in scale animation via {@link SignBoard.appearAt}.
 */
class SignBoard {
  canvas = document.createElement('canvas');
  tex: THREE.CanvasTexture;
  mesh = new THREE.Group();
  lastText = '';
  lastState = '';
  /** Scene time (s) at which the board became visible — drives the pop-in. */
  appearAt = -1;

  /** @param poleLen Pole length in world units (longer for higher lanes). */
  constructor(poleLen = 1.6) {
    this.canvas.width = 512; this.canvas.height = 240;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, fog: false });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.15), mat);
    // soft dark backing slightly behind, for depth
    const back = new THREE.Mesh(new THREE.PlaneGeometry(4.75, 2.3),
      new THREE.MeshBasicMaterial({ color: C.charcoal, transparent: true, opacity: 0.35, fog: false }));
    back.position.z = -0.06;
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, poleLen, 0.22), matte(C.charcoal));
    pole.position.y = -(1.0 + poleLen / 2);
    this.mesh.add(back, pole, board);
    this.setText('');
  }

  /**
   * Repaints the board.
   * @param text  English answer option (word or phrase).
   * @param state Visual state: normal (cream), correct (gold + ✓), wrong (magenta + ✗).
   */
  setText(text: string, state: 'normal' | 'correct' | 'wrong' = 'normal'): void {
    const ctx = this.canvas.getContext('2d')!;
    const W = 512, H = 240, R = 30;
    ctx.clearRect(0, 0, W, H);
    // rounded card with a vertical gradient per state
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (state === 'correct') { grad.addColorStop(0, '#ffd76a'); grad.addColorStop(1, '#ffb92e'); }
    else if (state === 'wrong') { grad.addColorStop(0, '#f0507a'); grad.addColorStop(1, '#d22a56'); }
    else { grad.addColorStop(0, '#fffaf0'); grad.addColorStop(1, '#ffe9c4'); }
    ctx.beginPath();
    ctx.roundRect(6, 6, W - 12, H - 12, R);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = state === 'wrong' ? '#8f1737' : state === 'correct' ? '#a86a00' : '#2a9d8f';
    ctx.stroke();
    // inner hairline for a finished look
    ctx.beginPath();
    ctx.roundRect(16, 16, W - 32, H - 32, R - 10);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(58,51,53,0.18)';
    ctx.stroke();

    const fg = state === 'wrong' ? '#fff3dd' : '#3a3335';
    ctx.fillStyle = fg;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const mark = state === 'correct' ? '✓ ' : state === 'wrong' ? '✗ ' : '';
    const label = mark + text;
    const font = (s: number) => `bold ${s}px 'Trebuchet MS', sans-serif`;
    let size = 62;
    ctx.font = font(size);
    if (ctx.measureText(label).width <= 440) {
      ctx.fillText(label, 256, 122);
    } else {
      // shrink first; if still too wide, wrap into two balanced lines
      while (ctx.measureText(label).width > 440 && size > 44) {
        size -= 4; ctx.font = font(size);
      }
      if (ctx.measureText(label).width <= 440) {
        ctx.fillText(label, 256, 122);
      } else {
        const words = label.split(' ');
        let best = 1, bestDiff = Infinity;
        for (let i = 1; i < words.length; i++) {
          const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
          const diff = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
          if (diff < bestDiff) { bestDiff = diff; best = i; }
        }
        const l1 = words.slice(0, best).join(' '), l2 = words.slice(best).join(' ');
        size = 50; ctx.font = font(size);
        while ((ctx.measureText(l1).width > 440 || ctx.measureText(l2).width > 440) && size > 24) {
          size -= 3; ctx.font = font(size);
        }
        ctx.fillText(l1, 256, 80);
        ctx.fillText(l2, 256, 162);
      }
    }
    this.tex.needsUpdate = true;
  }
}

// ——— procedural props ———
function makeCrate(): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.5, 1.7), matte(C.amber));
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.3, 1.78), matte(C.magenta));
  const trim2 = trim.clone(); trim.position.y = 0.45; trim2.position.y = -0.45;
  g.add(box, trim, trim2);
  return g;
}
function makeFrame(): THREE.Group {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.42, 0.42), matte(C.magenta));
  bar.position.y = 1.35;
  const l = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.5, 0.26), matte(C.charcoal));
  l.position.set(-1.6, 0.72, 0);
  const r = l.clone(); r.position.x = 1.6;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: C.gold }));
  lamp.position.set(0, 1.35, 0.3);
  g.add(bar, l, r, lamp);
  return g;
}
function makeRamp(): THREE.Group {
  const geo = new THREE.BufferGeometry();
  const w = 1.3, len = 2.2, h = 1.1;
  const v = new Float32Array([
    -w, 0, 0, w, 0, 0, w, h, -len,
    -w, 0, 0, w, h, -len, -w, h, -len,
    -w, 0, 0, -w, h, -len, -w, 0, -len,
    w, 0, 0, w, 0, -len, w, h, -len,
    -w, h, -len, w, h, -len, w, 0, -len,
    -w, h, -len, w, 0, -len, -w, 0, -len,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, matte(C.teal));
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.3), matte(C.gold));
  stripe.position.set(0, h * 0.55, -len * 0.55);
  stripe.rotation.x = Math.atan2(h, len);
  const g = new THREE.Group();
  g.add(m, stripe);
  return g;
}
/**
 * Builds the villain inspector drone: rounded magenta body, glossy teal eye,
 * four rotor pods whose blades spin around their own axis, and a blinking
 * warning lamp on an antenna. All parts follow STYLE FORMULA v1 colors.
 */
function makeDrone(): THREE.Group {
  const g = new THREE.Group();
  // body: squashed sphere with a charcoal belly band
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), matte(C.magenta));
  body.scale.set(1.1, 0.78, 1.0);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.10, 8, 24), matte(C.charcoal));
  band.rotation.x = Math.PI / 2;
  // eye: white socket + emissive teal pupil looking at the hero
  const socket = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 10), matte(C.cream));
  socket.position.set(0, 0.04, -0.56);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0x5ff2e4 }));
  pupil.position.set(0, 0.04, -0.76);
  // antenna with blinking warning lamp
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), matte(C.charcoal));
  antenna.position.y = 0.75;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8),
    new THREE.MeshBasicMaterial({ color: C.gold }));
  lamp.position.y = 1.02;
  // four rotor pods; each blade set spins around its own pivot
  const rotors: THREE.Group[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.14), matte(C.charcoal));
    arm.position.set(sx * 0.72, 0.22, sz * 0.55);
    arm.rotation.y = sz * sx * 0.6;
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.16, 8), matte(C.charcoal));
    pod.position.set(sx * 1.0, 0.30, sz * 0.78);
    const pivot = new THREE.Group();
    pivot.position.set(sx * 1.0, 0.40, sz * 0.78);
    const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.03, 0.10), matte(0x6b5f62));
    const bladeB = bladeA.clone(); bladeB.rotation.y = Math.PI / 2;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.01, 16),
      new THREE.MeshBasicMaterial({ color: C.charcoal, transparent: true, opacity: 0.15 }));
    pivot.add(bladeA, bladeB, disc);
    rotors.push(pivot);
    g.add(arm, pod, pivot);
  }
  g.add(body, band, socket, pupil, antenna, lamp);
  g.userData['rotors'] = rotors;
  g.userData['lamp'] = lamp;
  return g;
}
function makeProceduralHero(): THREE.Group {
  // fallback if the GLB fails: chunky cobalt fox-ish capsule
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.7, 6, 12), matte(C.cobalt));
  body.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), matte(0xe8863a));
  head.position.y = 1.62;
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 8), matte(C.cream));
  snout.rotation.x = -Math.PI / 2; snout.position.set(0, 1.55, -0.34);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 6), matte(0xe8863a));
  earL.position.set(-0.18, 1.95, 0); const earR = earL.clone(); earR.position.x = 0.18;
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.11, 8, 14), matte(C.cream));
  scarf.position.y = 1.32; scarf.rotation.x = Math.PI / 2.2;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 8), matte(0xe8863a));
  tail.position.set(0, 0.7, 0.5); tail.rotation.x = Math.PI / 3;
  g.add(body, head, snout, earL, earR, scarf, tail);
  return g;
}
function makeProceduralWagon(variant: number): THREE.Group {
  const g = new THREE.Group();
  const bodyColor = variant === 1 ? C.teal : C.amber;
  const trimColor = variant === 1 ? C.amber : C.teal;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.0, 10.4), matte(bodyColor));
  body.position.y = 1.5;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.25, 10.8), matte(trimColor));
  roof.position.y = ROOF_Y - 0.12;
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 10.0), matte(C.charcoal));
  skirt.position.y = 0.45;
  g.add(body, roof, skirt);
  for (const zz of [-3.6, 3.6]) for (const xx of [-1.15, 1.15]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 10), matte(C.charcoal));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(xx, 0.45, zz);
    g.add(wheel);
  }
  return g;
}

/**
 * Owns the renderer, camera, lights and every pooled world object (wagons,
 * coins, obstacles, signs, drone, hero). `render(view, dt)` applies a
 * ViewModel and draws one frame; nothing here mutates game state.
 */
export class GameScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private dummy = new THREE.Object3D();
  private t = 0;
  private camX = 0;

  private groundTex: THREE.Texture | null = null;
  private sleepers!: THREE.InstancedMesh;
  private wagonPools: THREE.Object3D[][] = [[], [], []];
  private wagonPitch = WAGON_LEN;
  private coins!: THREE.InstancedMesh;
  private cratePool: THREE.Group[] = [];
  private framePool: THREE.Group[] = [];
  private rampPool: THREE.Group[] = [];
  private powerPool: THREE.Group[] = [];
  private signs: SignBoard[] = [];
  private gantry!: { group: THREE.Group; cvs: HTMLCanvasElement; tex: THREE.CanvasTexture };
  private gantryText = '';
  private meta!: { group: THREE.Group };
  private drone!: THREE.Group;
  private blob!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private heroGroup = new THREE.Group();
  private hero: THREE.Object3D;
  private mixer: THREE.AnimationMixer | null = null;

  private readonly onResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(C.sky);
    this.scene.fog = new THREE.Fog(C.fog, 45, DRAW_DIST);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
    this.camera.position.set(0, 5.4, 8.5);

    // lights per formula blocks 3–4 (warm key, teal-ish sky fill)
    const hemi = new THREE.HemisphereLight(0x9adfd4, 0xd99a5b, 0.85);
    const sun = new THREE.DirectionalLight(0xffd9a0, 1.25);
    sun.position.set(-14, 22, -10);
    this.scene.add(hemi, sun);

    this.hero = makeProceduralHero();
    this.buildStatic();
    this.buildPools();
    this.heroRig();
    this.resize();
    addEventListener('resize', this.onResize);
    addEventListener('orientationchange', this.onResize);
  }

  dispose(): void {
    removeEventListener('resize', this.onResize);
    removeEventListener('orientationchange', this.onResize);
    this.renderer.dispose();
  }

  resize(): void {
    const dpr = Math.min(devicePixelRatio || 1, 1.5); // performance law cap
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  private buildStatic(): void {
    const loader = new THREE.TextureLoader();
    // sky backdrop cylinder (seam behind camera)
    loader.load(`${ASSETS}/tex/sky.jpg`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1);
      const geo = new THREE.CylinderGeometry(220, 220, 150, 24, 1, true);
      const mat = new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false });
      const sky = new THREE.Mesh(geo, mat);
      sky.position.y = 40;
      sky.rotation.y = Math.PI / 2; // seam behind
      this.scene.add(sky);
    });
    // scrolling ground
    loader.load(`${ASSETS}/tex/ground.png`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(30, 60);
      this.groundTex = t;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 500), new THREE.MeshLambertMaterial({ map: t }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, -0.35, -120);
      this.scene.add(ground);
    });
    // rails: 2 steel bars per lane, static
    const railMat = matte(C.charcoal);
    for (let lane = -1; lane <= 1; lane++) {
      for (const off of [-0.9, 0.9]) {
        const geo = new THREE.BoxGeometry(0.16, 0.22, 500);
        geo.translate(lane * LANE_X + off, -0.1, -120);
        this.scene.add(new THREE.Mesh(geo, railMat));
      }
    }
    // sleepers: instanced, repositioned each frame
    const sGeo = new THREE.BoxGeometry(2.6, 0.14, 0.5);
    this.sleepers = new THREE.InstancedMesh(sGeo, matte(C.amber), 3 * 56);
    this.sleepers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.sleepers);
  }

  private buildPools(): void {
    // wagons: procedural until the GLB replaces them
    const wagonProto = [makeProceduralWagon(0), makeProceduralWagon(1)];
    const perLane = Math.ceil(DRAW_DIST / WAGON_LEN) + 2;
    for (let l = 0; l < 3; l++) {
      for (let k = 0; k < perLane; k++) {
        const m = wagonProto[(l + k) % 2].clone();
        this.scene.add(m);
        this.wagonPools[l].push(m);
      }
    }
    this.loadWagonGLB();
    // coins
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshLambertMaterial({ color: C.gold, emissive: 0x8a5a00 });
    this.coins = new THREE.InstancedMesh(coinGeo, coinMat, 220);
    this.coins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.coins.count = 0;
    this.scene.add(this.coins);
    // obstacles & props pools
    this.cratePool = Array.from({ length: 8 }, () => { const m = makeCrate(); m.visible = false; this.scene.add(m); return m; });
    this.framePool = Array.from({ length: 6 }, () => { const m = makeFrame(); m.visible = false; this.scene.add(m); return m; });
    this.rampPool = Array.from({ length: 4 }, () => { const m = makeRamp(); m.visible = false; this.scene.add(m); return m; });
    // powerups: orb + icon sprite
    this.powerPool = Array.from({ length: 5 }, () => {
      const g = new THREE.Group();
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1),
        new THREE.MeshLambertMaterial({ color: C.gold, emissive: 0x7a4c00 }));
      const cvs = document.createElement('canvas'); cvs.width = cvs.height = 128;
      const tex = new THREE.CanvasTexture(cvs);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
      spr.scale.set(1.1, 1.1, 1);
      spr.position.y = 1.1;
      g.add(orb, spr);
      g.userData['cvs'] = cvs;
      g.userData['tex'] = tex;
      g.userData['kind'] = '';
      g.visible = false;
      this.scene.add(g);
      return g;
    });
    // answer signs (pole length matches each lane's staggered height) + phrase gantry
    this.signs = [new SignBoard(1.2), new SignBoard(2.2), new SignBoard(3.3)];
    for (const s of this.signs) { s.mesh.visible = false; this.scene.add(s.mesh); }
    this.gantry = this.makeGantry();
    this.scene.add(this.gantry.group);
    this.meta = this.makeMeta();
    this.scene.add(this.meta.group);
    this.drone = makeDrone();
    this.scene.add(this.drone);
    // hero blob shadow
    const blobTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
      g.addColorStop(0, 'rgba(30,20,10,0.5)'); g.addColorStop(1, 'rgba(30,20,10,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    this.blob.rotation.x = -Math.PI / 2;
    this.scene.add(this.blob);
  }

  private makeGantry() {
    const group = new THREE.Group();
    const cvs = document.createElement('canvas'); cvs.width = 1024; cvs.height = 200;
    const tex = new THREE.CanvasTexture(cvs);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.1),
      new THREE.MeshBasicMaterial({ map: tex, fog: false }));
    panel.position.y = 8.9; // high above the answer-sign sightlines
    const beam = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.4, 0.4), matte(C.teal));
    beam.position.y = 7.7;
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.9, 0.4), matte(C.teal));
    pl.position.set(-6, 3.85, 0);
    const pr = pl.clone(); pr.position.x = 6;
    group.add(panel, beam, pl, pr);
    group.visible = false;
    return { group, cvs, tex };
  }

  private setGantryText(text: string): void {
    const ctx = this.gantry.cvs.getContext('2d')!;
    ctx.fillStyle = '#fff3dd'; ctx.fillRect(0, 0, 1024, 200);
    ctx.strokeStyle = '#2a9d8f'; ctx.lineWidth = 16; ctx.strokeRect(8, 8, 1008, 184);
    ctx.fillStyle = '#3a3335'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let size = 84;
    ctx.font = `bold ${size}px 'Trebuchet MS', sans-serif`;
    while (ctx.measureText(text).width > 950 && size > 30) {
      size -= 6; ctx.font = `bold ${size}px 'Trebuchet MS', sans-serif`;
    }
    ctx.fillText(text, 512, 100);
    this.gantry.tex.needsUpdate = true;
  }

  private makeMeta() {
    const group = new THREE.Group();
    const cvs = document.createElement('canvas'); cvs.width = 512; cvs.height = 160;
    const ctx = cvs.getContext('2d')!;
    ctx.fillStyle = '#ffc53d'; ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = '#3a3335'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = "bold 110px 'Trebuchet MS', sans-serif";
    ctx.fillText('META', 256, 84);
    const tex = new THREE.CanvasTexture(cvs);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8),
      new THREE.MeshBasicMaterial({ map: tex, fog: false }));
    panel.position.y = 7;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(13, 0.5, 0.5), matte(C.gold));
    beam.position.y = 5.4;
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.6, 0.5), matte(C.charcoal));
    pl.position.set(-6.2, 2.7, 0);
    const pr = pl.clone(); pr.position.x = 6.2;
    for (let i = -5; i <= 5; i += 2) {
      const flag = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 4),
        matte(i % 4 === 1 ? C.magenta : C.teal));
      flag.rotation.x = Math.PI; flag.position.set(i, 5.0, 0);
      group.add(flag);
    }
    group.add(panel, beam, pl, pr);
    group.visible = false;
    return { group };
  }

  private heroRig(): void {
    this.heroGroup.add(this.hero);
    this.scene.add(this.heroGroup);
    const loader = new GLTFLoader();
    loader.load(`${ASSETS}/models/hero.glb`, (gltf) => {
      const model = gltf.scene;
      // normalize height to ~2.4 (prominent focal point) and face -Z (run dir)
      const box = new THREE.Box3().setFromObject(model);
      const h = box.max.y - box.min.y;
      const s = 2.4 / h;
      model.scale.setScalar(s);
      model.position.y = -box.min.y * s;
      model.rotation.y = Math.PI;
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.frustumCulled = false;
          const mat = mesh.material as THREE.Material | undefined;
          if (mat) mat.side = THREE.DoubleSide;
        }
      });
      this.heroGroup.remove(this.hero);
      this.hero = model;
      this.heroGroup.add(model);
      if (gltf.animations && gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(model);
        this.mixer.clipAction(gltf.animations[0]).play();
      }
    }, undefined, () => { /* keep procedural fallback */ });
  }

  // Replace procedural wagons with the generated GLB once it loads.
  private loadWagonGLB(): void {
    const loader = new GLTFLoader();
    loader.load(`${ASSETS}/models/wagon.glb`, (gltf) => {
      const src = gltf.scene;
      const box = new THREE.Box3().setFromObject(src);
      const size = new THREE.Vector3(); box.getSize(size);
      // fit height to the walkable roof and width to the lane, then stretch
      // the length moderately so the train reads continuous (tanker look)
      const s = Math.min(ROOF_Y / Math.max(size.y, 0.01), 2.95 / Math.max(size.x, 0.01));
      src.scale.set(s, s, s);
      let len = size.z * s;
      const targetLen = 7.2;
      if (len < targetLen) { src.scale.z = s * (targetLen / len); len = targetLen; }
      const box2 = new THREE.Box3().setFromObject(src);
      src.position.y = ROOF_Y - box2.max.y; // roof flush with gameplay plane
      src.position.z = -(box2.min.z + box2.max.z) / 2;
      src.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.frustumCulled = false; });
      const variantB = src.clone(true);
      variantB.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.color = new THREE.Color(0.62, 0.95, 0.9); // teal-tinted variant
          mesh.material = mat;
        }
      });
      const pitch = len + 0.7;
      const perLane = Math.ceil(DRAW_DIST / pitch) + 2;
      for (let l = 0; l < 3; l++) {
        for (const old of this.wagonPools[l]) this.scene.remove(old);
        this.wagonPools[l] = [];
        for (let k = 0; k < perLane; k++) {
          const wrap = new THREE.Group();
          wrap.add(((l + k) % 2 === 0 ? src : variantB).clone(true));
          this.scene.add(wrap);
          this.wagonPools[l].push(wrap);
        }
      }
      this.wagonPitch = pitch;
    }, undefined, () => { /* procedural wagons stay */ });
  }

  /**
   * Applies a ViewModel and draws one frame.
   * @param view Snapshot of the simulation (hero, entities, signs, drone…).
   * @param dtMs Wall-clock delta since the previous frame, for cosmetic motion.
   */
  render(view: ViewModel, dtMs: number): void {
    const dt = dtMs / 1000;
    this.t += dt;
    const s = view.s;

    // hero (+0.42: the barrel roof is curved and the GLB bbox bottom is the
    // tail tip, not the feet — without the offset the feet sink into the
    // roof ribs and disappear from the chase-camera angle)
    const hx = view.heroX * LANE_X;
    // lift the hero clearly above the barrel roof ribs so its feet read
    this.heroGroup.position.set(hx, view.heroY + 0.72, 0);
    const lean = view.heroState === 'jump' ? 0.25 : view.heroState === 'slide' ? -0.9 : 0;
    this.heroGroup.rotation.x = THREE.MathUtils.lerp(this.heroGroup.rotation.x, lean, 0.2);
    this.heroGroup.rotation.z = THREE.MathUtils.lerp(this.heroGroup.rotation.z, view.heroRoll || 0, 0.25);
    const squash = view.heroState === 'slide' ? 0.55 : 1;
    this.heroGroup.scale.y = THREE.MathUtils.lerp(this.heroGroup.scale.y, squash, 0.3);
    if (this.mixer) {
      this.mixer.timeScale = view.heroState === 'run' ? 1.4 : 0.6;
      this.mixer.update(dt);
    } else {
      // procedural run cycle (auto-rig rejected the chunky proportions):
      // bob + side rock + forward lean reads as scampering at this scale
      const rt = this.t * (view.heroState === 'run' ? 11 : 5);
      this.hero.position.y = Math.abs(Math.sin(rt)) * 0.14;
      this.hero.rotation.z = Math.sin(rt) * 0.09;
      this.hero.rotation.x = view.heroState === 'run' ? 0.14 : 0;
    }
    this.blob.position.set(hx, ROOF_Y + 0.02, 0);
    this.blob.material.opacity = Math.max(0.15, 1 - (view.heroY - ROOF_Y) * 0.3);

    // camera chase (behind, slightly above)
    this.camX = THREE.MathUtils.lerp(this.camX, hx, 0.08);
    const shake = view.effects.shake || 0;
    this.camera.position.set(
      this.camX + (Math.random() - 0.5) * shake,
      6.7 + (view.heroY - ROOF_Y) * 0.35 + (Math.random() - 0.5) * shake,
      8.8);
    // look lower and closer so the steeper angle reveals the hero's feet
    this.camera.lookAt(this.camX * 0.85, 2.3, -13);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, view.effects.slow ? 55 : 62 + view.speed * 0.28, 0.05);
    this.camera.updateProjectionMatrix();

    // ground scroll
    if (this.groundTex) this.groundTex.offset.y = (s / 500) * 60 % 1;

    // sleepers
    let si = 0;
    for (let lane = -1; lane <= 1; lane++) {
      for (let k = 0; k < 56; k++) {
        const z = -(((k * 2.4 - s) % 134.4) + 134.4) % 134.4 + 4;
        this.dummy.position.set(lane * LANE_X, -0.22, z - 4);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.sleepers.setMatrixAt(si++, this.dummy.matrix);
      }
    }
    this.sleepers.instanceMatrix.needsUpdate = true;

    // wagons: each lane chain phase-locked to distance
    const pitch = this.wagonPitch;
    for (let l = 0; l < 3; l++) {
      const pool = this.wagonPools[l];
      const first = Math.floor((s - 20) / pitch);
      for (let k = 0; k < pool.length; k++) {
        const idx = first + k;
        const d = idx * pitch + pitch / 2;
        const m = pool[((idx % pool.length) + pool.length) % pool.length];
        m.position.set((l - 1) * LANE_X, 0, -(d - s));
      }
    }

    // entities from the engine
    let coinI = 0, crateI = 0, frameI = 0, rampI = 0, powerI = 0;
    for (const e of view.entities) {
      const z = -(e.d - s);
      if (z < -DRAW_DIST || z > 12 || e.taken) continue;
      const x = e.lane * LANE_X;
      if (e.type === 'coin') {
        if (coinI < 220) {
          this.dummy.position.set(x, ROOF_Y + 0.9 + (e.h || 0), z);
          this.dummy.rotation.set(0, this.t * 3 + e.d, 0);
          this.dummy.scale.set(1, 1, 1);
          this.dummy.updateMatrix();
          this.coins.setMatrixAt(coinI++, this.dummy.matrix);
        }
      } else if (e.type === 'crate' && crateI < this.cratePool.length) {
        const m = this.cratePool[crateI++];
        m.visible = true; m.position.set(x, ROOF_Y + 0.75, z);
      } else if (e.type === 'frame' && frameI < this.framePool.length) {
        const m = this.framePool[frameI++];
        m.visible = true; m.position.set(x, ROOF_Y, z);
      } else if (e.type === 'ramp' && rampI < this.rampPool.length) {
        const m = this.rampPool[rampI++];
        m.visible = true; m.position.set(x, ROOF_Y, z);
      } else if (e.type === 'power' && powerI < this.powerPool.length) {
        const m = this.powerPool[powerI++];
        if (m.userData['kind'] !== e.kind) {
          m.userData['kind'] = e.kind;
          const cvs = m.userData['cvs'] as HTMLCanvasElement;
          const ctx = cvs.getContext('2d')!;
          ctx.clearRect(0, 0, 128, 128);
          ctx.font = '90px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const icon: Record<string, string> = { shield: '🛡️', magnet: '🧲', slow: '🐢', x2: '✖️2' };
          ctx.fillText(icon[e.kind ?? ''] || '★', 64, 70);
          (m.userData['tex'] as THREE.CanvasTexture).needsUpdate = true;
        }
        m.visible = true;
        m.position.set(x, ROOF_Y + 1.0 + Math.sin(this.t * 3 + e.d) * 0.15, z);
        m.children[0].rotation.y = this.t * 2;
      }
    }
    this.coins.count = coinI;
    this.coins.instanceMatrix.needsUpdate = true;
    for (let i = crateI; i < this.cratePool.length; i++) this.cratePool[i].visible = false;
    for (let i = frameI; i < this.framePool.length; i++) this.framePool[i].visible = false;
    for (let i = rampI; i < this.rampPool.length; i++) this.rampPool[i].visible = false;
    for (let i = powerI; i < this.powerPool.length; i++) this.powerPool[i].visible = false;

    // answer signs (pop-in animation with a slight overshoot when they appear)
    for (let i = 0; i < 3; i++) {
      const sign = this.signs[i];
      const q = view.signs[i];
      if (!q) { sign.mesh.visible = false; sign.appearAt = -1; continue; }
      const z = -(q.d - s);
      if (z < -DRAW_DIST || z > 2.5) { sign.mesh.visible = false; sign.appearAt = -1; continue; }
      if (!sign.mesh.visible) sign.appearAt = this.t;
      sign.mesh.visible = true;
      const pop = Math.min(1, (this.t - sign.appearAt) / 0.35);
      const scale = pop < 1 ? 0.6 + 0.4 * pop + 0.12 * Math.sin(pop * Math.PI) : 1;
      sign.mesh.scale.setScalar(scale);
      // staggered heights per lane so wide boards never overlap visually,
      // plus a gentle float so they feel alive
      const floatY = Math.sin(this.t * 2 + i * 2.1) * 0.08;
      sign.mesh.position.set(q.lane * LANE_X, ROOF_Y + 1.95 + (q.lane + 1) * 1.05 + floatY, z);
      if (sign.lastText !== q.text || sign.lastState !== q.state) {
        sign.setText(q.text, q.state);
        sign.lastText = q.text; sign.lastState = q.state;
      }
    }

    // phrase gantry
    if (view.gantry) {
      const z = -(view.gantry.d - s);
      this.gantry.group.visible = z > -DRAW_DIST && z < 1.5;
      this.gantry.group.position.z = z;
      if (this.gantryText !== view.gantry.text) {
        this.setGantryText(view.gantry.text);
        this.gantryText = view.gantry.text;
      }
    } else this.gantry.group.visible = false;

    // META arch
    if (view.metaD != null) {
      const z = -(view.metaD - s);
      this.meta.group.visible = z > -DRAW_DIST && z < 5;
      this.meta.group.position.z = z;
    } else this.meta.group.visible = false;

    // drone: ALWAYS on screen, hovering ahead of the hero and high over the
    // track like a patrolling inspector. It descends and swoops toward the
    // hero as droneDist shrinks, so the threat is always felt but it never
    // blocks the camera or the answer signs (which sit lower and further).
    const dd = view.droneDist;
    const closeness = Math.min(Math.max(1 - dd / 30, 0), 1); // 0 far, 1 caught
    this.drone.visible = true;
    this.drone.position.set(
      hx * 0.5 + Math.sin(this.t * 1.4) * 0.5,
      ROOF_Y + 4.6 - closeness * 2.4 + Math.sin(this.t * 2.3) * 0.28,
      -7.5 + closeness * 6.8 + Math.sin(this.t * 1.1) * 0.4);
    this.drone.scale.setScalar(0.9 + closeness * 0.35);
    this.drone.rotation.y = Math.PI + Math.sin(this.t * 1.1) * 0.25; // faces the hero
    this.drone.rotation.x = -0.15 - closeness * 0.2; // tilts down as it dives
    for (const rotor of this.drone.userData['rotors'] as THREE.Group[]) {
      rotor.rotation.y = this.t * 26;
    }
    (this.drone.userData['lamp'] as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>)
      .material.color.setHex(Math.sin(this.t * 6) > 0 ? C.gold : C.magenta);

    this.renderer.render(this.scene, this.camera);
  }

  /** Draw-call / triangle counters for the `?dev=1` overlay. */
  info(): { calls: number; triangles: number } {
    const r = this.renderer.info.render;
    return { calls: r.calls, triangles: r.triangles };
  }
}
