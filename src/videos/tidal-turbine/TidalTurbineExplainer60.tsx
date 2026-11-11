import React, {useMemo} from "react";
import * as THREE from "three";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";

export const TIDAL_TURBINE_60_FRAMES = 1800;

const FPS = 30;
const SCENE_FRAMES = 300;
const INK = "#17192c";
const CYAN = "#75edf2";
const GOLD = "#ffd34f";

type V3 = [number, number, number];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoother = (value: number) => {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const mix3 = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const sceneProgress = (frame: number) => (frame % SCENE_FRAMES) / (SCENE_FRAMES - 1);
const sceneNumber = (frame: number) => Math.min(5, Math.floor(frame / SCENE_FRAMES));
const sceneVisibility = (frame: number) => {
  const local = frame % SCENE_FRAMES;
  return Math.min(
    interpolate(local, [0, 24], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
    interpolate(local, [260, 299], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
  );
};

const CAMERA_KEYS: {frame: number; pos: V3; look: V3; fov: number; roll: number}[] = [
  {frame: 0, pos: [12.5, 5.4, 17.5], look: [0.5, 0.0, 0], fov: 45, roll: -0.018},
  {frame: 180, pos: [9.6, 4.0, 14.0], look: [0.0, 0.4, 0], fov: 42, roll: 0.012},
  {frame: 299, pos: [8.6, 3.2, 12.6], look: [-0.5, 0.75, 0], fov: 41, roll: 0},
  {frame: 450, pos: [8.2, 2.5, 11.6], look: [-1.2, 1.0, 0], fov: 39, roll: -0.012},
  {frame: 599, pos: [6.8, 2.4, 10.0], look: [-1.55, 1.1, 0], fov: 38, roll: 0.014},
  {frame: 750, pos: [4.8, 2.2, 7.5], look: [-1.5, 1.12, 0], fov: 36, roll: -0.015},
  {frame: 899, pos: [3.5, 1.9, 6.6], look: [-0.65, 1.15, 0], fov: 35, roll: 0.012},
  {frame: 1050, pos: [2.5, 2.2, 6.1], look: [0.05, 1.18, 0], fov: 34, roll: -0.01},
  {frame: 1199, pos: [4.6, 2.5, 7.8], look: [0.3, 0.65, 0.25], fov: 38, roll: 0.01},
  {frame: 1350, pos: [10.6, 2.9, 10.7], look: [6.2, -1.4, 0.8], fov: 40, roll: -0.012},
  {frame: 1499, pos: [15.0, 3.8, 13.2], look: [9.2, -0.7, 1.0], fov: 42, roll: 0.008},
  {frame: 1650, pos: [16.0, 6.4, 19.0], look: [3.4, -0.1, 0.5], fov: 45, roll: -0.008},
  {frame: 1799, pos: [17.5, 7.2, 21.0], look: [3.5, -0.25, 0.6], fov: 47, roll: 0},
];

const cameraAt = (frame: number) => {
  let index = 0;
  while (index < CAMERA_KEYS.length - 2 && frame > CAMERA_KEYS[index + 1].frame) index++;
  const a = CAMERA_KEYS[index];
  const b = CAMERA_KEYS[index + 1];
  const t = smoother((frame - a.frame) / Math.max(1, b.frame - a.frame));
  return {
    pos: mix3(a.pos, b.pos, t),
    look: mix3(a.look, b.look, t),
    fov: a.fov + (b.fov - a.fov) * t,
    roll: a.roll + (b.roll - a.roll) * t,
  };
};

const OutlinedBox: React.FC<{size: V3; position?: V3; rotation?: V3; color: string; opacity?: number}> = ({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  opacity = 1,
}) => {
  const geometry = useMemo(() => new THREE.BoxGeometry(...size), [size[0], size[1], size[2]]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 28), [geometry]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshToonMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={5}>
        <lineBasicMaterial color={INK} transparent={opacity < 1} opacity={Math.max(0.25, opacity)} />
      </lineSegments>
    </group>
  );
};

const OutlinedCylinder: React.FC<{
  radiusTop: number;
  radiusBottom?: number;
  height: number;
  position?: V3;
  rotation?: V3;
  color: string;
  segments?: number;
  opacity?: number;
}> = ({radiusTop, radiusBottom = radiusTop, height, position = [0, 0, 0], rotation = [0, 0, 0], color, segments = 20, opacity = 1}) => {
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    [radiusTop, radiusBottom, height, segments],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 34), [geometry]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshToonMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={5}>
        <lineBasicMaterial color={INK} transparent={opacity < 1} opacity={Math.max(0.25, opacity)} />
      </lineSegments>
    </group>
  );
};

