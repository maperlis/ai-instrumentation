# metrIQ AI Design System Guidelines

This document outlines the design system patterns used throughout the application. Follow these guidelines to maintain visual consistency.

## Color System

### NEVER use direct colors
```tsx
// ❌ WRONG
<div className="bg-white text-black border-gray-200" />
<div className="bg-[#4F46E5]" />

// ✅ CORRECT  
<div className="bg-background text-foreground border-border" />
<div className="bg-primary" />
```

### Semantic Color Tokens
| Token | Usage |
|-------|-------|
| `background` | Page/section backgrounds |
| `foreground` | Primary text |
| `card` | Card backgrounds |
| `card-foreground` | Text on cards |
| `primary` | Brand color, CTAs, links |
| `secondary` | Secondary actions, accents |
| `muted` | Subtle backgrounds |
| `muted-foreground` | Secondary text |
| `accent` | Success states, highlights |
| `destructive` | Errors, deletions |
| `success` | Success states |
| `warning` | Warning states |
| `border` | Borders, dividers |

### Dark Sections (Landing Page)
For dark sections on the landing page:
```tsx
<div className="bg-surface-dark text-dark-primary">
  <p className="text-dark-secondary">Secondary text</p>
  <p className="text-dark-muted">Muted text</p>
</div>
```

## Design System Components

### Import from design-system
```tsx
import { 
  PageContainer, 
  SectionContainer, 
  FeatureCard, 
  GlassCard, 
  IconContainer,
  AppHeader 
} from "@/components/design-system";
```

### PageContainer
Wraps entire pages with consistent background:
```tsx
<PageContainer variant="default">  {/* white bg */}
<PageContainer variant="dark">     {/* dark bg */}
<PageContainer variant="gradient">  {/* gradient bg */}
```

### SectionContainer
Centers content with max-width:
```tsx
<SectionContainer size="sm">  {/* max-w-2xl */}
<SectionContainer size="md">  {/* max-w-4xl */}
<SectionContainer size="lg">  {/* max-w-6xl */}
<SectionContainer size="xl">  {/* max-w-7xl */}
```

### FeatureCard
Main card component with variants:
```tsx
<FeatureCard variant="default">      {/* white bg, border */}
<FeatureCard variant="dark">         {/* dark bg */}
<FeatureCard variant="elevated">     {/* white bg, shadow */}

<FeatureCard hoverEffect="ring">     {/* ring on hover */}
<FeatureCard hoverEffect="lift">     {/* lift on hover */}
<FeatureCard hoverEffect="glow">     {/* glow on hover */}
<FeatureCard hoverEffect="none">     {/* no hover effect */}
```

### IconContainer
Styled icon wrapper:
```tsx
<IconContainer variant="primary" size="md">
  <Icon className="w-6 h-6" />
</IconContainer>

// Variants: primary, secondary, accent, success, warning, destructive, muted
// Sizes: sm (h-8), md (h-12), lg (h-16)
```

### GlassCard
Frosted glass effect:
```tsx
<GlassCard variant="light">Content</GlassCard>
<GlassCard variant="dark">Content</GlassCard>
```

## CSS Utility Classes

### Gradients
```tsx
className="gradient-primary"  // Primary to secondary gradient
className="gradient-hero"     // Page background gradient
className="gradient-card"     // Subtle card gradient
className="gradient-cta"      // CTA background gradient
```

### Shadows
```tsx
className="shadow-glow"       // Glowing shadow (primary color)
className="shadow-dark-card"  // Heavy shadow for dark cards
```

### Animations
```tsx
className="animate-float"     // Floating animation
className="transition-smooth" // Smooth all transitions
```

### App-Specific Classes
```tsx
className="app-card"           // Standard app card
className="app-card-elevated"  // Elevated app card
className="app-card-dark"      // Dark app card

className="app-badge-primary"     // Primary badge
className="app-badge-secondary"   // Secondary badge
className="app-badge-success"     // Success badge
className="app-badge-warning"     // Warning badge
className="app-badge-destructive" // Destructive badge
```

## Typography

### Headings
```tsx
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
<h2 className="text-3xl md:text-4xl font-bold tracking-tight">
<h3 className="text-2xl font-semibold tracking-tight">
```

### Body Text
```tsx
<p className="text-muted-foreground">Secondary text</p>
<p className="text-foreground">Primary text</p>
<span className="text-sm text-muted-foreground">Small muted text</span>
```

### Badges/Labels
```tsx
<span className="text-xs font-semibold uppercase tracking-wider">Label</span>
```

## Component Patterns

### Hero Sections
```tsx
<SectionContainer size="lg" className="pt-16 pb-12 text-center">
  {/* Badge */}
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
    <Icon className="w-4 h-4 text-primary" />
    <span className="text-sm font-semibold text-primary">Label</span>
  </div>
  
  {/* Headline */}
  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
    <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
      Gradient Text
    </span>
  </h1>
  
  {/* Subheadline */}
  <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
    Description text here
  </p>
</SectionContainer>
```

### Feature Grids
```tsx
<div className="grid md:grid-cols-3 gap-6">
  <FeatureCard variant="elevated" hoverEffect="lift">
    <IconContainer variant="primary" size="md" className="mb-4">
      <Icon className="w-6 h-6" />
    </IconContainer>
    <h3 className="font-semibold text-foreground mb-2">Title</h3>
    <p className="text-sm text-muted-foreground">Description</p>
  </FeatureCard>
</div>
```

### Form Cards
```tsx
<FeatureCard variant="elevated" hoverEffect="none" className="shadow-xl">
  <form className="space-y-4">
    <div className="space-y-2">
      <Label>Field Label</Label>
      <Input placeholder="Placeholder" />
    </div>
    <Button className="w-full">Submit</Button>
  </form>
</FeatureCard>
```

## System Instructions (Add to Project Knowledge)

Add this to your project's knowledge base for AI assistants:

```
# Design System Guidelines for metrIQ AI

## CRITICAL: Always use semantic tokens
- NEVER use direct colors (bg-white, text-black, border-gray-200)
- ALWAYS use design system tokens (bg-background, text-foreground, border-border)
- All colors MUST be HSL format in index.css

## Component Usage
1. Import from @/components/design-system for layout components
2. Use FeatureCard for cards, not raw divs with custom classes
3. Use IconContainer for icon wrappers
4. Use PageContainer for page wrappers
5. Use SectionContainer for content sections

## Styling Patterns
- Cards: Use FeatureCard with appropriate variant (default/dark/elevated)
- Buttons: Use shadcn Button component, no custom button styles
- Inputs: Use shadcn Input component
- Icons: Wrap in IconContainer with semantic color variant
- Badges: Use app-badge-* classes or shadcn Badge

## Landing vs App Styling
- Landing: Can use dark sections (bg-surface-dark, text-dark-*)
- App: Use standard light theme (bg-background, text-foreground)
- Both: Use consistent card patterns and typography

## Animation Guidelines
- Use animate-float for floating background elements
- Use transition-smooth for hover transitions
- Use hoverEffect prop on FeatureCard for hover animations
```
