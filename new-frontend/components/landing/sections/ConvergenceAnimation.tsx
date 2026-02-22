import { Icon } from "@iconify/react";
import Image from "next/image";

type Integration = {
  type: "iconify";
  icon: string;
  position: string;
  convX: string;
  convY: string;
  delay: string;
} | {
  type: "img";
  src: string;
  alt: string;
  position: string;
  convX: string;
  convY: string;
  delay: string;
};

const integrations: Integration[] = [
  {
    type: "iconify",
    icon: "logos:slack-icon",
    position: "top-10 left-[15%]",
    convX: "-200px",
    convY: "-150px",
    delay: "0s",
  },
  {
    type: "iconify",
    icon: "logos:notion-icon",
    position: "top-10 right-[15%]",
    convX: "200px",
    convY: "-150px",
    delay: "0.1s",
  },
  {
    type: "img",
    src: "/icons/outlook.svg",
    alt: "Microsoft Outlook",
    position: "top-32 left-[5%]",
    convX: "-300px",
    convY: "0",
    delay: "0.2s",
  },
  {
    type: "iconify",
    icon: "logos:google-calendar",
    position: "top-32 right-[5%]",
    convX: "300px",
    convY: "0",
    delay: "0.3s",
  },
  {
    type: "img",
    src: "/icons/zoom.svg",
    alt: "Zoom",
    position: "top-20 left-[38%]",
    convX: "-80px",
    convY: "-180px",
    delay: "0.15s",
  },
  {
    type: "iconify",
    icon: "logos:google-meet",
    position: "top-20 right-[38%]",
    convX: "80px",
    convY: "-180px",
    delay: "0.25s",
  },
  {
    type: "iconify",
    icon: "logos:microsoft-teams",
    position: "top-44 left-[10%]",
    convX: "-280px",
    convY: "80px",
    delay: "0.35s",
  },
  {
    type: "img",
    src: "/icons/google-tasks.svg",
    alt: "Google Tasks",
    position: "top-44 right-[10%]",
    convX: "280px",
    convY: "80px",
    delay: "0.45s",
  },
  {
    type: "img",
    src: "/icons/ms-todo.svg",
    alt: "Microsoft To Do",
    position: "bottom-10 left-[20%]",
    convX: "-150px",
    convY: "200px",
    delay: "0.4s",
  },
  {
    type: "iconify",
    icon: "logos:github-icon",
    position: "bottom-10 right-[20%]",
    convX: "150px",
    convY: "200px",
    delay: "0.5s",
  },
  {
    type: "iconify",
    icon: "logos:todoist-icon",
    position: "bottom-40 left-1/2 -translate-x-1/2",
    convX: "0",
    convY: "300px",
    delay: "0.6s",
  },
];

export default function ConvergenceAnimation() {
  return (
    <div className="mt-24 relative max-w-6xl mx-auto px-6 md:px-12 h-[400px] flex items-center justify-center">
      {/* Central Phone Mockup */}
      <div className="relative w-64 h-96 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-4 z-20">
        <div className="w-full h-full rounded-2xl bg-background border border-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-muted/20 rounded-full" />
            <div className="h-4 w-4 bg-muted/20 rounded-full" />
          </div>
          <div className="space-y-2 pt-4">
            {/* Task 1 - Primary */}
            <div className="h-12 w-full bg-primary/10 border border-primary/20 rounded-xl flex items-center px-3 gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="h-3 w-3/4 bg-primary/20 rounded-full" />
            </div>
            {/* Task 2 - Accent */}
            <div className="h-12 w-full bg-card border border-border rounded-xl flex items-center px-3 gap-3">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="h-3 w-1/2 bg-muted/20 rounded-full" />
            </div>
            {/* Task 3 - Yellow */}
            <div className="h-12 w-full bg-card border border-border rounded-xl flex items-center px-3 gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="h-3 w-2/3 bg-muted/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Integration Icons */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/30 blur-[100px] rounded-full" />

        {integrations.map((item, idx) => (
          <div
            key={idx}
            className={`absolute ${item.position} animate-converge`}
            style={
              {
                "--conv-x": item.convX,
                "--conv-y": item.convY,
                animationDelay: item.delay,
              } as React.CSSProperties
            }
          >
            <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center shadow-lg">
              {item.type === "iconify" ? (
                <Icon icon={item.icon} className="text-2xl" />
              ) : (
                <Image src={item.src} alt={item.alt} width={24} height={24} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
