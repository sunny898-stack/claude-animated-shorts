import React, {useMemo} from "react";
import * as THREE from "three";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";

export const TIDAL_TURBINE_FRAMES = 300;
const INK = "#17192c";

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

const CAMERA_KEYS: {frame: number; pos: V3; look: V3; fov: number; roll: number}[] = [
  {frame: 0, pos: [10.8, 4.8, 15.5], look: [0, 0.1, 0], fov: 43, roll: -0.025},
  {frame: 75, pos: [7.0, 2.9, 10.3], look: [-0.3, 0.7, 0], fov: 40, roll: 0.018},
  {frame: 150, pos: [3.7, 2.2, 7.2], look: [-0.7, 1.05, 0], fov: 37, roll: -0.02},
  {frame: 225, pos: [-3.3, 2.1, 7.4], look: [-0.5, 0.85, 0], fov: 39, roll: 0.026},
  {frame: 299, pos: [9.0, 4.2, 13.8], look: [0.8, -0.1, 0.7], fov: 44, roll: 0},
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

const OutlinedBox: React.FC<{
  size: V3;
  position?: V3;
  rotation?: V3;
  color: string;
}> = ({size, position = [0, 0, 0], rotation = [0, 0, 0], color}) => {
  const geometry = useMemo(() => new THREE.BoxGeometry(...size), [size[0], size[1], size[2]]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 28), [geometry]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshToonMaterial color={color} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={3}>
        <lineBasicMaterial color={INK} />
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
}> = ({radiusTop, radiusBottom = radiusTop, height, position = [0, 0, 0], rotation = [0, 0, 0], color, segments = 20}) => {
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    [radiusTop, radiusBottom, height, segments],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 34), [geometry]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshToonMaterial color={color} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={3}>
        <lineBasicMaterial color={INK} />
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
  texture.needsUpdate = true;
  return texture;
};

const makeArrowTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 120;
  const g = canvas.getContext("2d")!;
  g.lineJoin = "round";
  g.strokeStyle = "#18233d";
  g.lineWidth = 13;
  g.fillStyle = "#69e7ef";
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
  texture.needsUpdate = true;
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
    const x = -9 + ((frame * 0.045 + item.seed * 6.7) % 18);
    const y = item.y + 0.18 * Math.sin(frame * 0.055 + item.seed * 5);
    return (
      <sprite key={index} position={[x, y, item.z]} scale={[2.0 * item.scale, 1.1 * item.scale, 1]}>
        <spriteMaterial map={textures[index % textures.length]} transparent depthWrite={false} />
      </sprite>
    );
  })}</>;
};

const CurrentArrows: React.FC<{frame: number}> = ({frame}) => {
  const texture = useMemo(makeArrowTexture, []);
  const rows = [
    {seed: 0.0, y: 3.4, z: 1.5, s: 1.0},
    {seed: 0.25, y: 2.0, z: -1.7, s: 0.84},
    {seed: 0.5, y: 0.5, z: 2.2, s: 0.95},
    {seed: 0.75, y: -1.0, z: -2.3, s: 0.72},
    {seed: 1.1, y: 1.0, z: 4.2, s: 0.62},
  ];
  return <>{rows.map((item, index) => {
    const x = -10 + ((frame * 0.075 + item.seed * 15) % 20);
    const pulse = 0.76 + 0.16 * Math.sin(frame * 0.08 + index);
    return (
      <sprite key={index} position={[x, item.y, item.z]} scale={[2.8 * item.s, 0.8 * item.s, 1]}>
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
      <lineSegments geometry={edges} renderOrder={4}>
        <lineBasicMaterial color={INK} />
      </lineSegments>
    </group>
  );
};

const Turbine: React.FC<{frame: number}> = ({frame}) => {
  const rotation = frame * 0.06 + frame * frame * 0.00008;
  const generator = smoother((frame - 120) / 55);
  return (
    <group>
      <OutlinedCylinder radiusTop={0.52} radiusBottom={0.78} height={4.5} position={[0.55, -1.1, 0]} color="#e9a354" />
      <OutlinedBox size={[2.7, 0.65, 0.65]} position={[0.05, 1.15, 0]} color="#ef8354" />
      <OutlinedCylinder radiusTop={0.5} height={1.8} position={[-0.65, 1.15, 0]} rotation={[0, 0, Math.PI / 2]} color="#f6b15a" />
      <group position={[-1.58, 1.15, 0]} rotation={[rotation, 0, 0]}>
        {[0, 1, 2].map((index) => (
          <group key={index} rotation={[index * Math.PI * 2 / 3, 0, 0]}>
            <RotorBlade />
          </group>
        ))}
        <mesh castShadow>
          <sphereGeometry args={[0.48, 24, 16]} />
          <meshToonMaterial color="#f15e52" />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.SphereGeometry(0.49, 12, 8), 30]} />
          <lineBasicMaterial color={INK} />
        </lineSegments>
      </group>
      <mesh position={[-1.52, 1.15, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.68 + generator * 0.12, 0.07, 10, 40]} />
        <meshStandardMaterial color="#fff2a8" emissive="#ffc83d" emissiveIntensity={1.5 * generator} transparent opacity={generator} />
      </mesh>
      <pointLight position={[-1.1, 1.15, 0]} color="#ffd45c" intensity={2.5 * generator} distance={5} />
    </group>
  );
};

const PowerCable: React.FC<{frame: number}> = ({frame}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.6, -3.18, 0),
    new THREE.Vector3(2.2, -3.28, 0.6),
    new THREE.Vector3(4.6, -3.2, 1.8),
    new THREE.Vector3(8.8, -3.05, 3.1),
  ]), []);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 48, 0.1, 8, false), [curve]);
  const power = smoother((frame - 145) / 45);
  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshToonMaterial color="#312b48" />
      </mesh>
      {[0, 1, 2].map((index) => {
        const u = (frame * 0.012 + index / 3) % 1;
        const point = curve.getPoint(u);
        return (
          <mesh key={index} position={point} visible={power > 0.01}>
            <sphereGeometry args={[0.16 + 0.03 * Math.sin(frame * 0.1 + index), 12, 8]} />
            <meshStandardMaterial color="#fff0a6" emissive="#ffca3a" emissiveIntensity={2.2} transparent opacity={power} />
          </mesh>
        );
      })}
    </group>
  );
};

