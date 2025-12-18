# KhanFlow - Responsive Implementation Examples

## Component-by-Component Implementation Guide

This document provides ready-to-use code examples for making each component fully responsive.

---

## 1. Enhanced Mobile Menu Component

### File: `frontend/src/components/MobileMenu.tsx`

```tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { PROTECTED_ROUTES } from "@/routes/common/routePaths";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: PROTECTED_ROUTES.DASHBOARD, icon: "📊" },
  { title: "Event types", url: PROTECTED_ROUTES.EVENT_TYPES, icon: "🔗" },
  { title: "Meetings", url: PROTECTED_ROUTES.MEETINGS, icon: "📅" },
  { title: "Integrations & apps", url: PROTECTED_ROUTES.INTEGRATIONS, icon: "🔌" },
  { title: "Availability", url: PROTECTED_ROUTES.AVAILBILITIY, icon: "⏰" },
];

export const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden fixed top-4 right-4 z-50">
        <div className="p-2 rounded-lg bg-white shadow-lg">
          <Menu className="h-6 w-6" />
        </div>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Menu</h2>
            <button onClick={() => setOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                  location.pathname === item.url
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t">
            <p className="text-sm text-gray-500 text-center">
              KhanFlow v1.0
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

---

## 2. Responsive Header Component

### File: `frontend/src/components/Header.tsx` (Update)

```tsx
import { MobileMenu } from "./MobileMenu";
import { Button } from "./ui/button";
import { Bell, Search } from "lucide-react";
import { Input } from "./ui/input";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-3 md:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <MobileMenu />
          </div>

          {/* Center: Search (Hidden on mobile, visible on tablet+) */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-full h-10"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Icon (Mobile only) */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* Avatar */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                K
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

## 3. Responsive App Sidebar

### File: `frontend/src/components/AppSidebar.tsx` (Update)

```tsx
import {
  CalendarRange,
  ClockIcon,
  Command,
  LayoutGrid,
  LinkIcon,
  LucideIcon,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { PROTECTED_ROUTES } from "@/routes/common/routePaths";
import { cn } from "@/lib/utils";

type ItemType = {
  title: string;
  url: string;
  icon: LucideIcon;
  separator?: boolean;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { state } = useSidebar();
  const pathname = location.pathname;

  const items: ItemType[] = [
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
      separator: true,
    },
    {
      title: "Availability",
      url: PROTECTED_ROUTES.AVAILBILITIY,
      icon: ClockIcon,
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className={cn(
        state !== "collapsed" && "w-[260px]",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        "hidden lg:flex" // Hide on mobile
      )}
      {...props}
    >
      <SidebarHeader
        className={cn(
          "py-3 relative",
          state !== "collapsed" ? "px-4" : "px-2"
        )}
      >
        <div className="flex h-[50px] items-center gap-1 justify-start">
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Command className="size-4" />
          </div>
          {state !== "collapsed" && (
            <div className="grid flex-1 text-left text-2xl leading-tight ml-px">
              <h2 className="truncate font-medium">KhanFlow</h2>
            </div>
          )}
          <SidebarTrigger
            className={`-ml-1 cursor-pointer ${
              state === "collapsed" &&
              "absolute -right-5 z-20 rounded-full bg-white border transform rotate-180"
            }`}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="!p-[4px_8px] dark:bg-background">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="hover:!bg-[#e5efff] data-[active=true]:!bg-[#e5efff]"
                isActive={item.url === pathname}
                asChild
              >
                <Link
                  to={item.url}
                  className="!text-[16px] !p-[12px_8px_12px_16px] min-h-[48px] rounded-[8px] !font-semibold"
                >
                  <item.icon className="!w-5 !h-5 !stroke-2" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
```

---

## 4. Responsive App Layout

### File: `frontend/src/layout/app-layout.tsx` (Update)

```tsx
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { MobileMenu } from "@/components/MobileMenu";

const AppLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden p-0 !bg-[#fafafa]">
        {/* Mobile Menu (floating) */}
        <MobileMenu />
        
        <div className="w-full flex flex-1 flex-col gap-1 px-3 md:px-6 lg:px-8 max-w-[1300px] mx-auto">
          <Header />
          <div className="pb-4 md:pb-6 lg:pb-8">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
```

---

## 5. Responsive Card Component

### File: `frontend/src/components/ResponsiveCard.tsx` (New)

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";

interface ResponsiveCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ResponsiveCard({ title, description, children, actions }: ResponsiveCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3 md:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm mt-1">{description}</CardDescription>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2">{actions}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
```

---

## 6. Responsive Event Card

### File: `frontend/src/pages/event_type/_components/event-card.tsx` (Update)

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Link as LinkIcon } from "lucide-react";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    duration: number;
    type: string;
    slug: string;
    // ... other fields
  };
  username: string;
}

export default function EventCard({ event, username }: EventCardProps) {
  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-sm md:text-base text-gray-600 mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {/* Info Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs md:text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {event.duration} min
            </Badge>
            <Badge variant="outline" className="text-xs md:text-sm">
              {event.type}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto flex-1"
              onClick={() => {
                // Copy link
                const url = `${window.location.origin}/${username}/${event.slug}`;
                navigator.clipboard.writeText(url);
              }}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 7. Responsive Event List Section

### File: `frontend/src/pages/event_type/_components/event-list-section.tsx` (Update)

```tsx
import EventCard from "./event-card";

interface EventListSectionProps {
  events: any[];
  username: string;
}

export default function EventListSection({ events, username }: EventListSectionProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} username={username} />
        ))}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-12 px-4">
          <p className="text-gray-500">No events yet</p>
        </div>
      )}
    </div>
  );
}
```

---

## 8. Responsive Main Dashboard

### Update: `frontend/src/components/MainDashboard.tsx`

Key changes needed:

```tsx
// 1. Make sidebar responsive (hide on mobile)
<div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">

