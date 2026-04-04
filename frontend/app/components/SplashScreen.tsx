"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onDismiss: () => void;
}

export default function SplashScreen({ onDismiss }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("arsenal_splash_seen")) {
      setVisible(false);
      onDismiss();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEnter() {
    sessionStorage.setItem("arsenal_splash_seen", "1");
    setVisible(false);
    // Delay onDismiss so AnimatePresence exit animation completes
    setTimeout(onDismiss, 500);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#080C0A]/80 backdrop-blur-sm"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Atmospheric background gradients */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(circle, #ffffff, transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full opacity-10 blur-[100px]"
            style={{ background: "radial-gradient(circle, #e5e7eb, transparent 70%)" }}
          />

          {/* Content */}
          <motion.div
            className="relative flex flex-col items-center gap-6 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            {/* Overline */}
            <motion.p
              className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Canadian Credit Cards
            </motion.p>

            {/* Title */}
            <motion.h1
              className="text-[72px] font-black leading-none tracking-tight text-white sm:text-[96px]"
              style={{ textShadow: "0 0 40px rgba(255, 255, 255, 0.4)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Points Optimizer
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="text-[15px] text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Don't miss out on points. Maximize your rewards.
            </motion.p>

            {/* CTA */}
            <motion.button
              onClick={handleEnter}
              className="animate-pulse-glow mt-2 rounded-full bg-white px-8 py-3 text-[14px] font-semibold text-gray-900 transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Sign In
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
