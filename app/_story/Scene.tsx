"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial, PerformanceMonitor, RoundedBox, useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { CAM_KEYS, CREATIVE, DESK, HERO, HERO_PAN_Y, HERO_SIZE, LENS, LOGO_Z, LOUNGE, MEDIA, PAD, PHONE } from "./path";
import type { StoryState } from "./state";
import type { FrameGate, Quality } from "./quality";
import {
  createGradeScreen,
  createHelipadTexture,
  createLabelTexture,
  createMonitorScreen,
  createPanelTexture,
  createSignTexture,
  createSocialScreen,
} from "./textures";

// Models are served from /models/hd (2048px webp textures, meshopt) or
// /models/sd (512px textures, simplified meshes) — see quality.ts.
const MODELS = ["camera", "softbox", "monitor", "drone", "phone"] as const;
const modelUrl = (q: Quality, name: (typeof MODELS)[number]) => `/models/${q.models}/${name}.glb`;
const FONT = "/fonts/orbitron-black.typeface.json";

type Props = { s: StoryState; q: Quality };
type V3 = [number, number, number];

const WARM = "#ffb56b";
const BLUE = "#3f6bff";
const VIOLET = "#7a4dff";

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
type Fit = { size: number; axis?: "max" | "x" | "y" | "z"; anchor?: "center" | "bottom"; exclude?: (m: THREE.Mesh) => boolean; shadows?: boolean };

function fitModel(source: THREE.Object3D, o: Fit) {
  const model = source.clone(true);
  const drop: THREE.Object3D[] = [];
  model.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    if (o.exclude?.(m)) drop.push(m);
    // let every model pick up the studio's reflections so it reads out of the dark
    (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => {
      if (mat && "envMapIntensity" in mat) (mat as THREE.MeshStandardMaterial).envMapIntensity = 1.8;
    });
    m.castShadow = !!o.shadows;
    m.receiveShadow = !!o.shadows;
  });
  drop.forEach((d) => d.removeFromParent());
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const ref = o.axis && o.axis !== "max" ? size[o.axis] : Math.max(size.x, size.y, size.z);
  const k = o.size / (ref || 1);
  const center = box.getCenter(new THREE.Vector3());
  model.scale.multiplyScalar(k);
  model.position.set(-center.x * k, (o.anchor === "bottom" ? -box.min.y : -center.y) * k, -center.z * k);
  const wrap = new THREE.Group();
  wrap.add(model);
  return wrap;
}

const matName = (m: THREE.Mesh) => (Array.isArray(m.material) ? m.material[0]?.name : m.material?.name) ?? "";

function roundedPlane(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 6);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  return g;
}

