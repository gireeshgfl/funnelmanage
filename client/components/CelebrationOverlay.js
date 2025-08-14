"use client";

import React, { useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import Fireworks from "../public/Firework.json";

// Dynamically import the Lottie Player with SSR disabled
const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player), {
  ssr: false, // Disable server-side rendering
});

const CelebrationOverlay = ({ 
  isOpen, 
  fireworksSrc = Fireworks,
  lottieProps = {},
  duration = 5000,
  onComplete
}) => {
  const playerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && duration) {
      timeoutRef.current = setTimeout(() => {
        if (onComplete) onComplete();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, duration, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[9999]">
      <Player
        ref={playerRef}
        autoplay
        loop={false}
        keepLastFrame={false}
        src={fireworksSrc}
        className="w-full h-full"
        speed={1.5}
        onEvent={(event) => {
          if (event === "complete" && onComplete) {
            onComplete();
          }
        }}
        {...lottieProps}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
    </div>
  );
};

export default CelebrationOverlay;