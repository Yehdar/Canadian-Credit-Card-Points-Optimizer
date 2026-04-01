"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PresentationControls, RoundedBox, Environment } from "@react-three/drei";
import type { Mesh } from "three";

const CARD_COLORS: Record<string, string> = {
  visa:       "#1A237E",
  mastercard: "#7B1C1C",
  amex:       "#2E5339",
};

const CARD_COLORS_SECONDARY: Record<string, string> = {
  visa:       "#3949AB",
  mastercard: "#C62828",
  amex:       "#388E3C",
};

interface CardMeshProps {
  cardType: string;
}

function CardMesh({ cardType }: CardMeshProps) {
  const meshRef = useRef<Mesh>(null!);
  const color = CARD_COLORS[cardType] ?? "#1A1A2E";

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
}

export default function ThreeDCard({ cardType }: ThreeDCardProps) {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }}>
        <ambientLight intensity={0.3} />
        <spotLight position={[0, 3, 3]} intensity={2.5} penumbra={0.5} />
        <pointLight position={[0, -2, 1]} intensity={0.8} color="#00FFD4" />
        <pointLight position={[-2, 1, 1]} intensity={0.4} color={CARD_COLORS_SECONDARY[cardType] ?? "#fff"} />
        <CardMesh cardType={cardType} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