const makeFishTexture = (body: string, fin: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  const g = canvas.getContext("2d")!;
  g.lineJoin = "round";
  g.lineCap = "round";
  g.strokeStyle = "#241726";
  g.lineWidth = 12;
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(64, 90);
  g.bezierCurveTo(98, 35, 220, 38, 264, 88);
  g.bezierCurveTo(218, 144, 101, 143, 64, 90);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = fin;
  g.beginPath();
  g.moveTo(68, 88);
  g.lineTo(18, 46);
  g.lineTo(30, 92);
  g.lineTo(18, 137);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(147, 57);
  g.lineTo(170, 18);
  g.lineTo(195, 61);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = "#fff7de";
  g.beginPath();
  g.arc(232, 74, 12, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = INK;
  g.beginPath();
  g.arc(235, 75, 5, 0, Math.PI * 2);
  g.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const makeArrowTexture = (color = CYAN) => {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 120;
  const g = canvas.getContext("2d")!;
  g.lineJoin = "round";
  g.strokeStyle = "#18233d";
  g.lineWidth = 13;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(24, 44);
  g.lineTo(280, 44);
  g.lineTo(280, 18);
  g.lineTo(395, 60);
  g.lineTo(280, 104);
  g.lineTo(280, 77);
  g.lineTo(24, 77);
  g.closePath();
  g.fill();
  g.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const FishSchool: React.FC<{frame: number}> = ({frame}) => {
  const textures = useMemo(() => [
    makeFishTexture("#ffcc55", "#f07452"),
    makeFishTexture("#f08ab8", "#784fa3"),
    makeFishTexture("#9be66e", "#2a8f83"),
  ], []);
  const fish = [
    {seed: 0.2, y: 3.2, z: -2.6, scale: 1.05},
    {seed: 0.7, y: 2.4, z: -4.1, scale: 0.78},
    {seed: 1.1, y: 0.0, z: 3.1, scale: 0.9},
    {seed: 1.8, y: -0.8, z: -3.8, scale: 0.68},
    {seed: 2.4, y: 3.8, z: 2.5, scale: 0.62},
  ];
  return <>{fish.map((item, index) => {
    const x = -10 + ((frame * 0.035 + item.seed * 7.1) % 24);
    const y = item.y + 0.18 * Math.sin(frame * 0.055 + item.seed * 5);
    return (
      <sprite key={index} position={[x, y, item.z]} scale={[2.0 * item.scale, 1.1 * item.scale, 1]}>
        <spriteMaterial map={textures[index % textures.length]} transparent depthWrite={false} />
      </sprite>
    );
  })}</>;
};

const CurrentArrows: React.FC<{frame: number}> = ({frame}) => {
  const texture = useMemo(() => makeArrowTexture(), []);
  const activeScene = sceneNumber(frame);
  const speed = activeScene === 1 || activeScene === 2 ? 0.105 : 0.07;
  const rows = [
    {seed: 0.0, y: 3.4, z: 1.5, s: 1.0},
    {seed: 0.25, y: 2.0, z: -1.7, s: 0.84},
    {seed: 0.5, y: 0.5, z: 2.2, s: 0.95},
    {seed: 0.75, y: -1.0, z: -2.3, s: 0.72},
    {seed: 1.1, y: 1.0, z: 4.2, s: 0.62},
    {seed: 1.55, y: 2.8, z: 3.6, s: 0.68},
  ];
  return <>{rows.map((item, index) => {
    const x = -12 + ((frame * speed + item.seed * 17) % 25);
    const pulse = 0.72 + 0.22 * Math.sin(frame * 0.08 + index);
    return (
      <sprite key={index} position={[x, item.y, item.z]} scale={[3.0 * item.s, 0.82 * item.s, 1]}>
        <spriteMaterial map={texture} transparent opacity={pulse} depthWrite={false} />
      </sprite>
    );
  })}</>;
};

const RotorBlade: React.FC = () => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.17, 0.3);
    shape.bezierCurveTo(-0.28, 0.78, -0.46, 1.55, -0.34, 2.25);
    shape.bezierCurveTo(-0.18, 2.48, 0.08, 2.44, 0.18, 2.18);
    shape.bezierCurveTo(0.25, 1.5, 0.15, 0.72, 0.17, 0.3);
    shape.closePath();
    const result = new THREE.ShapeGeometry(shape, 20);
    result.rotateY(Math.PI / 2);
    return result;
  }, []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 20), [geometry]);
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshToonMaterial color="#efc14e" side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={6}>
        <lineBasicMaterial color={INK} />
      </lineSegments>
    </group>
  );
};

