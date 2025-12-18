import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { PROTECTED_ROUTES } from "@/routes/common/routePaths";
import { cn } from "@/lib/utils";
import {
  CalendarRange,
  ClockIcon,
  LayoutGrid,
  LinkIcon,
  BarChart3,
  LucideIcon,
  X,
} from "lucide-react";
import { useState } from "react";

type MenuItemType = {
  title: string;
  url: string;
  icon: LucideIcon;
};

const menuItems: MenuItemType[] = [
  {
    title: "Dashboard",
    url: PROTECTED_ROUTES.DASHBOARD,
    icon: BarChart3,
  },
  {
    title: "Event types",
    url: PROTECTED_ROUTES.EVENT_TYPES,
    icon: LinkIcon,
  },
  {
    title: "Meetings",
    url: PROTECTED_ROUTES.MEETINGS,
    icon: CalendarRange,
  },
  {
    title: "Integrations & apps",
    url: PROTECTED_ROUTES.INTEGRATIONS,
    icon: LayoutGrid,
  },
  {
    title: "Availability",
    url: PROTECTED_ROUTES.AVAILBILITIY,
    icon: ClockIcon,
  },
];

export const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const currentPath = window.location.pathname;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden fixed top-16 right-4 z-50 sm:hidden">
        <div className="p-2 rounded-lg bg-white shadow-lg border border-gray-200">
          <Menu className="h-6 w-6" />
        </div>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutGrid className="size-4" />
              </div>
              Menu
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[48px]",
                  currentPath === item.url
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <p className="text-sm text-gray-500 text-center">KhanFlow v1.0</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

