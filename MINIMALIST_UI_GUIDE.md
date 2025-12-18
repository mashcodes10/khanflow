# KhanFlow - Minimalistic UI Design Guide

## 🎨 Design Philosophy

Following the image reference, your UI should be:
- **Clean** - Remove visual clutter
- **Simple** - Fewer colors, more whitespace
- **Functional** - Clear hierarchy and purpose
- **Modern** - Subtle shadows, minimal borders

---

## 🎯 Key Design Principles

### 1. Color Palette
```css
/* Primary Colors */
Primary Blue: #006bff
Background: #fafafa (light gray)
White: #ffffff
Text Dark: #111827 (gray-900)
Text Light: #6b7280 (gray-500)

/* Borders & Shadows */
Border: #e5e7eb (gray-200)
Shadow: Subtle hover effects
```

### 2. Typography
- **Headings**: 28-36px, bold**
- **Body**: 16px, regular
- **Small text**: 14px, gray-500
- **No decorative fonts - use system fonts**

### 3. Spacing
- **Large gaps**: 32px (between sections)
- **Medium gaps**: 16-24px (between cards)
- **Small gaps**: 8-12px (between elements)

### 4. Components Style

#### Cards
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
  {/* Content */}
</div>
```

#### Buttons
```tsx
// Primary Button
<Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
  Action
</Button>

// Outline Button
<Button variant="outline" className="border-gray-300 hover:bg-gray-50">
  Action
</Button>
```

#### Headers
```tsx
<h1 className="text-4xl font-bold text-gray-900">Title</h1>
<p className="text-sm text-gray-500">Subtitle</p>
```

---

## 📐 Component Specifications

### Header Navigation
```tsx
<header className="bg-white border-b border-gray-200 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-gray-900" />
        <span className="text-lg font-medium text-gray-900">Calendar</span>
      </div>

      {/* Center: Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <span className="text-gray-900 font-medium">Events</span>
        <a href="#" className="text-gray-500 hover:text-gray-900">Schedule</a>
        <a href="#" className="text-gray-500 hover:text-gray-900">Connect Apps</a>
      </nav>

      {/* Right: User */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
    </div>
  </div>
</header>
```

### Event Cards (Minimalistic)
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500">{duration} min</p>
    
    <div className="flex items-center justify-end gap-2 pt-2">
      <Button variant="outline" size="sm" className="gap-2">
        <Copy className="h-4 w-4" />
        Copy Link
      </Button>
      <Button size="sm" className="gap-2">
        <Edit className="h-4 w-4" />
        Edit
      </Button>
    </div>
  </div>
</div>
```

### Event Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {events.map(event => <EventCard key={event.id} event={event} />)}
</div>
```

---

## 🎯 Updated Components

### ✅ Event Card
**File**: `frontend/src/pages/event_type/_components/event-card.tsx`

**Changes Made:**
- Removed colorful top bar
- Removed icon in card
- Simplified layout: Title, Duration, Actions
- Clean white background with minimal border
- Subtle hover shadow effect
- Buttons aligned to the right

### ✅ Page Header Structure
**File**: `frontend/src/pages/event_type/index.tsx`

**Changes Made:**
- Added "Events" heading with "New Event" button
- Simplified the header section
- Clean, minimal layout

### ✅ New Minimal Components
1. **MinimalEventCard** - Clean event card component
2. **Alternative Page Layout** - Standalone minimal Events page

---

## 🚀 Implementation Steps

### Step 1: Update Event Type Page
```bash
# Use the updated event-card.tsx
# Cards will now be minimalistic
```

### Step 2: Global Styling
Update your global CSS:
```css
/* Add to index.css or globals.css */
body {
  background-color: #fafafa;
  font-family: system-ui, -apple-system, sans-serif;
}

/* Minimize colors */
--primary: #006bff;
--muted: #fafafa;
```

### Step 3: Update Other Pages
Apply minimalistic design to:
1. **Meetings Page** - Clean meeting cards
2. **Integrations Page** - Simple integration cards
3. **Availability Page** - Minimal time selector
4. **Dashboard** - Clean stat cards

---

## 📱 Responsive Considerations

### Mobile (< 768px)
- Stack navigation items
- Full-width cards
- Larger touch targets (min 44x44px)

### Tablet (768px - 1024px)
- 2-column grid for cards
- Collapsed navigation

### Desktop (> 1024px)
- 3-column grid for cards
- Full navigation visible

---

## 🎨 Design Checklist

### Colors
- [ ] Use only white, gray, and blue
- [ ] No vibrant colors or gradients (except user avatar)
- [ ] Consistent border colors

### Spacing
- [ ] Generous whitespace
- [ ] Consistent gaps (8px, 16px, 24px, 32px)
- [ ] Clear visual hierarchy

### Typography
- [ ] Simple font family
- [ ] Clear size hierarchy
- [ ] No decorative fonts

### Components
- [ ] White background cards
- [ ] Subtle borders (#e5e7eb)
- [ ] Minimal shadows on hover
- [ ] Simple button styles

### Layout
- [ ] Clean grid layouts
- [ ] Responsive column counts
- [ ] Consistent alignment

---

## 🔧 Quick Fixes

### To Make Any Card Minimalistic

**Before:**
```tsx
<Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-card">
  <div className="h-1 w-full bg-purple-500 rounded-t-lg" />
  <CardHeader>
    <div className="p-2 bg-muted rounded-lg">
      <Icon />
    </div>
    <h3>{title}</h3>
  </CardHeader>
</Card>
```

**After:**
```tsx
<Card className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
  <CardContent className="p-6">
    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500">{subtitle}</p>
    {/* Actions */}
  </CardContent>
</Card>
```

### To Simplify Buttons

**Before:**
```tsx
<Button variant="outline" size="sm" className="hover:bg-gray-100">
  Action
</Button>
```

**After:**
```tsx
<Button variant="outline" size="sm" className="h-9 gap-2">
  <Icon className="h-4 w-4" />
  Action
</Button>
```

---

## 📝 Component Templates

### Minimal Card Template
```tsx
import { Card, CardContent } from "@/components/ui/card";

export const MinimalCard = ({ title, description, children }) => {
  return (
    <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 mb-4">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};
```

### Minimal Button Template
```tsx
import { Button } from "@/components/ui/button";
import { Icon } from "lucide-react";

export const MinimalButton = ({ icon: Icon, children, ...props }) => {
  return (
    <Button 
      size="sm" 
      className="h-9 gap-2" 
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Button>
  );
};
```

---

## 🎯 Summary

Your UI should now be:
- ✅ **Clean** - White backgrounds, minimal colors
- ✅ **Simple** - Clear hierarchy, few elements
- ✅ **Functional** - Easy to use and understand
- ✅ **Modern** - Subtle shadows, smooth transitions

Remember: **Less is more**. Remove unnecessary elements and focus on what's essential.

---

## 📚 Resources

- [Shadcn/UI](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide Icons](https://lucide.dev/) - Icon library

Happy minimalistic designing! 🎨

