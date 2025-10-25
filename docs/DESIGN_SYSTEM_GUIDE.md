# LabTech GeoLab - Design System Guide

## Overview

This document provides a comprehensive guide to the LabTech GeoLab design system, featuring a modern, vibrant, and educational aesthetic optimized for both students and lecturers.

---

## 🎨 Color Palette

### Primary Brand Colors

Our color scheme is inspired by scientific precision and educational excellence.

#### Primary Blue (#5B8DEE)
- **Usage**: Main brand color, primary actions, navigation
- **Psychology**: Trust, knowledge, scientific authority
- **Accessibility**: WCAG AA compliant with white text

```scss
--ion-color-primary: #5B8DEE;
--ion-color-primary-shade: #4f7cd1;
--ion-color-primary-tint: #6b98f0;
```

#### Secondary Teal (#00D4AA)
- **Usage**: Accent color, secondary actions, highlights
- **Psychology**: Innovation, growth, fresh thinking
- **Accessibility**: WCAG AA compliant

```scss
--ion-color-secondary: #00D4AA;
--ion-color-secondary-shade: #00bb96;
--ion-color-secondary-tint: #1ad8b3;
```

#### Tertiary Purple (#A78BFA)
- **Usage**: Creative elements, special highlights
- **Psychology**: Creativity, imagination, premium feel

```scss
--ion-color-tertiary: #A78BFA;
--ion-color-tertiary-shade: #927adc;
--ion-color-tertiary-tint: #b097fb;
```

### Functional Colors

#### Success Green (#22C55E)
- **Usage**: Completed states, positive feedback
- **Context**: Test completion, correct answers

#### Warning Orange (#F59E0B)
- **Usage**: Cautionary messages, validation
- **Context**: Missing data, attention needed

#### Danger Red (#EF4444)
- **Usage**: Errors, critical alerts
- **Context**: Failed validation, errors

#### Info Blue (#3B82F6)
- **Usage**: Informational content, tips
- **Context**: Learning resources, helpful hints

### Neutral Palette

Light theme optimized for educational environments:

```scss
--ion-background-color: #FAFBFC;  // Soft white
--ion-text-color: #1E293B;        // Dark slate
--lab-color-surface: #FFFFFF;     // Pure white
--lab-color-outline: #E2E8F0;     // Light gray
```

---

## 📝 Typography

### Font Families

```scss
--lab-font-family: 'Poppins', 'Inter', sans-serif;
--lab-font-family-display: 'Poppins', sans-serif;  // Headings
--lab-font-family-mono: 'Fira Code', monospace;    // Code
```

### Type Scale

| Size | Rem | Pixels | Usage |
|------|-----|--------|-------|
| xs   | 0.75rem | 12px | Fine print, badges |
| sm   | 0.875rem | 14px | Secondary text, captions |
| base | 1rem | 16px | Body text, inputs |
| lg   | 1.125rem | 18px | Emphasized text |
| xl   | 1.25rem | 20px | Card titles |
| 2xl  | 1.5rem | 24px | Section headings |
| 3xl  | 1.875rem | 30px | Page titles |
| 4xl  | 2.25rem | 36px | Hero headings |
| 5xl  | 3rem | 48px | Landing page titles |

### Line Heights

```scss
--lab-line-height-tight: 1.25;    // Headings
--lab-line-height-normal: 1.5;    // Body text
--lab-line-height-relaxed: 1.75;  // Reading content
```

### Font Weights

- **300**: Light - Subtle emphasis
- **400**: Regular - Body text
- **500**: Medium - UI elements
- **600**: Semi-bold - Headings, labels
- **700**: Bold - Strong emphasis, titles
- **800**: Extra-bold - Hero text

---

## 📏 Spacing System

8px grid system for consistent spacing:

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| xs    | 0.25rem | 4px | Tight spacing |
| sm    | 0.5rem | 8px | Small gaps |
| base  | 1rem | 16px | Standard spacing |
| lg    | 1.5rem | 24px | Section gaps |
| xl    | 2rem | 32px | Large spacing |
| 2xl   | 3rem | 48px | Major sections |
| 3xl   | 4rem | 64px | Hero spacing |
| 4xl   | 6rem | 96px | Page sections |

---

## 🎭 Shadows & Depth

### Shadow Scale

```scss
--lab-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);      // Subtle
--lab-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);      // Light
--lab-shadow-soft: 0 4px 16px rgba(0, 0, 0, 0.08);   // Standard
--lab-shadow-medium: 0 8px 32px rgba(0, 0, 0, 0.12); // Elevated
--lab-shadow-strong: 0 16px 48px rgba(0, 0, 0, 0.16);// High
--lab-shadow-xl: 0 20px 64px rgba(0, 0, 0, 0.20);    // Dramatic
```

### Colored Shadows

For emphasis and branding:

```scss
--lab-shadow-primary: 0 8px 24px rgba(91, 141, 238, 0.25);
--lab-shadow-secondary: 0 8px 24px rgba(0, 212, 170, 0.25);
--lab-shadow-success: 0 8px 24px rgba(34, 197, 94, 0.25);
```

