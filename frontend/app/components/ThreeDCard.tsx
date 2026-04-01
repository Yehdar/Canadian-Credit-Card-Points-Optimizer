"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PresentationControls, RoundedBox, Environment } from "@react-three/drei";
import type { Mesh } from "three";

const CARD_COLORS: Record<string, string> = {
  visa:       "#0051A5",
  mastercard: "#7B1C1C",
  amex:       "#2E5339",
};

interface CardMeshProps {
  color: string;
}

function CardMesh({ color }: CardMeshProps) {
  const meshRef = useRef<Mesh>(null!);

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.4;
  });

  return (
    <PresentationControls
      global
      speed={1.5}
      polar={[-Math.PI / 4, Math.PI / 4]}
      azimuth={[-Math.PI / 3, Math.PI / 3]}
    >
      <RoundedBox
        ref={meshRef}
        args={[1.586, 1.0, 0.05]}
        radius={0.06}
        smoothness={4}
      >
        <meshPhysicalMaterial
          color={color}
          metalness={0.7}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1.2}
        />
      </RoundedBox>
    </PresentationControls>
  );
}

interface ThreeDCardProps {
  cardType: "visa" | "mastercard" | "amex";
  cardName: string;
  issuer: string;
  color?: string; // overrides the cardType default
}

export default function ThreeDCard({ cardType, color }: ThreeDCardProps) {
  const resolvedColor = color ?? CARD_COLORS[cardType] ?? "#1A1A2E";

  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 3, 3]} intensity={1.8} />
        <directionalLight position={[-3, 1, 2]} intensity={0.6} color="#F0F0F0" />
        <spotLight position={[0, 4, 2]} intensity={1.5} penumbra={1} />
        <CardMesh color={resolvedColor} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