// 2. Responsive grid for cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

// 3. Responsive tabs
<TabsList className="w-full flex-wrap h-auto">
  <TabsTrigger className="flex-1 sm:flex-none text-xs sm:text-sm">Overview</TabsTrigger>
  <TabsTrigger className="flex-1 sm:flex-none text-xs sm:text-sm">Calendar</TabsTrigger>
  {/* More tabs */}
</TabsList>

// 4. Responsive padding
<div className="p-4 md:p-6 lg:p-8">

// 5. Mobile-first button sizing
<Button className="w-full sm:w-auto">
  Action
</Button>
```

---

## 9. Responsive Integration Card

### File: `frontend/src/pages/integrations/_components/integration-card.tsx` (Update)

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface IntegrationCardProps {
  appType: string;
  title: string;
  isConnected: boolean;
  isDisabled?: boolean;
}

export default function IntegrationCard({ 
  appType, 
  title, 
  isConnected, 
  isDisabled 
}: IntegrationCardProps) {
  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
            {isConnected && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm">
            {isConnected ? "Configure your integration" : "Connect to get started"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant={isConnected ? "outline" : "default"}
            className="w-full sm:w-auto flex-1"
            disabled={isDisabled}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
          {isConnected && (
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
            >
              Settings
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 10. Responsive Auth Forms

### File: `frontend/src/pages/auth/components/sign-in-form.tsx` (Update)

```tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function SignInForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold">
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              className="h-11 md:h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
            <Input
              id="password"
              type="password"
              className="h-11 md:h-12"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 md:h-12 text-base"
          >
            Sign In
          </Button>

          <div className="text-center">
            <a href="/signup" className="text-sm text-blue-600 hover:underline">
              Don't have an account? Sign up
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 11. Responsive Page Container

### File: `frontend/src/components/PageTitle.tsx` (Update)

```tsx
export default function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1 md:space-y-2">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm md:text-base text-gray-600 max-w-3xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
```

---

## 📊 Responsive Typography Utilities

Add to your global CSS or component utilities:

```css
/* Responsive Typography */
.responsive-heading {
  font-size: 1.5rem;  /* Mobile */
}

@media (min-width: 768px) {
  .responsive-heading {
    font-size: 2rem;  /* Tablet */
  }
}

@media (min-width: 1024px) {
  .responsive-heading {
    font-size: 2.5rem;  /* Desktop */
  }
}

/* Or use Tailwind classes */
className="text-2xl md:text-3xl lg:text-4xl"
```

---

## 🎯 Quick Implementation Steps

1. **Install Mobile Menu Component**
   - Copy the MobileMenu.tsx code
   - Add to your components folder

2. **Update App Layout**
   - Update app-layout.tsx to include MobileMenu
   - Update Header to show mobile menu toggle

3. **Update Sidebar**
   - Add `hidden lg:flex` to hide on mobile

4. **Update Each Page Component**
   - Replace fixed widths with responsive classes
   - Use grid with responsive columns
   - Make buttons full-width on mobile

5. **Test on Real Devices**
   - Use Chrome DevTools
   - Test on actual mobile devices
   - Check touch targets are at least 44px

---

This guide provides ready-to-use code for making KhanFlow fully responsive. Start with the Mobile Menu, then work through each component systematically.

