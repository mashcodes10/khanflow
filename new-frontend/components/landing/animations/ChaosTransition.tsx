"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function ChaosTransition() {
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetch("/animations/chaos-transition.lottie.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Lottie loaded:", data?.v, data?.w, "x", data?.h, "frames:", data?.op);
        setAnimationData(data);
      })
      .catch((err) => console.error("Lottie load error:", err));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
    >
      {/* Subtle top fade */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

      <div
        className={`w-full max-w-6xl mx-auto transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ aspectRatio: "1920 / 1080" }}
      >
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop
            autoplay
            rendererSettings={{
              preserveAspectRatio: "xMidYMid slice",
            }}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
}