---

## 🔲 Border Radius

Modern, soft corners throughout:

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| xs    | 0.25rem | 4px | Small elements |
| sm    | 0.375rem | 6px | Badges |
| base  | 0.5rem | 8px | Buttons |
| lg    | 0.75rem | 12px | Inputs, small cards |
| xl    | 1rem | 16px | Cards |
| 2xl   | 1.25rem | 20px | Large cards |
| 3xl   | 1.5rem | 24px | Hero cards |
| full  | 9999px | — | Pills, circles |

---

## ✨ Animation & Motion

### Timing Functions

```scss
--lab-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--lab-transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--lab-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
--lab-transition-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Keyframe Animations

#### Fade In
```scss
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}
```

#### Fade In Up
```scss
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}
```

#### Scale In
```scss
.animate-scale-in {
  animation: scaleIn 0.4s ease-out;
}
```

#### Float
```scss
.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### Motion Principles

1. **Purposeful**: Every animation serves a function
2. **Responsive**: Faster on mobile (0.4s vs 0.6s)
3. **Accessible**: Respects `prefers-reduced-motion`
4. **Subtle**: Gentle easing, not jarring
5. **Contextual**: Entrance animations for new content

---

## 🎴 Component Patterns

### Modern Card

```scss
.card-modern {
  background: var(--lab-color-surface);
  border-radius: var(--lab-radius-2xl);
  box-shadow: var(--lab-shadow-soft);
  border: 1px solid var(--lab-color-outline);
  transition: all var(--lab-transition-base);
  
  &:hover {
    box-shadow: var(--lab-shadow-medium);
    transform: translateY(-2px);
    border-color: var(--ion-color-primary);
  }
}
```

### Glass Card (Glassmorphism)

```scss
.card-glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--lab-radius-2xl);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Gradient Border Card

```scss
.card-gradient-border {
  position: relative;
  background: var(--lab-color-surface);
  border-radius: var(--lab-radius-2xl);
  /* Gradient border via mask */
}
```

### Button Styles

- **Primary**: Solid gradient background
- **Secondary**: Outline with hover fill
- **Tertiary**: Text only with hover background
- **Touch targets**: Minimum 44x44px on mobile

---

## 📱 Responsive Design

### Breakpoints

```scss
xs:  320px   // Small phones
sm:  480px   // Standard phones
md:  768px   // Tablets portrait
lg:  1024px  // Tablets landscape / Small desktop
xl:  1366px  // Standard desktop
2xl: 1536px  // Large desktop
3xl: 1920px  // Full HD
4xl: 2560px  // 4K
```

### Mobile-First Approach

1. Design for mobile first (320px+)
2. Scale up for larger screens
3. Test on real devices
4. Touch targets 44x44px minimum
5. Readable text (16px base on mobile)

### Responsive Utilities

```scss
// Show/hide by device
.mobile-only    // Visible only on mobile
.tablet-up-show // Visible on tablet+
.desktop-show   // Visible on desktop+

// Orientation
.portrait-show
.landscape-show
```

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

#### Focus Indicators

```scss
.focus-ring {
  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(91, 141, 238, 0.3);
    border-color: var(--ion-color-primary);
  }
}
```

#### Touch Targets

```scss
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

#### Screen Reader Support

- Semantic HTML5 elements
- ARIA labels on icons
- ARIA live regions for dynamic content
- Skip links for navigation

#### Reduced Motion

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🧩 Component Library

### Progress Stepper

Multi-step workflow indicator with:
- Visual step progression
- Active state animation
- Completed checkmarks
- Mobile responsive
- Accessibility support

**Usage:**
```typescript
<app-progress-stepper
  [steps]="steps"
  [vertical]="false"
  [touchFriendly]="true">
</app-progress-stepper>
```

### Lab Card

Feature-rich card component:
- Hover animations
- Gradient overlays
- Shine effect
- Progress tracking
- Icon backgrounds

**Usage:**
```typescript
<app-lab-card
  [iconName]="'flask'"
  [label]="'Lab Name'"
  [subtitle]="'Description'"
  [progress]="75"
  (cardClick)="onCardClick()">
</app-lab-card>
```

### Theme Toggle

Dark/light mode switcher:
- Smooth transitions
- Local storage persistence
- System preference detection
- Animated icon changes

**Usage:**
```typescript
<app-theme-toggle></app-theme-toggle>
```

---

## 🎯 Best Practices

### Do's ✅

1. **Use design tokens**: Always use CSS variables
2. **Follow spacing system**: 8px grid for consistency
3. **Provide feedback**: Visual response to user actions
4. **Test on devices**: Physical mobile device testing
5. **Optimize images**: WebP format, proper sizing
6. **Add loading states**: Skeleton screens, spinners
7. **Include empty states**: Helpful illustrations
8. **Write semantic HTML**: Proper elements for SEO
9. **Label inputs**: Explicit labels for forms
10. **Check contrast**: Use contrast checker tools

### Don'ts ❌