const Seafloor: React.FC<{frame: number}> = ({frame}) => {
  const rockData = [
    [-4.8, -2.8, 2.8, 0.9], [-3.2, -3.05, -3.6, 0.65], [3.8, -2.95, -2.8, 0.75],
    [5.7, -3.0, 2.2, 1.0], [-6.5, -3.1, -1.0, 0.55], [1.8, -3.15, 4.4, 0.6],
  ] as const;
  const grassData = [[-5, -2.75, 1.7], [-3.7, -2.9, -2.7], [3.5, -2.75, -2.0], [5.4, -2.8, 1.6], [1.8, -2.9, 3.7]] as const;
  return (
    <group>
      <mesh position={[0, -3.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[35, 28, 1, 1]} />
        <meshToonMaterial color="#b98155" />
      </mesh>
      {rockData.map(([x, y, z, s], index) => (
        <group key={index} position={[x, y, z]} scale={[s * 1.3, s * 0.75, s]} rotation={[0.1, index * 0.8, 0.08]}>
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
            <OutlinedCylinder key={blade} radiusTop={0.04} radiusBottom={0.1} height={1.3 + blade * 0.25} position={[offset, 0.65, 0]} rotation={[0, 0, offset * 0.4]} color={blade % 2 ? "#2eaa7a" : "#3fc590"} segments={8} />
          ))}
        </group>
      ))}
    </group>
  );
};

const Bubbles: React.FC<{frame: number}> = ({frame}) => {
  const bubbles = useMemo(() => Array.from({length: 24}, (_, index) => ({
    x: -7 + ((index * 37) % 140) / 10,
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

const Scene: React.FC<{frame: number}> = ({frame}) => {
  const {camera} = useThree();
  const view = cameraAt(frame);
  const perspective = camera as THREE.PerspectiveCamera;
  perspective.position.set(...view.pos);
  perspective.fov = view.fov;
  perspective.up.set(Math.sin(view.roll), Math.cos(view.roll), 0);
  perspective.lookAt(...view.look);
  perspective.updateProjectionMatrix();

  const surfaceShift = 0.25 * Math.sin(frame * 0.035);
  return (
    <>
      <color attach="background" args={["#087eae"]} />
      <fog attach="fog" args={["#0a789d", 9, 29]} />
      <hemisphereLight color="#c9f5ff" groundColor="#36536a" intensity={1.25} />
      <directionalLight
        position={[8, 11, 9]}
        color="#ffe2b0"
        intensity={2.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-7, 3, -5]} color="#6a7fd9" intensity={0.8} />
      <mesh position={[0, 5 + surfaceShift, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[38, 30, 1, 1]} />
        <meshPhongMaterial color="#8cf2f0" transparent opacity={0.25} shininess={100} side={THREE.DoubleSide} />
      </mesh>
      <Seafloor frame={frame} />
      <PowerCable frame={frame} />
      <Turbine frame={frame} />
      <CurrentArrows frame={frame} />
      <FishSchool frame={frame} />
      <Bubbles frame={frame} />
    </>
  );
};

export const TidalTurbinePrototype: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: "#087eae"}}>
      <ThreeCanvas
        width={540}
        height={960}
        shadows
        camera={{fov: 43, near: 0.1, far: 50}}
        gl={{antialias: true, toneMappingExposure: 1.05, powerPreference: "high-performance"}}
      >
        <Scene frame={frame} />
      </ThreeCanvas>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 45%, transparent 48%, rgba(9,23,52,0.30) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