const rotorRotation = (frame: number) => {
  if (frame <= 600) return frame * 0.045;
  if (frame <= 900) {
    const t = frame - 600;
    return 27 + t * 0.045 + t * t * 0.00008;
  }
  return 47.7 + (frame - 900) * 0.093;
};

const TorqueArcs: React.FC<{frame: number}> = ({frame}) => {
  const visible = smoother((frame - 620) / 45) * (1 - smoother((frame - 900) / 50));
  return (
    <group position={[-1.72, 1.15, 0]} rotation={[0, Math.PI / 2, 0]} visible={visible > 0.01}>
      {[0, 1, 2].map((index) => (
        <mesh key={index} rotation={[0, 0, index * Math.PI * 2 / 3 + frame * 0.035]}>
          <torusGeometry args={[2.65 + index * 0.18, 0.045, 8, 64, Math.PI * 0.44]} />
          <meshBasicMaterial color={CYAN} transparent opacity={visible * (0.9 - index * 0.18)} />
        </mesh>
      ))}
    </group>
  );
};

const GeneratorCutaway: React.FC<{frame: number}> = ({frame}) => {
  const reveal = smoother((frame - 910) / 60) * (1 - 0.7 * smoother((frame - 1210) / 80));
  const electrical = smoother((frame - 960) / 90);
  return (
    <group position={[0.15, 1.15, 0]} visible={reveal > 0.01}>
      <OutlinedCylinder radiusTop={0.14} height={2.7} position={[-0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]} color="#77839d" opacity={reveal} />
      <OutlinedCylinder radiusTop={0.34} height={0.95} position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} color="#ef6b55" opacity={reveal} />
      {[-0.42, -0.14, 0.14, 0.42].map((offset, index) => (
        <mesh key={offset} position={[0.2 + offset, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.54, 0.07, 10, 36]} />
          <meshStandardMaterial
            color="#ffb34c"
            emissive="#ffd24c"
            emissiveIntensity={0.7 + electrical * 1.8}
            transparent
            opacity={reveal}
          />
        </mesh>
      ))}
      <pointLight color="#ffd34f" intensity={electrical * reveal * 3.2} distance={4.5} />
    </group>
  );
};

const Turbine: React.FC<{frame: number}> = ({frame}) => {
  const cutaway = smoother((frame - 910) / 60) * (1 - smoother((frame - 1210) / 80));
  const shaftGlow = smoother((frame - 660) / 80);
  return (
    <group>
      <OutlinedCylinder radiusTop={0.52} radiusBottom={0.78} height={4.5} position={[0.55, -1.1, 0]} color="#e9a354" />
      <OutlinedBox size={[2.7, 0.74, 0.78]} position={[0.05, 1.15, 0]} color="#ef8354" opacity={1 - cutaway * 0.72} />
      <OutlinedCylinder radiusTop={0.5} height={1.8} position={[-0.65, 1.15, 0]} rotation={[0, 0, Math.PI / 2]} color="#f6b15a" opacity={1 - cutaway * 0.65} />
      <group position={[-1.58, 1.15, 0]} rotation={[rotorRotation(frame), 0, 0]}>
        {[0, 1, 2].map((index) => (
          <group key={index} rotation={[index * Math.PI * 2 / 3, 0, 0]}>
            <RotorBlade />
          </group>
        ))}
        <mesh castShadow>
          <sphereGeometry args={[0.48, 24, 16]} />
          <meshToonMaterial color="#f15e52" />
        </mesh>
      </group>
      <mesh position={[-0.75, 1.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 1.72, 16]} />
        <meshStandardMaterial color="#fff0a6" emissive="#ffc83d" emissiveIntensity={shaftGlow * 1.5} />
      </mesh>
      <TorqueArcs frame={frame} />
      <GeneratorCutaway frame={frame} />
    </group>
  );
};

