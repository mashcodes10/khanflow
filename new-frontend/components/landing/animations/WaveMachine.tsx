"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

const TASK_COMMANDS = [
  "meeting w Alex",
  "gym at 6pm",
  "catch up w Sarah",
  "dinner w team",
  "project pitch",
  "standup at 9am",
  "lunch w Dev",
  "review PRs",
  "call w client",
  "prep slides",
];

type AppIcon =
  | { type: "iconify"; icon: string }
  | { type: "img"; src: string; alt: string };

const APP_ICONS: AppIcon[] = [
  { type: "iconify", icon: "logos:google-calendar" },
  { type: "img", src: "/icons/outlook.svg", alt: "Microsoft Outlook" },
  { type: "img", src: "/icons/zoom.svg", alt: "Zoom" },
  { type: "iconify", icon: "logos:google-meet" },
  { type: "iconify", icon: "logos:microsoft-teams" },
  { type: "img", src: "/icons/google-tasks.svg", alt: "Google Tasks" },
  { type: "img", src: "/icons/ms-todo.svg", alt: "Microsoft To Do" },
  { type: "iconify", icon: "logos:notion-icon" },
  { type: "iconify", icon: "logos:slack-icon" },
  { type: "iconify", icon: "logos:todoist-icon" },
  { type: "iconify", icon: "logos:github-icon" },
];

const ICON_SPACING = 72;
const PATH_SAMPLE_STEP = 2;

function buildRepeatingText(items: string[], count: number): string {
  const sep = "  \u2022  ";
  let text = "";
  for (let i = 0; i < count; i++) {
    for (const item of items) {
      text += item + sep;
    }
  }
  return text;
}

export type WaveVariant = "spiral" | "sine" | "straight" | "orbital" | "cascade";

const PATH_CONFIGS: Record<WaveVariant, { input: string; output: string }> = {
  spiral: {
    input: `
      M -400,-80
      C -200,-50 0,-30 40,40
      C 80,110 50,200 70,260
      C 90,320 140,360 200,350
      C 260,340 290,280 320,240
      C 350,200 380,185 410,210
      C 440,235 460,250 490,255
      L 465,250
    `,
    output: `
      M 535,250
      C 560,250 590,260 620,280
      C 670,310 710,340 760,330
      C 810,320 840,270 880,230
      C 920,190 960,150 1010,130
      C 1060,110 1120,80 1200,55
      C 1280,30 1400,0 1500,-20
    `,
  },
  sine: {
    input: `
      M -400,250
      C -300,250 -200,150 -100,150
      C 0,150 50,350 150,350
      C 250,350 300,150 400,200
      C 430,220 460,245 490,250
      L 465,250
    `,
    output: `
      M 535,250
      C 560,255 590,280 650,200
      C 710,120 750,120 810,200
      C 870,280 910,340 970,260
      C 1030,180 1070,140 1130,180
      C 1190,220 1250,160 1350,100
      C 1450,40 1500,20 1600,0
    `,
  },
  straight: {
    input: `
      M -500,240
      C -300,240 -100,245 100,248
      C 200,249 350,250 465,250
      L 465,250
    `,
    output: `
      M 535,250
      C 600,250 700,248 850,245
      C 1000,242 1200,238 1400,235
      L 1600,230
    `,
  },
  orbital: {
    input: `
      M -300,50
      C -100,50 50,50 150,100
      C 250,150 350,250 400,280
      C 430,295 460,270 490,255
      L 465,250
    `,
    output: `
      M 535,250
      C 560,245 590,220 620,200
      C 680,160 760,100 870,80
      C 980,60 1100,100 1200,160
      C 1300,220 1400,320 1500,400
      L 1600,450
    `,
  },
  cascade: {
    input: `
      M -200,-100
      C -100,-50 0,20 50,100
      C 100,180 150,250 250,300
      C 350,350 400,320 440,280
      C 460,265 470,255 490,250
      L 465,250
    `,
    output: `
      M 535,250
      C 560,245 580,230 620,200
      C 680,150 750,80 850,30
      C 950,-20 1050,-60 1200,-80
      C 1350,-100 1500,-80 1600,-60
    `,
  },
};

