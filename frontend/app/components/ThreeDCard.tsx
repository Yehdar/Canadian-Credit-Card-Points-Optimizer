"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
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

// Shared rotation hook — eliminates the duplicate useFrame in CardMeshCore / CardMeshWithLogo.
function useCardRotation() {
  const meshRef = useRef<Mesh>(null!);
  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.4;
  });
  return meshRef;
}

// Logo decal is its own component so useTexture (which suspends) is isolated.
function CardMeshLogoDecal({ logoUrl }: { logoUrl: string }) {
  const texture = useTexture(logoUrl);
  return (
    <Decal
      position={[-0.35, 0.2, 0.026]}
      rotation={[0, 0, 0]}
      scale={0.35}
      map={texture}
    />
  );
}

interface CardMeshProps {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  visualConfig?: VisualConfig;
  logoUrl: string | null;
}

// Unified card mesh — renders with or without logo in a single component tree.
function CardMesh({ color, metalness, roughness, clearcoat, visualConfig, logoUrl }: CardMeshProps) {
  const meshRef = useCardRotation();

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
        {logoUrl && (
          <Suspense fallback={null}>
            <CardMeshLogoDecal logoUrl={logoUrl} />
          </Suspense>
        )}
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

function ThreeDCard({ cardType, color, visualConfig }: ThreeDCardProps) {
  const { resolvedColor, metalness, roughness, clearcoat, logoUrl } = useMemo(() => ({
    resolvedColor: visualConfig?.baseColor ?? color ?? CARD_COLORS[cardType] ?? "#1A1A2E",
    metalness:     visualConfig?.metalness ?? 0.7,
    roughness:     visualConfig?.roughness ?? 0.2,
    clearcoat:     visualConfig?.finish === "glossy" ? 1 : 0.3,
    logoUrl:       visualConfig?.brandDomain
      ? `https://logo.clearbit.com/${visualConfig.brandDomain}`
      : null,
  }), [cardType, color, visualConfig]);

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

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 40 }}
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 3, 3]} intensity={1.8} />
        <directionalLight position={[-3, 1, 2]} intensity={0.6} color="#F0F0F0" />
        <spotLight position={[0, 4, 2]} intensity={1.5} penumbra={1} />
        <CardMesh
          color={resolvedColor}
          metalness={metalness}
          roughness={roughness}
          clearcoat={clearcoat}
          visualConfig={visualConfig}
          logoUrl={logoAvailable ? logoUrl : null}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

export default React.memo(ThreeDCard);