const PowerCable: React.FC<{frame: number}> = ({frame}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.6, -3.18, 0),
    new THREE.Vector3(2.8, -3.32, 0.5),
    new THREE.Vector3(5.8, -3.22, 1.2),
    new THREE.Vector3(8.6, -2.9, 1.5),
    new THREE.Vector3(10.2, -1.65, 1.4),
  ]), []);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 72, 0.11, 9, false), [curve]);
  const power = smoother((frame - 1000) / 100);
  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshToonMaterial color="#312b48" />
      </mesh>
      {[0, 1, 2, 3, 4].map((index) => {
        const u = (frame * 0.008 + index / 5) % 1;
        const point = curve.getPoint(u);
        return (
          <mesh key={index} position={point} visible={power > 0.01}>
            <sphereGeometry args={[0.16 + 0.03 * Math.sin(frame * 0.1 + index), 12, 8]} />
            <meshStandardMaterial color="#fff0a6" emissive="#ffca3a" emissiveIntensity={2.4} transparent opacity={power} />
          </mesh>
        );
      })}
      {[0, 1, 2].map((index) => {
        const y = 0.7 - ((frame * 0.025 + index * 1.25) % 3.8);
        return (
          <mesh key={`tower-${index}`} position={[0.55, y, 0]} visible={power > 0.01}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#fff5a8" emissive="#ffd34f" emissiveIntensity={2.2} transparent opacity={power} />
          </mesh>
        );
      })}
    </group>
  );
};

const PowerConditioningStation: React.FC<{frame: number}> = ({frame}) => {
  const power = smoother((frame - 1230) / 100);
  const blink = 0.45 + 0.45 * Math.sin(frame * 0.09);
  return (
    <group position={[10.3, -1.45, 1.4]}>
      <OutlinedBox size={[2.0, 2.5, 1.6]} position={[0, 0.8, 0]} color="#f08a57" />
      <OutlinedBox size={[1.5, 0.72, 1.72]} position={[0, 0.95, 0]} color="#335d7a" />
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[-0.48 + index * 0.48, 1.05, 0.88]}>
          <circleGeometry args={[0.11, 20]} />
          <meshStandardMaterial
            color={index === 0 ? "#8ff28a" : "#ffe66b"}
            emissive={index === 0 ? "#54e36c" : "#ffc83d"}
            emissiveIntensity={power * (index === 0 ? 2.5 : 1.2 + blink)}
          />
        </mesh>
      ))}
      <OutlinedCylinder radiusTop={1.55} radiusBottom={1.9} height={0.65} position={[0, -0.78, 0]} color="#7d6d76" segments={8} />
      <pointLight position={[0, 1.2, 0.6]} color="#ffd34f" intensity={power * 2.5} distance={5} />
    </group>
  );
};

const Seafloor: React.FC<{frame: number}> = ({frame}) => {
  const rockData = [
    [-5.2, -2.8, 2.8, 0.9], [-3.2, -3.05, -3.6, 0.65], [3.8, -2.95, -2.8, 0.75],
    [6.5, -3.0, 2.4, 1.0], [-6.7, -3.1, -1.0, 0.55], [1.8, -3.15, 4.4, 0.6],
    [9.2, -2.7, 2.8, 1.15], [11.4, -2.5, 0.2, 1.4],
  ] as const;
  const grassData = [[-5, -2.75, 1.7], [-3.7, -2.9, -2.7], [3.5, -2.75, -2.0], [5.4, -2.8, 1.6], [1.8, -2.9, 3.7], [8.1, -2.8, -1.2]] as const;
  return (
    <group>
      <mesh position={[2.5, -3.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 30, 1, 1]} />
        <meshToonMaterial color="#b98155" />
      </mesh>
      {rockData.map(([x, y, z, scale], index) => (
        <group key={index} position={[x, y, z]} scale={[scale * 1.3, scale * 0.75, scale]} rotation={[0.1, index * 0.8, 0.08]}>
          <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshToonMaterial color={index % 2 ? "#766c83" : "#6d8290"} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.DodecahedronGeometry(1, 0), 25]} />
            <lineBasicMaterial color={INK} />
          </lineSegments>
        </group>
      ))}
      {grassData.map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]} rotation={[0, 0, 0.08 * Math.sin(frame * 0.05 + index)]}>
          {[-0.28, 0, 0.28].map((offset, blade) => (
            <OutlinedCylinder
              key={blade}
              radiusTop={0.04}
              radiusBottom={0.1}
              height={1.3 + blade * 0.25}
              position={[offset, 0.65, 0]}
              rotation={[0, 0, offset * 0.4]}
              color={blade % 2 ? "#2eaa7a" : "#3fc590"}
              segments={8}
            />
          ))}
        </group>
      ))}
    </group>
  );
};