export default function WaveMachine({
  className,
  variant = "spiral",
}: {
  className?: string;
  variant?: WaveVariant;
}) {
  const [offset, setOffset] = useState(0);
  const animRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const outputPathRef = useRef<SVGPathElement>(null);
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      setOffset((ts - startRef.current) * 0.03);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Pre-compute points along the output path for icon placement
  useEffect(() => {
    const path = outputPathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    setPathLength(len);
    const pts: { x: number; y: number }[] = [];
    for (let d = 0; d <= len; d += PATH_SAMPLE_STEP) {
      const p = path.getPointAtLength(d);
      pts.push({ x: p.x, y: p.y });
    }
    const last = path.getPointAtLength(len);
    pts.push({ x: last.x, y: last.y });
    setPathPoints(pts);
  }, [variant]);

  const inputText = buildRepeatingText(TASK_COMMANDS, 12);

  const getPointOnPath = useCallback(
    (dist: number) => {
      if (pathPoints.length === 0) return null;
      const idx = Math.min(
        Math.round(dist / PATH_SAMPLE_STEP),
        pathPoints.length - 1
      );
      return pathPoints[Math.max(0, idx)];
    },
    [pathPoints]
  );

  // Compute icon positions flowing along the output path
  const iconElements = (() => {
    if (pathLength === 0 || pathPoints.length === 0) return null;

    const speed = 1.5;
    const cycleLen = APP_ICONS.length * ICON_SPACING;
    const windowStart = (offset * speed) % cycleLen;
    const numSlots = Math.ceil(pathLength / ICON_SPACING) + 2;
    const firstIdx = Math.floor(windowStart / ICON_SPACING);
    const elements: React.ReactElement[] = [];
    const iconSize = 40;

    for (let i = firstIdx; i < firstIdx + numSlots; i++) {
      const virtualPos = i * ICON_SPACING;
      const dist = virtualPos - windowStart;
      if (dist < 0 || dist >= pathLength) continue;

      const iconIdx =
        ((i % APP_ICONS.length) + APP_ICONS.length) % APP_ICONS.length;
      const pt = getPointOnPath(dist);
      if (!pt) continue;

      // Fade in/out near edges
      const edgeFade = Math.min(dist / 40, (pathLength - dist) / 40, 1);

      elements.push(
        <foreignObject
          key={`icon-${i}`}
          x={pt.x - iconSize / 2}
          y={pt.y - iconSize / 2}
          width={iconSize}
          height={iconSize}
          opacity={0.85 * Math.max(0, edgeFade)}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {APP_ICONS[iconIdx].type === "iconify" ? (
              <Icon
                icon={APP_ICONS[iconIdx].icon}
                style={{ width: iconSize - 4, height: iconSize - 4 }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={APP_ICONS[iconIdx].src}
                alt={APP_ICONS[iconIdx].alt}
                style={{ width: iconSize - 4, height: iconSize - 4 }}
              />
            )}
          </div>
        </foreignObject>
      );
    }

    return elements;
  })();

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height: 500 }}
    >
      <svg
        viewBox="0 0 1000 500"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <path
            id="inputPath"
            d={PATH_CONFIGS[variant].input}
            fill="none"
          />

          <path
            id="outputPath"
            ref={outputPathRef}
            d={PATH_CONFIGS[variant].output}
            fill="none"
          />
        </defs>

        {/* Input side: flowing text along spiral */}
        <use
          href="#inputPath"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.06"
        />

        <text
          fontSize="26"
          fill="currentColor"
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fontWeight="600"
          letterSpacing="0.03em"
          opacity="0.7"
        >
          <textPath href="#inputPath" startOffset={-offset % 4000}>
            {inputText}
          </textPath>
        </text>

        {/* Output side: flowing app icons along curve */}
        <use
          href="#outputPath"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.06"
        />

        {iconElements}
      </svg>

      {/* Center: wave dots machine */}
      <div
        className="absolute z-20 left-1/2 top-1/2"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="flex items-center justify-center gap-3 bg-background border-2 border-foreground/10 rounded-full px-7 py-4 shadow-lg">
          <WaveDot color="#E53E3E" delay={0} maxH={40} />
          <WaveDot color="#E53E3E" delay={0.08} maxH={30} />
          <WaveDot color="#F6C844" delay={0.16} maxH={44} />
          <WaveDot color="#F6C844" delay={0.24} maxH={34} />
          <WaveDot color="#68D391" delay={0.32} maxH={42} />
          <WaveDot color="#68D391" delay={0.4} maxH={32} />
          <WaveDot color="#CBD5E0" delay={0.48} maxH={24} isPill />
        </div>
      </div>
    </div>
  );
}

function WaveDot({
  color,
  delay,
  maxH,
  isPill = false,
}: {
  color: string;
  delay: number;
  maxH: number;
  isPill?: boolean;
}) {
  return (
    <div
      className="rounded-full"
      style={{
        width: isPill ? 16 : 7,
        height: 7,
        backgroundColor: color,
        animation: `waveBar 0.6s ease-in-out ${delay}s infinite`,
        // @ts-expect-error css custom property
        "--max-h": `${maxH}px`,
      }}
    />
  );
}
