"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PresentationControls, RoundedBox, Environment, Decal, Text, useTexture } from "@react-three/drei";
import type { Mesh } from "three";
import type { VisualConfig } from "@/hooks/useChat";

const CARD_COLORS: Record<string, string> = {
  visa:       "#0051A5",
  mastercard: "#7B1C1C",
  amex:       "#2E5339",
};

function getChipColor(baseColor: string) {
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.5 ? "#D4AF37" : "#C0C0C0";
}

function CardFaceDetails({ visualConfig }: { visualConfig?: VisualConfig }) {
  if (!visualConfig) return null;

  const chipColor = getChipColor(visualConfig.baseColor);
  const companyName = visualConfig.companyName || "Card";
  const cardNumber = visualConfig.cardNumber || "0000 0000 0000 0000";
  const networkText = visualConfig.network ? visualConfig.network.toUpperCase() : "";

  return (
    <>
      <mesh position={[-0.35, 0.1, 0.026]}>
        <boxGeometry args={[0.25, 0.18, 0.01]} />
        <meshPhysicalMaterial color={chipColor} metalness={0.9} roughness={0.2} />
      </mesh>
      <Text
        position={[-0.65, 0.38, 0.026]}
        rotation={[0, 0, 0]}
        fontSize={0.09}
        color="#FFFFFF"
        anchorX="left"
        anchorY="top"
        maxWidth={1.2}
      >
        {companyName}
      </Text>
      <Text
        position={[-0.65, -0.35, 0.026]}
        rotation={[0, 0, 0]}
        fontSize={0.06}
        color="#FFFFFF"
        anchorX="left"
        anchorY="bottom"
        maxWidth={1.4}
      >
        {cardNumber}
      </Text>
      {networkText ? (
        <Text
          position={[0.6, -0.35, 0.026]}
          rotation={[0, 0, 0]}
          fontSize={0.08}
          color="#FFFFFF"
          anchorX="right"
          anchorY="bottom"
          maxWidth={0.6}
        >
          {networkText}
        </Text>
      ) : null}
    </>
  );
}

interface CardMeshCoreProps {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  visualConfig?: VisualConfig;
}

function CardMeshCore({ color, metalness, roughness, clearcoat, visualConfig }: CardMeshCoreProps) {
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
          metalness={metalness}
          roughness={roughness}
          clearcoat={clearcoat}
          clearcoatRoughness={0.1}
          envMapIntensity={1.2}
        />
        <CardFaceDetails visualConfig={visualConfig} />
      </RoundedBox>
    </PresentationControls>
  );
}

// Renders the card mesh with a Logo.dev logo decal on the face.
// Must be wrapped in <Suspense> because useTexture suspends.
function CardMeshWithLogo({ color, metalness, roughness, clearcoat, logoUrl, visualConfig }: CardMeshCoreProps & { logoUrl: string; visualConfig?: VisualConfig }) {
  const meshRef = useRef<Mesh>(null!);
  const texture = useTexture(logoUrl);

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
          metalness={metalness}
          roughness={roughness}
          clearcoat={clearcoat}
          clearcoatRoughness={0.1}
          envMapIntensity={1.2}
        />
        <Decal
          position={[-0.35, 0.2, 0.026]}
          rotation={[0, 0, 0]}
          scale={0.35}
          map={texture}
        />
        <CardFaceDetails visualConfig={visualConfig} />
      </RoundedBox>
    </PresentationControls>
  );
}

interface ThreeDCardProps {
  cardType: "visa" | "mastercard" | "amex";
  cardName: string;
  issuer: string;
  color?: string;
  visualConfig?: VisualConfig;
}

export default function ThreeDCard({ cardType, color, visualConfig }: ThreeDCardProps) {
  const resolvedColor = visualConfig?.baseColor ?? color ?? CARD_COLORS[cardType] ?? "#1A1A2E";
  const metalness     = visualConfig?.metalness ?? 0.7;
  const roughness     = visualConfig?.roughness ?? 0.2;
  const clearcoat     = visualConfig?.finish === "glossy" ? 1 : 0.3;

  // Clearbit's logo API is free with no token required.
  const logoUrl = visualConfig?.brandDomain
    ? `https://logo.clearbit.com/${visualConfig.brandDomain}`
    : null;

  const [logoAvailable, setLogoAvailable] = useState(false);

  useEffect(() => {
    if (!logoUrl) {
      setLogoAvailable(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLogoAvailable(true);
    img.onerror = () => setLogoAvailable(false);
    img.src = logoUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [logoUrl]);

  const showLogo = !!logoUrl && logoAvailable;

  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 3, 3]} intensity={1.8} />
        <directionalLight position={[-3, 1, 2]} intensity={0.6} color="#F0F0F0" />
        <spotLight position={[0, 4, 2]} intensity={1.5} penumbra={1} />
        {showLogo ? (
          <Suspense fallback={
            <CardMeshCore color={resolvedColor} metalness={metalness} roughness={roughness} clearcoat={clearcoat} visualConfig={visualConfig} />
          }>
            <CardMeshWithLogo
              color={resolvedColor}
              metalness={metalness}
              roughness={roughness}
              clearcoat={clearcoat}
              logoUrl={logoUrl!}
              visualConfig={visualConfig}
            />
          </Suspense>
        ) : (
          <CardMeshCore color={resolvedColor} metalness={metalness} roughness={roughness} clearcoat={clearcoat} visualConfig={visualConfig} />
        )}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