const Bubbles: React.FC<{frame: number}> = ({frame}) => {
  const bubbles = useMemo(() => Array.from({length: 30}, (_, index) => ({
    x: -8 + ((index * 37) % 200) / 10,
    y: -3 + ((index * 19) % 70) / 10,
    z: -5 + ((index * 53) % 100) / 10,
    size: 0.035 + (index % 4) * 0.018,
    speed: 0.012 + (index % 5) * 0.004,
  })), []);
  return <>{bubbles.map((bubble, index) => {
    const y = -3.2 + ((bubble.y + 3.2 + frame * bubble.speed) % 8.5);
    return (
      <mesh key={index} position={[bubble.x + 0.08 * Math.sin(frame * 0.04 + index), y, bubble.z]}>
        <sphereGeometry args={[bubble.size, 8, 6]} />
        <meshBasicMaterial color="#c7f8ff" transparent opacity={0.72} />
      </mesh>
    );
  })}</>;
};

const Scene3D: React.FC<{frame: number}> = ({frame}) => {
  const {camera} = useThree();
  const view = cameraAt(frame);
  const perspective = camera as THREE.PerspectiveCamera;
  perspective.position.set(...view.pos);
  perspective.fov = view.fov;
  perspective.up.set(Math.sin(view.roll), Math.cos(view.roll), 0);
  perspective.lookAt(...view.look);
  perspective.updateProjectionMatrix();

  const surfaceShift = 0.2 * Math.sin(frame * 0.018);
  return (
    <>
      <color attach="background" args={["#087eae"]} />
      <fog attach="fog" args={["#0a789d", 10, 34]} />
      <hemisphereLight color="#c9f5ff" groundColor="#36536a" intensity={1.25} />
      <directionalLight
        position={[8, 11, 9]}
        color="#ffe2b0"
        intensity={2.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <directionalLight position={[-7, 3, -5]} color="#6a7fd9" intensity={0.8} />
      <mesh position={[2, 8.8 + surfaceShift, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[46, 34, 1, 1]} />
        <meshPhongMaterial color="#8cf2f0" transparent opacity={0.22} shininess={100} side={THREE.DoubleSide} />
      </mesh>
      <Seafloor frame={frame} />
      <PowerCable frame={frame} />
      <Turbine frame={frame} />
      <PowerConditioningStation frame={frame} />
      <CurrentArrows frame={frame} />
      <FishSchool frame={frame} />
      <Bubbles frame={frame} />
    </>
  );
};

type SceneCopy = {
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  chips: string[];
};

const SCENE_COPY: SceneCopy[] = [
  {
    eyebrow: "ADEGAN 1 · PENGENALAN",
    title: "Turbin Arus Laut",
    body: "Memanen energi dari arus laut yang bergerak.",
    accent: "#77ecf0",
    chips: ["ARUS PASANG-SURUT", "TURBIN BAWAH LAUT"],
  },
  {
    eyebrow: "ADEGAN 2 · ENERGI KINETIK",
    title: "Air Bergerak Membawa Energi",
    body: "Semakin cepat arus, semakin besar energi kinetik yang tersedia.",
    accent: "#77ecf0",
    chips: ["ARUS AIR LAUT", "ENERGI KINETIK"],
  },
  {
    eyebrow: "ADEGAN 3 · PUTARAN MEKANIK",
    title: "Arus Memutar Rotor",
    body: "Gaya pada bilah memutar rotor, lalu poros meneruskan putaran.",
    accent: "#ffd34f",
    chips: ["ROTOR", "POROS"],
  },
  {
    eyebrow: "ADEGAN 4 · PEMBANGKITAN",
    title: "Generator Membuat Listrik",
    body: "Putaran poros diubah menjadi listrik melalui induksi elektromagnetik.",
    accent: "#ffb34c",
    chips: ["GENERATOR", "MAGNET + KUMPARAN"],
  },
  {
    eyebrow: "ADEGAN 5 · PENYALURAN",
    title: "Daya Dikirim ke Daratan",
    body: "Kabel bawah laut membawa listrik ke sistem pengondisian daya.",
    accent: "#ffe66b",
    chips: ["KABEL BAWAH LAUT", "PENGONDISIAN DAYA"],
  },
  {
    eyebrow: "ADEGAN 6 · RANGKUMAN",
    title: "Dari Arus Menjadi Listrik",
    body: "Energi mengalir melalui enam tahap yang saling terhubung.",
    accent: "#8ff28a",
    chips: ["ARUS", "ROTOR", "POROS", "GENERATOR", "KABEL", "JARINGAN"],
  },
];

const ScientificOverlay: React.FC<{frame: number}> = ({frame}) => {
  const scene = sceneNumber(frame);
  const copy = SCENE_COPY[scene];
  const visibility = sceneVisibility(frame);
  const progress = sceneProgress(frame);
  const rise = 14 * (1 - smoother(Math.min(1, progress * 8)));
  return (
    <AbsoluteFill style={{pointerEvents: "none", color: "#fff", fontFamily: "Inter, Arial, sans-serif"}}>
      <div style={{position: "absolute", left: 28, right: 28, top: 42, opacity: visibility, transform: `translateY(${rise}px)`}}>
        <div style={{fontSize: 14, fontWeight: 900, letterSpacing: 1.8, color: copy.accent, textShadow: "0 2px 5px #10213c"}}>
          {copy.eyebrow}
        </div>
        <div style={{fontSize: 38, lineHeight: 1.02, fontWeight: 950, marginTop: 7, textShadow: "0 4px 12px rgba(10,20,45,0.72)"}}>
          {copy.title}
        </div>
        <div style={{fontSize: 18, lineHeight: 1.28, fontWeight: 700, marginTop: 10, maxWidth: 440, textShadow: "0 3px 10px rgba(10,20,45,0.85)"}}>
          {copy.body}
        </div>
      </div>

      <div style={{position: "absolute", left: 24, right: 24, bottom: 38, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, opacity: visibility}}>
        {copy.chips.map((chip, index) => (
          <div
            key={chip}
            style={{
              background: "rgba(15,25,53,0.88)",
              border: `3px solid ${index === 0 ? copy.accent : "#e8f7ff"}`,
              borderRadius: 999,
              padding: "9px 14px",
              fontSize: scene === 5 ? 13 : 14,
              fontWeight: 950,
              letterSpacing: 0.8,
              boxShadow: "0 5px 0 rgba(15,25,53,0.32)",
            }}
          >
            {chip}
          </div>
        ))}
      </div>

      <div style={{position: "absolute", left: 28, right: 28, bottom: 19, height: 4, borderRadius: 3, background: "rgba(255,255,255,0.24)"}}>
        <div style={{height: "100%", width: `${((frame + 1) / TIDAL_TURBINE_60_FRAMES) * 100}%`, borderRadius: 3, background: copy.accent}} />
      </div>
    </AbsoluteFill>
  );
};

export const TidalTurbineExplainer60: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: "#087eae"}}>
      <ThreeCanvas
        width={540}
        height={960}
        shadows
        camera={{fov: 45, near: 0.1, far: 60}}
        gl={{antialias: true, toneMappingExposure: 1.05, powerPreference: "high-performance"}}
      >
        <Scene3D frame={frame} />
      </ThreeCanvas>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 46%, transparent 45%, rgba(9,23,52,0.34) 100%)",
        }}
      />
      <ScientificOverlay frame={frame} />
    </AbsoluteFill>
  );
};
