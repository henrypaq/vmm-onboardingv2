# Callisto AI - Developer Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account (for database)

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# Navigate to http://localhost:3000
```

## 🎨 New Component System

### Theme Management

#### Using Theme Toggle
```tsx
import { ThemeToggle } from '@/components/layout/theme-toggle';

// Add theme toggle to your component
<ThemeToggle />
```

#### Accessing Theme Programmatically
```tsx
import { useTheme } from 'next-themes';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

### Layout Components

#### Sidebar Navigation
```tsx
import { Sidebar } from '@/components/layout/sidebar';

// Admin sidebar
<Sidebar userRole="admin" />

// Client sidebar
<Sidebar userRole="client" />
```

#### Mobile Sidebar
```tsx
import { MobileSidebar } from '@/components/layout/mobile-sidebar';

<MobileSidebar userRole="admin" />
```

## 🎭 Animation Patterns

### Using Framer Motion

#### Fade In Animation
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <YourComponent />
</motion.div>
```

#### Stagger Children
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={container} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### Layout Animations (Sidebar Indicator)
```tsx
<motion.div
  layoutId="unique-id"
  className="absolute inset-0 rounded-lg bg-accent"
  initial={false}
  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
/>
```

### Using CSS Animations

#### Available Classes
```tsx
// Fade in
<div className="animate-fade-in">...</div>

// Slide in from right
<div className="animate-slide-in-right">...</div>

// Scale in
<div className="animate-scale-in">...</div>

// Smooth transition
<div className="transition-smooth">...</div>
```

## 🧩 shadcn/ui Components

### Dialog (Modal)
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Modal description goes here.
      </DialogDescription>
    </DialogHeader>
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    {/* Overview content */}
  </TabsContent>
  <TabsContent value="analytics">
    {/* Analytics content */}
  </TabsContent>
</Tabs>
```

### Avatar
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="https://..." alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Sheet (Slide-out Panel)
```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Panel</Button>
  </SheetTrigger>
  <SheetContent side="right">
    {/* Panel content */}
  </SheetContent>
</Sheet>
```

## 🎨 Design Tokens

### Colors
Use Tailwind utility classes with our design system:

```tsx
// Backgrounds
<div className="bg-background">...</div>
<div className="bg-muted">...</div>
<div className="bg-card">...</div>

// Text
<div className="text-foreground">...</div>
<div className="text-muted-foreground">...</div>
<div className="text-primary">...</div>

// Borders
<div className="border-border">...</div>
```

### Typography Scale
```tsx
// Headings
<h1 className="text-3xl font-bold tracking-tight">Main Heading</h1>
<h2 className="text-2xl font-semibold">Section Heading</h2>
<h3 className="text-xl font-medium">Subsection</h3>

// Body
<p className="text-sm text-muted-foreground">Body text</p>

// Labels
<label className="text-xs font-medium uppercase tracking-wide">
  Label
</label>
```

### Spacing
```tsx
// Padding
className="p-4 md:p-6"  // Responsive padding
className="px-6 py-4"    // Horizontal/vertical

// Gap (flex/grid)
className="gap-4 md:gap-6"

// Margin
className="mb-4"  // Margin bottom
className="mt-6"  // Margin top
```

## 🖼️ Page Layout Pattern

### Standard Page Structure
```tsx
export default function MyPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
          <p className="text-muted-foreground mt-1">
            Page description
          </p>
        </div>
        <Button>Action</Button>
      </div>

      {/* Stats Bar (optional) */}
      <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Metric:</span>
          <span className="text-sm font-bold">{value}</span>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content Title</CardTitle>
          <CardDescription>Content description</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Your content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 📱 Responsive Patterns

### Responsive Grid
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {items.map(item => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

### Conditional Rendering for Mobile
```tsx
// Show on desktop, hide on mobile
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="md:hidden">Mobile only</div>

// Different layouts
<div className="flex-col md:flex-row">...</div>
```

### Responsive Text
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

## 🎯 Best Practices

### 1. Component Organization
```
components/
├── layout/     # Layout components (Sidebar, Header)
├── forms/      # Form components
├── oauth/      # OAuth-specific components
└── ui/         # shadcn/ui components
```

### 2. Naming Conventions
- Components: PascalCase (`MyComponent.tsx`)
- Utilities: camelCase (`myUtility.ts`)
- Constants: UPPER_SNAKE_CASE (`API_URL`)

### 3. Type Safety
Always define TypeScript interfaces for props:
```tsx
interface MyComponentProps {
  title: string;
  isActive?: boolean;
  onAction: () => void;
}

export function MyComponent({ title, isActive, onAction }: MyComponentProps) {
  // ...
}
```

### 4. Accessibility
- Use semantic HTML
- Include ARIA labels
- Ensure keyboard navigation
- Maintain color contrast

```tsx
<button
  aria-label="Close modal"
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</button>
```

### 5. Performance
- Use React.memo for expensive components
- Lazy load heavy components
- Optimize images with Next.js Image
- Use CSS transforms for animations (GPU-accelerated)

## 🔧 Common Patterns

### Loading State
```tsx
{isLoading ? (
  <div className="flex items-center justify-center py-12">
    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
    <span className="ml-3 text-muted-foreground">Loading...</span>
  </div>
) : (
  <YourContent />
)}
```

### Empty State
```tsx
<div className="text-center py-12">
  <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
  <p className="text-muted-foreground mb-2">No items found</p>
  <p className="text-sm text-muted-foreground">
    Description of empty state
  </p>
</div>
```

### Error State
```tsx
<div className="text-center py-12">
  <p className="text-destructive mb-4">{error}</p>
  <Button onClick={retry} variant="outline">
    Try Again
  </Button>
</div>
```

## 🐛 Debugging Tips

### Theme Issues
```tsx
// Check current theme
const { theme } = useTheme();
console.log('Current theme:', theme);

// Force theme
setTheme('dark'); // or 'light'
```

### Animation Issues
```tsx
// Disable animations for debugging
<motion.div
  initial={false} // Disable initial animation
  animate={{ opacity: 1 }}
>
  ...
</motion.div>
```

### Layout Issues
```tsx
// Add border to debug layouts
<div className="border-2 border-red-500">
  Debug this element
</div>
```

## 📚 Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives/overview/introduction)

## 🆘 Support

For issues or questions:
1. Check the UI_MODERNIZATION_SUMMARY.md file
2. Review component examples in `/src/app/admin/page.tsx`
3. Reference shadcn/ui documentation
4. Check browser console for errors

---

Happy coding! 🎉

