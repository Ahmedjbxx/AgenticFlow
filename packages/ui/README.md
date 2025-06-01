# @agenticflow/ui

Shared UI component library for AgenticFlow - A comprehensive collection of reusable React components with TypeScript support, Storybook documentation, and comprehensive testing.

## 🎯 Overview

This package provides a complete UI component library built specifically for the AgenticFlow ecosystem. All components are designed to work seamlessly with the AgenticFlow core system, including integration with variable management, error handling, and event systems.

## 📦 Installation

```bash
# From within the monorepo
pnpm add @agenticflow/ui

# Install peer dependencies
pnpm add react react-dom
```

## 🧩 Components

### ErrorBoundary

A robust error boundary component with comprehensive error handling, logging integration, and customizable fallback UI.

```tsx
import { ErrorBoundary, withErrorBoundary } from '@agenticflow/ui';

// Basic usage
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<div>Something went wrong!</div>}>
  <YourComponent />
</ErrorBoundary>

// As HOC wrapper
const SafeComponent = withErrorBoundary(YourComponent);
```

**Features:**
- 🔄 Automatic error recovery with "Try Again" button
- 📋 Error reporting with clipboard copy functionality
- 📊 Integration with AgenticFlow logging system
- 🎯 Custom fallback UI support
- 🛠 Development mode error details

### Button

A flexible button component with multiple variants, sizes, and states.

```tsx
import { Button } from '@agenticflow/ui';

<Button variant="primary" size="md">
  Click me
</Button>

<Button variant="danger" isLoading leftIcon="🚀">
  Loading...
</Button>

<Button variant="outline" fullWidth>
  Full Width Button
</Button>
```

**Variants:** `primary` | `secondary` | `outline` | `ghost` | `danger`  
**Sizes:** `sm` | `md` | `lg`

**Features:**
- 🎨 Multiple visual variants
- 📏 Flexible sizing options
- ⏳ Loading states with spinner
- 🎯 Icon support (left/right)
- ♿ Full accessibility support
- 🖱 Hover and focus states

### Card

A versatile card component with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@agenticflow/ui';

<Card variant="elevated" padding="lg">
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content goes here...</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Variants:** `default` | `elevated` | `outlined`  
**Padding:** `none` | `sm` | `md` | `lg`

### MentionsInput

An advanced mentions input component with hierarchical variable display, specifically designed for AgenticFlow's variable system.

```tsx
import { MentionsInput } from '@agenticflow/ui';

<MentionsInput
  value={template}
  onChange={setTemplate}
  availableVariables={variables}
  placeholder="Type { to see available variables..."
  label="Template Editor"
  helpText="Use {} syntax to reference variables"
/>
```

**Features:**
- 🌳 Hierarchical variable display with depth indicators
- 🔍 Runtime vs static variable differentiation
- 📊 Variable type icons and descriptions
- 💡 Real-time value previews
- ⏰ Freshness indicators for runtime variables
- 🎨 Color-coded variable categories

## 🎨 Styling

Components use Tailwind CSS classes and are designed to work with AgenticFlow's design system. The package includes:

- ✅ Consistent color palette integration
- ✅ Responsive design patterns
- ✅ Dark mode compatibility
- ✅ Accessibility-first design

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

Tests are written using Vitest and Testing Library, providing:
- ✅ Component rendering tests
- ✅ User interaction testing
- ✅ Accessibility testing
- ✅ Visual regression prevention

## 📚 Storybook

Interactive component documentation and development environment:

```bash
# Start Storybook development server
pnpm storybook

# Build Storybook for production
pnpm build-storybook
```

Storybook provides:
- 📖 Interactive component documentation
- 🎛 Live props manipulation
- 📱 Responsive design testing
- ♿ Accessibility testing tools

## 🔧 Development

```bash
# Build the package
pnpm build

# Development mode (watch)
pnpm dev

# Type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## 📁 Package Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx           # Button component
│   │   ├── Card.tsx             # Card components
│   │   ├── ErrorBoundary.tsx    # Error boundary
│   │   ├── MentionsInput.tsx    # Mentions input
│   │   └── *.stories.tsx        # Storybook stories
│   ├── index.ts                 # Main exports
│   └── test-setup.ts           # Test configuration
├── .storybook/                 # Storybook configuration
├── dist/                       # Build output
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── vitest.config.ts
```

## 🔗 Dependencies

### Core Dependencies
- `@agenticflow/core` - Core AgenticFlow functionality
- `@agenticflow/types` - Shared type definitions
- `react-mentions` - Mentions input functionality
- `clsx` - Conditional class names

### Peer Dependencies
- `react` ^19.1.0
- `react-dom` ^19.1.0

### Development Dependencies
- `typescript` - Type checking
- `vitest` - Testing framework
- `@testing-library/react` - Component testing
- `@storybook/react` - Component documentation
- `@types/node` - Node.js type definitions

## 🏗 Integration with AgenticFlow

This UI package is specifically designed for the AgenticFlow ecosystem:

### Variable System Integration
- MentionsInput works with `AvailableVariable` types from core
- Automatic variable extraction and display
- Real-time variable value updates

### Error Handling Integration
- ErrorBoundary integrates with ApplicationCore logging
- Event emission for monitoring systems
- Automatic error reporting workflows

### Event System Integration
- Components emit events to AgenticFlow EventBus
- Centralized state management compatibility
- Workflow execution integration

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

This package is part of the AgenticFlow monorepo. See the main repository documentation for contribution guidelines.

## 🔄 Changelog

### v0.1.0 (Current)
- ✅ Initial component library creation
- ✅ ErrorBoundary with full AgenticFlow integration
- ✅ Button component with all variants and states
- ✅ Card component family (Card, CardHeader, CardContent, CardFooter)
- ✅ MentionsInput with hierarchical variable display
- ✅ Storybook documentation and development environment
- ✅ Comprehensive testing setup with Vitest
- ✅ TypeScript compilation and declaration files
- ✅ ESM module support and workspace integration 