1. **Avoid hard-coded values**: Use CSS variables
2. **Don't skip states**: Hover, active, disabled
3. **Never ignore mobile**: Mobile-first approach
4. **Don't use small text**: 16px minimum on mobile
5. **Avoid tiny targets**: 44px minimum tap targets
6. **Don't block with animations**: Optional, not mandatory
7. **Never auto-play**: Respect user preferences
8. **Don't forget alt text**: All images need descriptions
9. **Avoid color alone**: Use icons, text for meaning
10. **Don't ignore errors**: Validate and provide feedback

---

## 🚀 Performance Guidelines

### Optimization Targets

- **Lighthouse Score**: 90+ on mobile and desktop
- **Load Time**: Under 3 seconds on 3G
- **Animation**: 60fps consistently
- **Bundle Size**: Code splitting, tree shaking

### Techniques

1. **Lazy Loading**: Route-based code splitting
2. **Image Optimization**: WebP, srcset, lazy loading
3. **CSS Optimization**: Minimize, purge unused
4. **JavaScript**: Tree shaking, minification
5. **Change Detection**: OnPush strategy where possible
6. **Virtual Scrolling**: For long lists
7. **Memoization**: Cache expensive calculations

---

## 📊 Data Visualization

### Chart Library

Using `@swimlane/ngx-charts` for data visualization:

**Features:**
- Responsive charts
- Accessibility support
- Touch-friendly
- Customizable colors
- Animation options

**Chart Types:**
- Line charts: Proctor compaction curves
- Bar charts: Sieve analysis distribution
- Pie charts: Soil classification
- Area charts: Cumulative distributions

---

## 🎨 Gradients

### Primary Gradient
```scss
background: linear-gradient(135deg, 
  var(--ion-color-primary) 0%, 
  var(--ion-color-secondary) 100%
);
```

### Success Gradient
```scss
background: linear-gradient(135deg, 
  #11998e 0%, 
  #38ef7d 100%
);
```

### Animated Gradient
```scss
background: linear-gradient(270deg, 
  #667eea, #764ba2, #f093fb
);
background-size: 600% 600%;
animation: gradientShift 10s ease infinite;
```

---

## 📖 Usage Examples

### Hero Section

```html
<div class="hero-section">
  <div class="hero-icon animate-float">
    <ion-icon name="flask"></ion-icon>
  </div>
  <h1 class="gradient-text">LabTech GeoLab</h1>
  <p class="hero-subtitle">Geotechnical Engineering Excellence</p>
</div>
```

### Modern Card Grid

```html
<div class="grid-responsive">
  <app-lab-card 
    *ngFor="let lab of labs"
    [iconName]="lab.icon"
    [label]="lab.name"
    [subtitle]="lab.description">
  </app-lab-card>
</div>
```

### Form with Validation

```html
<ion-input
  class="focus-ring"
  [class.ion-invalid]="field.invalid && field.touched"
  [class.ion-valid]="field.valid"
  type="number"
  placeholder="Enter value">
</ion-input>
```

---

## 🔧 Customization

### Extending Colors

Add new colors in `variables.scss`:

```scss
:root {
  --lab-color-custom: #YOUR_COLOR;
  --lab-color-custom-rgb: R, G, B;
}
```

### Custom Animations

Define in `utilities.scss`:

```scss
@keyframes yourAnimation {
  0% { /* start state */ }
  100% { /* end state */ }
}

.animate-your-animation {
  animation: yourAnimation 0.5s ease-in-out;
}
```

### Tailwind Extensions

Extend in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'custom': '#YOUR_COLOR',
    }
  }
}
```

---

## 📦 Component Export

All components are standalone and can be imported individually:

```typescript
import { ProgressStepperComponent } from '@/components/progress-stepper.component';
import { LabCardComponent } from '@/components/lab-card.component';
import { ThemeToggleComponent } from '@/components/theme-toggle.component';
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Mobile phones (320px - 480px)
- [ ] Tablets (768px - 1024px)
- [ ] Desktop (1366px+)
- [ ] 4K displays (2560px+)

### Functional Testing
- [ ] Touch interactions work
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast ratios
- [ ] Form validation
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

### Performance Testing
- [ ] Lighthouse score 90+
- [ ] Load time < 3s
- [ ] Smooth 60fps animations
- [ ] No layout shifts

### Browser Testing
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest 2 versions)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 📚 Resources

### Design Inspiration
- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/)
- [Ionic Design System](https://ionicframework.com/docs/theming/basics)

### Tools
- [Coolors](https://coolors.co/) - Color palette generator
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Can I Use](https://caniuse.com/) - Browser compatibility
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing

### Fonts
- [Google Fonts - Poppins](https://fonts.google.com/specimen/Poppins)
- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)

---

## 📞 Support

For questions or feedback on the design system:
- Create an issue on the project repository
- Review the Ionic documentation
- Check Angular Material guidelines
- Consult WCAG accessibility standards

---

## 📅 Version History

**v1.0.0** - Initial Design System
- Vibrant color palette
- Comprehensive component library
- Responsive utilities
- Accessibility features
- Animation system
- Documentation

---

**Last Updated**: 2025
**Maintained by**: LabTech GeoLab Team