function seeded(seed: number) {
  let v = seed;
  return () => {
    v = (v * 9301 + 49297) % 233280;
    return v / 233280;
  };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

// ═══════════════════════════════════════════════════════════
// CAMERA RIG — scroll → spline → camera
// ═══════════════════════════════════════════════════════════
function Rig({ s, q }: Props) {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const size = useThree((st) => st.size);
  const pointer = useThree((st) => st.pointer);
  const curves = useMemo(
    () => ({
      pos: new THREE.CatmullRomCurve3(CAM_KEYS.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal"),
      look: new THREE.CatmullRomCurve3(CAM_KEYS.map((k) => new THREE.Vector3(...k.look)), false, "centripetal"),
    }),
    []
  );
  const p = useMemo(() => new THREE.Vector3(), []);
  const l = useMemo(() => new THREE.Vector3(), []);
  const par = useRef({ x: 0, y: 0 });

  useFrame((state, dt) => {
    const u = clamp01(s.cam.k / (CAM_KEYS.length - 1));
    curves.pos.getPoint(u, p);
    curves.look.getPoint(u, l);
    // near the lens the camera must thread a 20 cm barrel: no parallax, tiny near plane
    const lensDist = Math.hypot(p.x, p.y - LENS.y, p.z - (LENS.front + LENS.back) / 2);
    const inLens = lensDist < 1.6;
    if (!q.mobile && !inLens) {
      const damp = 1 - Math.exp(-dt * 2.5);
      par.current.x += (pointer.x - par.current.x) * damp;
      par.current.y += (pointer.y - par.current.y) * damp;
      p.x += par.current.x * 0.08;
      p.y += par.current.y * 0.04;
    }
    if (!inLens) p.y += Math.sin(state.clock.elapsedTime * 0.8) * 0.004;
    camera.position.copy(p);
    camera.lookAt(l);

    camera.near = inLens ? 0.004 : 0.05;
    const aspect = size.width / size.height;
    const portrait = aspect < 1;
    let fov = s.cam.fov;
    if (portrait) fov = Math.min(fov * (1 + (1 - aspect) * 1.05), 74);
    else if (aspect < 1.5) fov *= 1 + (1.5 - aspect) * 0.35;
    camera.fov = fov;
    const sx = portrait ? 0 : s.cam.sx;
    const sy = portrait ? s.cam.sy : 0;
    if (sx || sy) camera.setViewOffset(size.width, size.height, -sx * size.width, sy * size.height, size.width, size.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  });
  return null;
}

// ═══════════════════════════════════════════════════════════
// ATMOSPHERE — background, haze, exposure, reflections
// ═══════════════════════════════════════════════════════════
function Atmosphere({ s }: { s: StoryState }) {
  const scene = useThree((st) => st.scene);
  const gl = useThree((st) => st.gl);
  const fog = useMemo(() => new THREE.FogExp2("#030309", s.env.density), [s]);
  const bg = useMemo(() => new THREE.Color("#030309"), []);
  useEffect(() => {
    scene.fog = fog;
    scene.background = bg;
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, fog, bg]);
  useFrame(() => {
    bg.setRGB(s.env.bg.r, s.env.bg.g, s.env.bg.b, THREE.SRGBColorSpace);
    fog.color.copy(bg);
    fog.density = s.env.density;
    gl.toneMappingExposure = s.env.exposure;
    scene.environmentIntensity = s.env.envi * (0.3 + 0.7 * s.intro);
  });
  return null;
}

// ═══════════════════════════════════════════════════════════
// SHADERS — note: R3F v9 copies the `uniforms` prop into the material,
// so per-frame writes always go through the material ref.
// ═══════════════════════════════════════════════════════════
const PLAIN_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// Coated lens glass: thin-film rainbow + soft light blobs, additive
const GLASS_FRAG = /* glsl */ `
  uniform float uGlow; uniform float uSeed;
  varying vec2 vUv;
  void main(){
    vec2 p = vUv * 2.0 - 1.0;
    float d = length(p);
    if (d > 1.0) discard;
    float rings = 0.55 + 0.45 * sin(d * 34.0 + uSeed * 3.0);
    // coating tint: violet → blue across the radius, amber flare in one corner (like a real cine lens)
    vec3 film = mix(vec3(0.45, 0.25, 1.0), vec3(0.2, 0.45, 1.0), smoothstep(0.1, 0.9, d + 0.15 * sin(uSeed)));
    float b1 = exp(-pow(length(p - vec2(-0.38 + uSeed * 0.1, 0.28)) * 2.3, 2.0));
    float b2 = exp(-pow(length(p - vec2(0.32, -0.34 + uSeed * 0.1)) * 2.9, 2.0));
    float rim = smoothstep(0.7, 0.95, d) * (1.0 - smoothstep(0.95, 1.0, d));
    vec3 col = film * (0.1 + 0.8 * b1 + 0.5 * rim) + vec3(1.0, 0.6, 0.28) * b2 * 0.8;
    col *= mix(0.75, 1.0, rings);
    float a = clamp((0.12 + 0.7 * max(b1, b2) + 0.35 * rim) * (1.0 - smoothstep(0.9, 1.0, d)) * uGlow, 0.0, 1.0);
    gl_FragColor = vec4(col, a);
  }
`;

// Inside the lens barrel: ribbed dark metal with streaked reflections
const TUNNEL_FRAG = /* glsl */ `
  uniform float uGlow;
  varying vec2 vUv;
  void main(){
    float rib = smoothstep(0.35, 0.5, fract(vUv.y * 26.0)) * (1.0 - smoothstep(0.5, 0.65, fract(vUv.y * 26.0)));
    float a = vUv.x * 6.2831;
    float streakBlue = pow(0.5 + 0.5 * sin(a * 2.0 + 0.8), 10.0);
    float streakWarm = pow(0.5 + 0.5 * sin(a * 3.0 - 1.4), 14.0);
    vec3 col = vec3(0.006, 0.007, 0.014);
    col += vec3(0.25, 0.3, 1.0) * streakBlue * (0.25 + 0.75 * rib) * 0.5;
    col += vec3(1.0, 0.55, 0.25) * streakWarm * (0.2 + 0.8 * rib) * 0.35;
    col *= uGlow;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Volumetric light shaft (additive cone)
const BEAM_VERT = /* glsl */ `
  varying float vY; varying vec3 vN; varying vec3 vV;
  void main(){
    vY = uv.y;
    vN = normalMatrix * normal;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;
const BEAM_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  varying float vY; varying vec3 vN; varying vec3 vV;
  void main(){
    float nl = length(vN); float vl = length(vV);
    if (nl < 1e-5 || vl < 1e-5) discard;
    // clamp before pow(): a slightly negative interpolant gives NaN, which bloom smears over the frame
    float edge = pow(clamp(abs(dot(vN / nl, vV / vl)), 0.0, 1.0), 2.0);
    float fall = pow(clamp(vY, 0.0, 1.0), 1.5);
    gl_FragColor = vec4(uColor, clamp(uOpacity * edge * fall, 0.0, 1.0));
  }
`;

function Beam({ from, to, radius, color, opacity }: { from: V3; to: V3; radius: number; color: string; opacity: () => number }) {
  // keyed by value so inline array props don't rebuild the cone every render
  const fromKey = from.join(",");
  const toKey = to.join(",");
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...fromKey.split(",").map(Number));
    const b = new THREE.Vector3(...toKey.split(",").map(Number));
    const dir = b.clone().sub(a);
    const len = dir.length();
    return {
      position: a.clone().lerp(b, 0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize()),
      length: len,
    };
  }, [fromKey, toKey]);
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 } }), [color]);
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    const o = opacity();
    if (mat.current) mat.current.uniforms.uOpacity.value = o;
    if (mesh.current) mesh.current.visible = o > 0.002;
  });
  return (
    <mesh ref={mesh} position={position} quaternion={quaternion} renderOrder={3}>
      <cylinderGeometry args={[0.03, radius, length, 32, 1, true]} />
      <shaderMaterial
        ref={mat}
        vertexShader={BEAM_VERT}
        fragmentShader={BEAM_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════
// PROPS — practical lights, LED tubes, stands, cases
// ═══════════════════════════════════════════════════════════
function Tube({ position, color, height = 1.6, strength = 3, rotation }: { position: V3; color: string; height?: number; strength?: number; rotation?: V3 }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), toneMapped: false }), [color, strength]);
  return (
    <group position={position} rotation={rotation}>
      <mesh material={mat}>
        <cylinderGeometry args={[0.022, 0.022, height, 10]} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.05, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

function Stand({ position, height = 2, head = true }: { position: V3; height?: number; head?: boolean }) {
  const dark = <meshStandardMaterial color="#12131a" roughness={0.5} metalness={0.7} />;
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.016, 0.02, height, 8]} />
        {dark}
      </mesh>
      {[0, 2.1, 4.2].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.22, 0.1, Math.sin(a) * 0.22]} rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]}>
          <cylinderGeometry args={[0.012, 0.012, 0.55, 6]} />
          {dark}
        </mesh>
      ))}
      {head && (
        <mesh position={[0, height, 0]}>
          <boxGeometry args={[0.18, 0.12, 0.14]} />
          {dark}
        </mesh>
      )}
    </group>
  );
}

function WarmLamp({ position, s, on }: { position: V3; s: StoryState; on: () => number }) {
  const bulb = useMemo(() => new THREE.MeshBasicMaterial({ color: WARM, toneMapped: false }), []);
  useFrame(() => bulb.color.set(WARM).multiplyScalar(0.15 + on() * 3.2 * (0.4 + 0.6 * s.intro)));
  return (
    <group position={position}>
      <Stand position={[0, 0, 0]} height={1.4} head={false} />
      <mesh position={[0, 1.48, 0]} material={bulb}>
        <sphereGeometry args={[0.06, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 0.1, 16, 1, true]} />
        <meshStandardMaterial color="#1a1510" side={THREE.DoubleSide} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Tripod({ height = 1.12 }: { height?: number }) {
  const legs = useMemo(() => {
    const top = new THREE.Vector3(0, height * 0.66, 0);
    return [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3].map((a) => {
      const foot = new THREE.Vector3(Math.cos(a) * height * 0.55, 0, Math.sin(a) * height * 0.55);
      const dir = foot.clone().sub(top);
      return {
        pos: top.clone().lerp(foot, 0.5),
        quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
        len: dir.length(),
      };
    });
  }, [height]);
  const metal = <meshStandardMaterial color="#15171f" roughness={0.45} metalness={0.8} />;
  return (
    <group>
      {legs.map((l, i) => (
        <mesh key={i} position={l.pos} quaternion={l.quat}>
          <cylinderGeometry args={[0.018, 0.014, l.len, 8]} />
          {metal}
        </mesh>
      ))}
      <mesh position={[0, height * 0.83, 0]}>
        <cylinderGeometry args={[0.025, 0.025, height * 0.34, 8]} />
        {metal}
      </mesh>
      <mesh position={[0, height - 0.02, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.05, 16]} />
        {metal}
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// THE HANGAR — reflective floor, panelled walls, ceiling rig
// ═══════════════════════════════════════════════════════════
function Hangar({ q }: { q: Quality }) {
  const panels = useMemo(() => {
    const t = createPanelTexture();
    t.repeat.set(24, 4);
    return t;
  }, []);
  const back = useMemo(() => {
    const t = createPanelTexture();
    t.repeat.set(10, 4);
    return t;
  }, []);
  const fixtures = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#cfd6ff").multiplyScalar(1.6), toneMapped: false }), []);
  const cases = useMemo(() => {
    const rnd = seeded(77);
    return Array.from({ length: 26 }, () => {
      const side = rnd() > 0.5 ? 1 : -1;
      return { p: [side * (8 + rnd() * 4.5), 0, 12 - rnd() * 56] as V3, s: [0.6 + rnd() * 0.8, 0.4 + rnd() * 0.7, 0.5 + rnd() * 0.6] as V3, r: rnd() * 0.6 };
    });
  }, []);
  const W = 30;
  const D = 64;
  const H = 9;
  const zc = -14;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, zc]} receiveShadow>
        <planeGeometry args={[W, D]} />
        {q.post ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[260, 80]}
            mixBlur={1}
            mixStrength={28}
            mixContrast={1}
            roughness={0.85}
            depthScale={1.1}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.3}
            color="#07070d"
            metalness={0.6}
            mirror={0.6}
          />
        ) : (
          <meshStandardMaterial color="#08080e" roughness={0.28} metalness={0.7} />
        )}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (W / 2), H / 2, zc]} rotation-y={-side * (Math.PI / 2)}>
          <planeGeometry args={[D, H]} />
          <meshStandardMaterial map={panels} color="#8c90a8" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, H / 2, zc - D / 2 + 0.5]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={back} color="#8c90a8" roughness={0.9} />
      </mesh>
      <mesh position={[0, H, zc]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#050508" roughness={1} />
      </mesh>
      {/* ceiling truss + fixtures */}
      {[-4, 4].map((x) => (
        <mesh key={x} position={[x, H - 0.8, zc]}>
          <boxGeometry args={[0.18, 0.18, D - 4]} />
          <meshStandardMaterial color="#0e0f16" metalness={0.8} roughness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => 12 - i * 6.5).flatMap((z) =>
        [-4, 4].map((x) => (
          <group key={`${x}${z}`} position={[x, H - 1.05, z]}>
            <mesh>
              <boxGeometry args={[0.34, 0.2, 0.26]} />
              <meshStandardMaterial color="#111219" metalness={0.7} />
            </mesh>
            <mesh position={[0, -0.101, 0]} rotation-x={Math.PI / 2} material={fixtures}>
              <planeGeometry args={[0.24, 0.16]} />
            </mesh>
          </group>
        ))
      )}
      {cases.map((c, i) => (
        <mesh key={i} position={[c.p[0], c.s[1] / 2, c.p[2]]} scale={c.s} rotation-y={c.r}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#0f1017" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
      {[-7.5, 7.5].flatMap((x) => [6, -8, -24, -38].map((z) => <Stand key={`${x}${z}`} position={[x + (x > 0 ? 0.6 : -0.6), 0, z]} height={2.4} />))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 01 · THE LOGO
// ═══════════════════════════════════════════════════════════
function Logo({ s, q, position = [0, 1.05, LOGO_Z], size = 1, sub = true }: Props & { position?: V3; size?: number; sub?: boolean }) {
  const font = useLoader(FontLoader, FONT);
  const geometry = useMemo(() => {
    const g = new TextGeometry("DM VIBES", {
      font,
      size: 1 * size,
      depth: 0.3 * size,
      curveSegments: q.mobile ? 4 : 8,
      bevelEnabled: true,
      bevelThickness: 0.035 * size,
      bevelSize: 0.022 * size,
      bevelSegments: q.mobile ? 2 : 4,
    });
    g.computeBoundingBox();
    const b = g.boundingBox!;
    g.translate(-(b.max.x + b.min.x) / 2, -b.min.y, -(b.max.z + b.min.z) / 2);
    return g;
  }, [font, size, q.mobile]);
  // brushed silver faces, darker gunmetal returns — it lives on reflections of the studio lights
  const face = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#dfe3f7", metalness: 0.55, roughness: 0.26, emissive: new THREE.Color("#241a7a"), emissiveIntensity: 0 }),
    []
  );
  const side = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a6078", metalness: 0.95, roughness: 0.28 }), []);
  const subTex = useMemo(() => createLabelTexture("LET'S VIBE", { size: 70, weight: 300, spacing: 0.9 }), []);
  const subMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    face.emissiveIntensity = 0.12 * s.logo.glow * s.intro;
    if (subMat.current) subMat.current.opacity = s.intro * s.logo.glow;
  });
  return (
    <group position={position}>
      <mesh geometry={geometry} material={[face, side]} castShadow={q.shadows} />
      {sub && (
        <mesh position={[0, -0.32 * size, 0.05]}>
          <planeGeometry args={[3.2 * size, 0.5 * size]} />
          <meshBasicMaterial ref={subMat} map={subTex} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 02–05 · THE CINEMA CAMERA — and the way through its lens
// ═══════════════════════════════════════════════════════════
const LENS_ELEMENTS = [0.0, 0.18, 0.38, 0.6, 0.86].map((f) => LENS.front + 0.004 - f * (LENS.front - LENS.back));

function LensTunnel({ s }: { s: StoryState }) {
  const tunnel = useRef<THREE.Mesh>(null);
  const tunnelMat = useRef<THREE.ShaderMaterial>(null);
  const glass = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const length = LENS.front - LENS.back + 0.1;
  useFrame(({ camera }) => {
    const g = s.hero.lens;
    const z = camera.position.z;
    if (tunnelMat.current) tunnelMat.current.uniforms.uGlow.value = 0.35 + g;
    // the barrel only exists while we look into it or travel through it
    if (tunnel.current) tunnel.current.visible = z > LENS.back + 0.08;
    glass.current.forEach((m, i) => {
      if (!m) return;
      // each element dissolves as the camera reaches it, instead of flaring across the lens
      const approach = clamp01((z - LENS_ELEMENTS[i] - 0.02) / 0.3);
      m.uniforms.uGlow.value = g * (i === 0 ? 1 : 0.4) * approach;
    });
  });
  return (
    <group position={[HERO[0], LENS.y, 0]}>
      <mesh ref={tunnel} position={[0, 0, LENS.front - length / 2 + 0.01]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[LENS.radius * 0.86, LENS.radius * 0.8, length, 48, 1, true]} />
        <shaderMaterial ref={tunnelMat} vertexShader={PLAIN_VERT} fragmentShader={TUNNEL_FRAG} uniforms={{ uGlow: { value: 0 } }} side={THREE.BackSide} />
      </mesh>
      {LENS_ELEMENTS.map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <circleGeometry args={[LENS.radius * (i === 0 ? 0.92 : 0.8 - i * 0.02), 64]} />
          <shaderMaterial
            ref={(m) => void (glass.current[i] = m)}
            vertexShader={PLAIN_VERT}
            fragmentShader={GLASS_FRAG}
            uniforms={{ uGlow: { value: 0 }, uSeed: { value: i * 1.37 } }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function HeroCamera({ s, q }: Props) {
  const gltf = useGLTF(modelUrl(q, "camera"), false, true);
  const model = useMemo(() => {
    const m = fitModel(gltf.scene, { size: HERO_SIZE, anchor: "bottom", shadows: q.shadows, exclude: (mesh) => matName(mesh) === "ground" });
    m.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (mat?.name === "camera_body") mat.emissiveIntensity = 0.6;
    });
    return m;
  }, [gltf, q.shadows]);
  const sign = useMemo(() => createSignTexture(512, 320), []);
  const body = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    // once we're past the front element the body would only get in the way
    if (body.current) body.current.visible = camera.position.z > LENS.front - 0.01 || camera.position.z < LENS.back - 0.6;
  });

  const top = 0.67 * (HERO_SIZE / 1.4);
  return (
    <group position={HERO}>
      <Tripod height={HERO_PAN_Y} />
      <group ref={body} position={[0, HERO_PAN_Y, 0]}>
        <primitive object={model} />
        {/* top monitor */}
        <group position={[0.05, top + 0.2, 0.12]} rotation={[-0.15, 0.25, 0]}>
          <mesh>
            <boxGeometry args={[0.44, 0.28, 0.04]} />
            <meshStandardMaterial color="#0d0e14" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.021]}>
            <planeGeometry args={[0.4, 0.24]} />
            <meshBasicMaterial map={sign} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.17, -0.02]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
        {/* top handle */}
        <mesh position={[-0.05, top + 0.03, -0.1]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.13, 0.014, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#15161d" metalness={0.8} roughness={0.35} />
        </mesh>
      </group>
      <LensTunnel s={s} />
      <WarmLamp position={[-1.5, 0, 0.4]} s={s} on={() => s.hero.practicals} />
      <WarmLamp position={[1.7, 0, -1.8]} s={s} on={() => s.hero.practicals} />
      <Tube position={[-1.9, 1.05, -1.9]} color={BLUE} height={1.8} strength={3.5} />
      <Tube position={[2.3, 1.05, 0.6]} color={VIOLET} height={1.8} strength={2.6} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 06 · MEDIA PRODUCTION SET
// ═══════════════════════════════════════════════════════════
function Softbox({ q, position, target, warmth = 1, on, scale = 1 }: { q: Quality; position: V3; target: V3; warmth?: number; on: () => number; scale?: number }) {
  const gltf = useGLTF(modelUrl(q, "softbox"), false, true);
  const { model, glow } = useMemo(() => {
    const m = fitModel(gltf.scene, { size: 2.15 * scale, axis: "y", anchor: "bottom", shadows: false });
    const mats: THREE.MeshStandardMaterial[] = [];
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !/lightbox/i.test(mesh.name + (mesh.parent?.name ?? ""))) return;
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
      mat.emissive = new THREE.Color(warmth > 0.5 ? "#ffd9ad" : "#e6ecff");
      mat.emissiveMap = mat.map;
      mat.toneMapped = false;
      mesh.material = mat;
      mats.push(mat);
    });
    return { model: m, glow: mats };
  }, [gltf, scale, warmth]);
  useFrame(() => glow.forEach((m) => (m.emissiveIntensity = 0.05 + on() * 3)));
  return <primitive object={model} position={position} rotation-y={yawTo(position, target)} />;
}

function SmallCamera({ q, position, target }: { q: Quality; position: V3; target: V3 }) {
  const gltf = useGLTF(modelUrl(q, "camera"), false, true);
  const model = useMemo(() => fitModel(gltf.scene, { size: 0.62, anchor: "bottom", exclude: (m) => matName(m) === "ground" }), [gltf]);
  return (
    <group position={position} rotation-y={yawTo(position, target)}>
      <Tripod height={1.3} />
      <primitive object={model} position={[0, 1.3, 0]} />
    </group>
  );
}

function DirectorChair({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  const label = useMemo(() => createLabelTexture("DM VIBES", { w: 512, h: 128, size: 60, weight: 800, spacing: 0.15, glow: "", bg: "#101018" }), []);
  const wood = <meshStandardMaterial color="#2b1d14" roughness={0.6} />;
  return (
    <group position={position} rotation-y={rotationY}>
      {[-0.26, 0.26].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.33, 0.18]} rotation-x={0.35}>
            <boxGeometry args={[0.04, 0.72, 0.04]} />
            {wood}
          </mesh>
          <mesh position={[x, 0.33, -0.18]} rotation-x={-0.35}>
            <boxGeometry args={[0.04, 0.72, 0.04]} />
            {wood}
          </mesh>
          <mesh position={[x, 0.95, -0.2]}>
            <boxGeometry args={[0.04, 0.6, 0.04]} />
            {wood}
          </mesh>
          <mesh position={[x, 0.82, 0]}>
            <boxGeometry args={[0.05, 0.04, 0.46]} />
            {wood}
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.66, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.4]} />
        <meshStandardMaterial color="#101018" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.08, -0.21]}>
        <planeGeometry args={[0.52, 0.22]} />
        <meshStandardMaterial map={label} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function MediaSet({ s, q }: Props) {
  const sign = useMemo(() => createSignTexture(), []);
  const signMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => signMat.current?.color.setScalar(0.08 + s.media.on * 0.95));
  const chair: V3 = [MEDIA[0] - 0.2, 0, MEDIA[2] - 0.4];
  return (
    <group>
      <DirectorChair position={chair} rotationY={-0.5} />
      <Softbox q={q} position={[MEDIA[0] + 1.9, 0, MEDIA[2] + 0.2]} target={[chair[0], 1, chair[2]]} on={() => s.media.on} />
      <SmallCamera q={q} position={[MEDIA[0] - 1.4, 0, MEDIA[2] + 0.9]} target={[chair[0], 1, chair[2]]} />
      <group position={[MEDIA[0] + 0.9, 0, MEDIA[2] - 2.6]} rotation-y={-0.2}>
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[2.6, 2.8, 0.08]} />
          <meshStandardMaterial color="#0c0d15" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.7, 0.05]}>
          <planeGeometry args={[1.5, 0.75]} />
          <meshBasicMaterial ref={signMat} map={sign} toneMapped={false} />
        </mesh>
      </group>
      <Stand position={[MEDIA[0] - 0.9, 0, MEDIA[2] - 1.8]} height={2.6} />
      <Tube position={[MEDIA[0] + 3.1, 1.05, MEDIA[2] - 1.6]} color={BLUE} height={1.8} strength={3.2} />
      <WarmLamp position={[MEDIA[0] - 2.4, 0, MEDIA[2] - 1.2]} s={s} on={() => s.media.on} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 07 · DRONE over its helipad
// ═══════════════════════════════════════════════════════════
function DroneSet({ s, q }: Props) {
  const gltf = useGLTF(modelUrl(q, "drone"), false, true);
  const pad = useMemo(() => createHelipadTexture(), []);
  const padMat = useRef<THREE.MeshBasicMaterial>(null);
  const { model, props } = useMemo(() => {
    const m = fitModel(gltf.scene, { size: 1.35, anchor: "bottom", shadows: q.shadows });
    const blades: THREE.Object3D[] = [];
    m.traverse((o) => {
      if (/^Propeller\d$/.test(o.name)) blades.push(o);
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        if (mat.transmission) {
          const glass = mat.clone();
          glass.transmission = 0;
          glass.transparent = true;
          glass.opacity = 0.4;
          mesh.material = glass;
        }
      }
    });
    return { model: m, props: blades };
  }, [gltf, q.shadows]);
  const root = useRef<THREE.Group>(null);
  const nav = useRef<THREE.PointLight>(null);

  useFrame((state, dt) => {
    const d = s.drone;
    const t = state.clock.elapsedTime;
    const airborne = clamp01(d.y / 0.5) * d.spin;
    root.current?.position.set(d.x, d.y + Math.sin(t * 2.1) * 0.035 * airborne, d.z);
    root.current?.rotation.set(d.tilt + Math.sin(t * 1.3) * 0.02 * airborne, d.yaw, Math.cos(t * 1.1) * 0.025 * airborne);
    props.forEach((p, i) => (p.rotation.z += dt * 55 * d.spin * (i % 2 ? 1 : -1)));
    if (nav.current) nav.current.intensity = d.spin * 4;
    padMat.current?.color.setScalar(0.08 + d.spin * 0.55);
  });

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[PAD[0], 0.012, PAD[2]]}>
        <planeGeometry args={[4.2, 4.2]} />
        <meshBasicMaterial ref={padMat} map={pad} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <group ref={root}>
        <primitive object={model} />
        <pointLight ref={nav} position={[0, 1, 1]} color="#c4d2ff" distance={4} decay={2} intensity={0} />
      </group>
      <Tube position={[PAD[0] - 3.2, 1.05, PAD[2] - 1.5]} color={BLUE} height={1.8} strength={3.4} />
      <Tube position={[PAD[0] + 3.4, 1.05, PAD[2] - 2.2]} color={VIOLET} height={1.8} strength={2.8} />
      <WarmLamp position={[PAD[0] + 2.8, 0, PAD[2] + 1.2]} s={s} on={() => s.drone.spin} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 08 · EDIT DESK — two monitors, one timeline, one grade
// ═══════════════════════════════════════════════════════════
function EditSet({ s, q }: Props) {
  const gltf = useGLTF(modelUrl(q, "monitor"), false, true);
  const timeline = useMemo(() => createMonitorScreen(), []);
  const grade = useMemo(() => createGradeScreen(), []);
  const { left, right, mats } = useMemo(() => {
    const make = (tex: THREE.Texture) => {
      const m = fitModel(gltf.scene, { size: 0.66, axis: "x", anchor: "bottom", shadows: false });
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0, color: "#15171c", roughness: 0.35 });
      m.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && matName(mesh) === "Material.004") mesh.material = mat;
      });
      return { m, mat };
    };
    const a = make(timeline.texture);
    const b = make(grade.texture);
    return { left: a.m, right: b.m, mats: [a.mat, b.mat] };
  }, [gltf, timeline, grade]);
  const strip = useMemo(() => new THREE.MeshBasicMaterial({ color: BLUE, toneMapped: false }), []);

  useFrame(() => {
    timeline.draw(s.edit.play, s.edit.grade);
    grade.draw(s.edit.grade);
    mats.forEach((m) => (m.emissiveIntensity = 0.03 + s.edit.on * 1.05));
    strip.color.set(BLUE).multiplyScalar(0.2 + s.edit.on * 3);
  });

  const dark = <meshStandardMaterial color="#111219" roughness={0.5} metalness={0.4} />;
  return (
    <group position={DESK}>
      <mesh position={[0, 0.74, 0]}>
        <boxGeometry args={[1.8, 0.045, 0.8]} />
        <meshStandardMaterial color="#15161f" roughness={0.3} metalness={0.4} />
      </mesh>
      {[-0.86, 0.86].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]}>
          <boxGeometry args={[0.05, 0.72, 0.74]} />
          {dark}
        </mesh>
      ))}
      <mesh position={[0, 0.7, 0.4]} material={strip}>
        <boxGeometry args={[1.72, 0.015, 0.015]} />
      </mesh>
      <primitive object={left} position={[-0.36, 0.762, -0.15]} rotation-y={0.18} />
      <primitive object={right} position={[0.36, 0.762, -0.15]} rotation-y={-0.18} />
      <mesh position={[0, 0.775, 0.2]}>
        <boxGeometry args={[0.44, 0.018, 0.14]} />
        {dark}
      </mesh>
      {/* chair */}
      <group position={[0.05, 0, 0.85]} rotation-y={Math.PI + 0.2}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.48]} />
          <meshStandardMaterial color="#0d0d13" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.9, -0.24]} rotation-x={-0.1}>
          <boxGeometry args={[0.46, 0.72, 0.07]} />
          <meshStandardMaterial color="#0d0d13" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
          {dark}
        </mesh>
        {[0, 1.26, 2.51, 3.77, 5.03].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.2, 0.04, Math.sin(a) * 0.2]} rotation-y={-a}>
            <boxGeometry args={[0.4, 0.03, 0.04]} />
            {dark}
          </mesh>
        ))}
      </group>
      <Tube position={[1.6, 1.05, -0.9]} color={BLUE} height={1.9} strength={3.6} />
      <Tube position={[-1.7, 1.05, -1.1]} color={VIOLET} height={1.9} strength={2.6} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 09 · THE PHONE
// ═══════════════════════════════════════════════════════════
function PhoneSet({ s, q }: Props) {
  const gltf = useGLTF(modelUrl(q, "phone"), false, true);
  const screen = useMemo(() => createSocialScreen(), []);
  const { model, dims } = useMemo(() => {
    // stand the phone up: longest axis → Y, thinnest → Z (screen toward the camera)
    const src = gltf.scene.clone(true);
    src.updateMatrixWorld(true);
    const raw = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3());
    const order = (["x", "y", "z"] as const).slice().sort((a, b) => raw[b] - raw[a]);
    const target: Record<"x" | "y" | "z", THREE.Vector3> = { x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3() };
    target[order[0]].set(0, 1, 0);
    target[order[1]].set(1, 0, 0);
    target[order[2]].set(0, 0, 1);
    const basis = new THREE.Matrix4().makeBasis(target.x, target.y, target.z);
    if (basis.determinant() < 0) {
      target[order[1]].set(-1, 0, 0);
      basis.makeBasis(target.x, target.y, target.z);
    }
    const holder = new THREE.Group();
    src.quaternion.setFromRotationMatrix(basis);
    holder.add(src);
    const fitted = fitModel(holder, { size: 1.3, axis: "y", anchor: "center", shadows: false });
    return { model: fitted, dims: new THREE.Box3().setFromObject(fitted).getSize(new THREE.Vector3()) };
  }, [gltf]);
  const screenGeo = useMemo(() => roundedPlane(dims.x * 0.9, dims.y * 0.95, dims.x * 0.11), [dims]);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const root = useRef<THREE.Group>(null);
  const front = useRef<THREE.PointLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    screen.draw(s.phone.feed);
    screenMat.current?.color.setScalar(0.15 + s.phone.on * 1.1);
    glow.opacity = s.phone.on * 0.45;
    if (front.current) front.current.intensity = (0.4 + s.phone.on) * 7;
    if (rim.current) rim.current.intensity = (0.3 + s.phone.on) * 10;
    if (root.current) {
      root.current.position.set(PHONE[0], PHONE[1] + Math.sin(t * 0.7) * 0.03, PHONE[2]);
      root.current.rotation.set(-0.12, -0.55 + s.phone.spin * 0.5, 0.32 - s.phone.spin * 0.12);
    }
  });

  return (
    <group>
      <group ref={root}>
        <primitive object={model} />
        <mesh geometry={screenGeo} position={[0, 0, dims.z / 2 + 0.004]}>
          <meshBasicMaterial ref={screenMat} map={screen.texture} toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={front} position={[PHONE[0] - 0.9, PHONE[1] + 0.5, PHONE[2] + 1.5]} color="#e2dcff" distance={5} decay={2} intensity={0} />
      <pointLight ref={rim} position={[PHONE[0] + 0.8, PHONE[1] + 0.9, PHONE[2] - 0.9]} color="#8a5cff" distance={4} decay={2} intensity={0} />
      <mesh rotation-x={-Math.PI / 2} position={[PHONE[0], 0.015, PHONE[2]]} material={glow}>
        <circleGeometry args={[1.1, 48]} />
      </mesh>
      <Tube position={[PHONE[0] + 2.4, 1.05, PHONE[2] - 1.4]} color={VIOLET} height={1.9} strength={3} />
      <Tube position={[PHONE[0] - 2.8, 1.05, PHONE[2] - 2]} color={BLUE} height={1.9} strength={3} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 10 · CREATIVE / STUDIO LIGHTING
// ═══════════════════════════════════════════════════════════
function CreativeSet({ s, q }: Props) {
  const subject: V3 = [CREATIVE[0] - 0.9, 1, CREATIVE[2] - 0.7];
  return (
    <group>
      <Softbox q={q} position={CREATIVE} target={subject} on={() => s.creative.on} scale={1.3} />
      <SmallCamera q={q} position={[CREATIVE[0] - 1.3, 0, CREATIVE[2] - 1.1]} target={[CREATIVE[0], 1.2, CREATIVE[2]]} />
      <mesh position={[subject[0], 0.3, subject[2]]}>
        <cylinderGeometry args={[0.22, 0.22, 0.6, 24]} />
        <meshStandardMaterial color="#14141c" roughness={0.6} />
      </mesh>
      <Tube position={[CREATIVE[0] + 1.3, 1.05, CREATIVE[2] - 1.6]} color={BLUE} height={1.9} strength={3.4} />
      <Stand position={[CREATIVE[0] - 2.6, 0, CREATIVE[2] - 2]} height={2.8} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 11 · THE LOUNGE
// ═══════════════════════════════════════════════════════════
function Plant({ position, scale = 1 }: { position: V3; scale?: number }) {
  const leaves = useMemo(() => {
    const rnd = seeded(position[0] * 100 + position[2]);
    return Array.from({ length: 9 }, () => ({ r: [rnd() * 0.9 - 0.45, rnd() * 6.28, rnd() * 0.9 - 0.45] as V3, h: 0.5 + rnd() * 0.5 }));
  }, [position]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.2, 0.16, 0.44, 20]} />
        <meshStandardMaterial color="#17171d" roughness={0.5} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} position={[0, 0.44, 0]} rotation={l.r}>
          <coneGeometry args={[0.07, l.h * 1.4, 4]} />
          <meshStandardMaterial color="#0f2418" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Lounge({ s, q }: Props) {
  const lamp = useMemo(() => new THREE.MeshBasicMaterial({ color: WARM, toneMapped: false }), []);
  const sign = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    lamp.color.set(WARM).multiplyScalar(0.2 + s.lounge.on * 2.6);
    // the wall sign is the lounge's reveal — keep it from peeking down the hall behind earlier copy
    if (sign.current) sign.current.visible = camera.position.z < -29;
  });
  const L = LOUNGE;
  const fabric = <meshStandardMaterial color="#1a1a26" roughness={0.95} />;
  return (
    <group>
      <mesh position={[L[0], 0.006, L[2] + 0.3]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4.4, 3]} />
        <meshStandardMaterial color="#12111b" roughness={1} />
      </mesh>
      <group position={[L[0], 0, L[2] - 0.6]}>
        <RoundedBox args={[2.6, 0.42, 0.95]} radius={0.08} position={[0, 0.3, 0]}>
          {fabric}
        </RoundedBox>
        <RoundedBox args={[2.6, 0.55, 0.22]} radius={0.08} position={[0, 0.72, -0.38]}>
          {fabric}
        </RoundedBox>
        {[-1.3, 1.3].map((x) => (
          <RoundedBox key={x} args={[0.22, 0.55, 0.95]} radius={0.06} position={[x, 0.46, 0]}>
            {fabric}
          </RoundedBox>
        ))}
      </group>
      <RoundedBox args={[1.1, 0.32, 0.6]} radius={0.04} position={[L[0], 0.16, L[2] + 0.75]}>
        <meshStandardMaterial color="#141420" metalness={0.3} roughness={0.35} />
      </RoundedBox>
      <Plant position={[L[0] - 2.1, 0, L[2] - 1]} scale={1.3} />
      <Plant position={[L[0] + 2.2, 0, L[2] - 1.2]} />
      {/* floor lamp */}
      <group position={[L[0] + 1.75, 0, L[2] - 0.4]}>
        <Stand position={[0, 0, 0]} height={1.55} head={false} />
        <mesh position={[0, 1.62, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 0.26, 20, 1, true]} />
          <meshStandardMaterial color="#2a2016" side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.58, 0]} material={lamp}>
          <sphereGeometry args={[0.07, 14, 10]} />
        </mesh>
      </group>
      {/* back wall with the sign */}
      <mesh position={[L[0], 2.2, -44.6]}>
        <boxGeometry args={[7, 4.4, 0.1]} />
        <meshStandardMaterial color="#0b0b12" roughness={0.9} />
      </mesh>
      <group ref={sign}>
        <Logo s={s} q={q} position={[L[0], 2.35, -44.45]} size={0.42} sub={false} />
      </group>
      <pointLight position={[L[0], 2.6, -43.4]} color="#e6e8ff" intensity={2.5} distance={3} decay={2} />
      <Tube position={[L[0] - 3.1, 1.3, -44.3]} color={VIOLET} height={2.4} strength={3.4} />
      <Tube position={[L[0] + 3.1, 1.3, -44.3]} color={VIOLET} height={2.4} strength={3.4} />
      <WarmLamp position={[L[0] + 3.6, 0, L[2] + 0.4]} s={s} on={() => s.lounge.on} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// DUST in the light
// ═══════════════════════════════════════════════════════════
function Dust({ s, count }: { s: StoryState; count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rnd = seeded(42);
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) a.set([(rnd() - 0.5) * 14, rnd() * 5, 14 - rnd() * 60], i * 3);
    return a;
  }, [count]);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = (state.clock.elapsedTime * 0.04) % 1;
    (ref.current.material as THREE.PointsMaterial).opacity = 0.35 * s.intro;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#b8c2ff" size={0.016} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════
// LIGHTS — a roaming key + fill travel from set to set with the story;
// desktop adds practical glows at each set.
// ═══════════════════════════════════════════════════════════
function Lights({ s, q }: Props) {
  const hemi = useRef<THREE.HemisphereLight>(null);
  const head = useRef<THREE.PointLight>(null);
  const headOffset = useMemo(() => new THREE.Vector3(0, 0.35, 0), []);
  const camera = useThree((st) => st.camera);
  const key = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const practicals = useRef<(THREE.PointLight | null)[]>([]);
  const spots: { p: V3; c: string; i: number; on: () => number }[] = [
    { p: [-1.5, 1.6, -0.6], c: WARM, i: 3, on: () => s.hero.practicals },
    { p: [-1.8, 1.4, -1.6], c: BLUE, i: 4, on: () => s.hero.practicals },
    { p: [MEDIA[0] + 3, 1.4, MEDIA[2] - 1.3], c: BLUE, i: 4, on: () => s.media.on },
    { p: [PAD[0] - 3, 1.5, PAD[2] - 1.2], c: BLUE, i: 5, on: () => s.drone.spin },
    { p: [DESK[0] + 0.2, 1.1, DESK[2] + 0.5], c: "#6f8dff", i: 3, on: () => s.edit.on },
    { p: [PHONE[0], PHONE[1], PHONE[2] + 0.9], c: VIOLET, i: 3, on: () => s.phone.on },
    { p: [LOUNGE[0] + 1.75, 1.5, LOUNGE[2] - 0.2], c: WARM, i: 4, on: () => s.lounge.on },
    { p: [LOUNGE[0], 2.2, -43.8], c: VIOLET, i: 6, on: () => s.lounge.on },
  ];

  useFrame(() => {
    const k = s.key;
    if (key.current) {
      key.current.position.set(k.x, k.y, k.z);
      key.current.color.setRGB(k.r, k.g, k.b, THREE.SRGBColorSpace);
      key.current.intensity = k.i * 150 * (0.25 + 0.75 * s.intro);
    }
    target.position.set(k.tx, k.ty, k.tz);
    const f = s.fill;
    if (fill.current) {
      fill.current.position.set(f.x, f.y, f.z);
      fill.current.color.setRGB(f.r, f.g, f.b, THREE.SRGBColorSpace);
      fill.current.intensity = f.i * 28 * s.intro;
    }
    if (hemi.current) hemi.current.intensity = 1.1 * s.intro;
    // a soft light riding just above the camera: whatever is in front of us stays readable
    if (head.current) {
      head.current.position.copy(camera.position).add(headOffset);
      head.current.intensity = 7 * s.intro;
    }
    practicals.current.forEach((l, i) => l && (l.intensity = spots[i].i * spots[i].on() * s.intro));
  });

  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemi} args={["#8a93e0", "#141222", 0]} />
      <pointLight ref={head} color="#d4dbff" distance={7} decay={1.6} intensity={0} />
      <spotLight
        ref={key}
        target={target}
        angle={0.55}
        penumbra={0.85}
        decay={2}
        distance={20}
        intensity={0}
        castShadow={q.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight ref={fill} distance={10} decay={2} intensity={0} />
      {q.extraLights &&
        spots.map((sp, i) => (
          <pointLight key={i} ref={(el) => void (practicals.current[i] = el)} position={sp.p} color={sp.c} distance={5} decay={2} intensity={0} />
        ))}
      {q.extraLights && (
        <>
          <Beam from={[-2.2, 8, LOGO_Z + 1.5]} to={[-0.9, 0, LOGO_Z]} radius={1.3} color="#aab8ff" opacity={() => 0.06 * s.intro * s.logo.glow} />
          <Beam from={[2.2, 8, LOGO_Z + 1.5]} to={[0.9, 0, LOGO_Z]} radius={1.3} color="#aab8ff" opacity={() => 0.06 * s.intro * s.logo.glow} />
          <Beam from={[PAD[0], 8, PAD[2]]} to={[PAD[0], 0, PAD[2]]} radius={2} color="#9fb2ff" opacity={() => 0.05 * s.drone.spin} />
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// POST (desktop) + render gating
// ═══════════════════════════════════════════════════════════
function Effects({ s }: { s: StoryState }) {
  const bloom = useRef<{ intensity: number } | null>(null);
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = s.fx.bloom;
  });
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom ref={bloom as never} mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.25} intensity={0.7} radius={0.75} />
      <Vignette offset={0.3} darkness={0.75} />
    </EffectComposer>
  );
}

function Gate({ gate }: { gate: FrameGate }) {
  const setFrameloop = useThree((st) => st.setFrameloop);
  const get = useThree((st) => st.get);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __r3f: unknown }).__r3f = get;
    gate.current = setFrameloop;
    return () => {
      gate.current = null;
    };
  }, [gate, setFrameloop, get]);
  return null;
}

export default function StoryCanvas({ s, q, gate }: Props & { gate: FrameGate }) {
  const [dpr, setDpr] = useState(q.dpr[1]);
  // Kick off every model download in parallel before the first suspend.
  useMemo(() => MODELS.forEach((m) => useGLTF.preload(modelUrl(q, m), false, true)), [q]);
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      shadows={q.shadows}
      camera={{ position: CAM_KEYS[0].pos, fov: 36, near: 0.05, far: 200 }}
      gl={{ antialias: !q.post, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, stencil: false }}
    >
      <Gate gate={gate} />
      <PerformanceMonitor onDecline={() => setDpr(q.dpr[0])} onIncline={() => setDpr(q.dpr[1])} flipflops={3} />
      <Atmosphere s={s} />
      <Rig s={s} q={q} />
      <Lights s={s} q={q} />
      <Environment frames={1} resolution={q.mobile ? 64 : 128}>
        <Lightformer form="rect" intensity={2.4} color="#c8d3ff" scale={[10, 2, 1]} position={[0, 6, -2]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.8} color="#7a4dff" scale={[4, 6, 1]} position={[-8, 2, 0]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} color="#3f6bff" scale={[4, 6, 1]} position={[8, 2, 0]} rotation-y={-Math.PI / 2} />
        <Lightformer form="rect" intensity={1.4} color={WARM} scale={[3, 3, 1]} position={[3, 3, 6]} />
      </Environment>
      <Hangar q={q} />
      <Suspense fallback={null}>
        <Logo s={s} q={q} />
        <HeroCamera s={s} q={q} />
        <MediaSet s={s} q={q} />
        <DroneSet s={s} q={q} />
        <EditSet s={s} q={q} />
        <PhoneSet s={s} q={q} />
        <CreativeSet s={s} q={q} />
        <Lounge s={s} q={q} />
      </Suspense>
      <Dust s={s} count={q.dust} />
      {q.post && <Effects s={s} />}
    </Canvas>
  );
}
