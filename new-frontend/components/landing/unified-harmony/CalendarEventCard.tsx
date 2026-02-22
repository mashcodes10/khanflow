import { Icon } from "@iconify/react";

type EventCardProps = {
  category: string;
  title: string;
  time?: string;
  color: "amber" | "indigo" | "emerald" | "rose";
  icon?: string;
  avatars?: string[];
};

const colorMap = {
  amber: {
    border: "border-amber-600",
    text: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  indigo: {
    border: "border-indigo-500",
    text: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  emerald: {
    border: "border-emerald-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  rose: {
    border: "border-rose-500",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
  },
};

export default function CalendarEventCard({
  category,
  title,
  time,
  color,
  icon = "lucide:clock",
  avatars,
}: EventCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`w-full rounded-xl px-3 py-2.5 border-l-4 ${colors.border} flex items-center gap-3 group cursor-pointer hover:bg-white/5 transition-colors`}
      style={{
        background:
          "linear-gradient(135deg, oklch(0.29 0.012 50 / 0.9) 0%, oklch(0.29 0.012 50 / 0.7) 100%)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid oklch(0.35 0.01 50)",
        boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.15)",
        borderLeftWidth: "4px",
      }}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}
      >
        <Icon icon={icon} className={`w-4 h-4 ${colors.text}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] ${colors.text} font-bold uppercase tracking-wider`}
          >
            {category}
          </span>
          {avatars && avatars.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden">
              {avatars.map((src, i) => (
                <img
                  key={i}
                  className="inline-block h-4 w-4 rounded-full ring-1 ring-[oklch(0.29_0.012_50)]"
                  src={src}
                  alt=""
                />
              ))}
            </div>
          )}
        </div>
        <div className="text-sm font-bold text-[oklch(0.82_0.008_75)] leading-tight truncate">
          {title}
        </div>
      </div>

      {/* Time */}
      {time && (
        <div className="flex-shrink-0 text-xs text-[oklch(0.58_0.015_50)] font-medium">
          {time}
        </div>
      )}
    </div>
  );
}
