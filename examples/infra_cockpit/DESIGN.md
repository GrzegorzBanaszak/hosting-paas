---
name: Infra Cockpit
colors:
  surface: '#fff8f5'
  surface-dim: '#e9d7cb'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e9'
  surface-container: '#fdeade'
  surface-container-high: '#f7e5d9'
  surface-container-highest: '#f2dfd3'
  on-surface: '#231a13'
  on-surface-variant: '#554336'
  inverse-surface: '#392e26'
  inverse-on-surface: '#ffede3'
  outline: '#887364'
  outline-variant: '#dbc2b0'
  surface-tint: '#904d00'
  primary: '#8d4b00'
  on-primary: '#ffffff'
  primary-container: '#b15f00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb77d'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#006096'
  on-tertiary: '#ffffff'
  tertiary-container: '#007abd'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#cee5ff'
  tertiary-fixed-dim: '#96ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004a75'
  background: '#fff8f5'
  on-background: '#231a13'
  surface-variant: '#f2dfd3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-xs:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  mono-label:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-margin: 32px
  gutter: 16px
---

## Brand & Style
This design system is built for the high-stakes environment of cloud infrastructure management. The aesthetic, "Infra Cockpit," prioritizes precision, reliability, and functional elegance. It avoids the whimsical trends of consumer SaaS in favor of a utilitarian, high-density interface that feels like a physical piece of laboratory equipment or a high-end aviation dashboard.

The style is **Modern-Minimalist with a Tactile twist**. It relies on a modular, grid-based architecture where every element has a clear purpose and position. The interface conveys authority through structured information density, balanced by a warm, sophisticated palette that reduces visual fatigue during long periods of technical monitoring.

## Colors
The palette is grounded in a warm, paper-like neutral background to differentiate the platform from the typical cold-white or dark-blue tech templates.

- **Surface:** The primary canvas uses a warm light neutral (#F9F7F2), providing a non-glare surface for data-heavy views.
- **Ink:** Content uses a deep dark charcoal (#1A1A1A) to ensure maximum contrast and legibility.
- **Action:** Amber/burnt orange (#D97706) is used sparingly for primary actions, critical states, and highlighting key telemetry data.
- **Structure:** Cool gray and slate tones (#475569, #E2E8F0) define borders, dividers, and secondary metadata, providing a "technical" counterpoint to the warm background.
- **Status:** Functional colors (Green/Red) are desaturated and leaning toward "earthy" tones to align with the professional, muted aesthetic.

## Typography
The typography strategy focuses on a rigorous hierarchy. **Inter** provides a neutral, highly legible foundation for the majority of the UI. For technical labels, ID strings, and status indicators, **Space Grotesk** is introduced to provide a subtle "engineered" feel without sacrificing readability.

- **Headlines:** Tight tracking and semi-bold weights create a sense of structural integrity.
- **Data Densities:** Use `body-sm` as the primary size for table data and configuration lists to maintain high information density.
- **Technical Metadata:** Use the `mono-label` style for any system-generated strings, port numbers, or IP addresses to distinguish them from human-readable text.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid Grid**. The sidebar and navigation elements are fixed-width to maintain cockpit-like consistency, while the main content area utilizes a fluid 12-column grid with a max-width of 1600px.

- **Rhythmic Spacing:** A strict 4px baseline grid ensures vertical alignment across disparate components.
- **Density:** Padding within cards and tables should be tight (`12px` or `16px`) to allow more data on screen, while margins between major modular blocks should be generous (`24px` to `48px`) to prevent visual clutter.
- **Sectioning:** Content is grouped into logical "Modules" or "Pods" that occupy defined spans of the grid.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Low-Contrast Outlines** rather than dramatic shadows. 

- **Level 0 (Background):** The base neutral #F9F7F2.
- **Level 1 (Cards):** Pure white (#FFFFFF) backgrounds with a 1px border in #E2E8F0. A very soft, diffused shadow (0px 2px 4px rgba(0,0,0,0.02)) is applied to give the cards a "resting" presence on the surface.
- **Level 2 (Active/Hover):** When a card or element is focused, the border shifts to the secondary slate color and the shadow slightly sharpens.
- **Overlays:** Modals and dropdowns use a crisp 1px border and a slightly more pronounced shadow (0px 10px 20px rgba(0,0,0,0.05)) to separate them from the cockpit surface.

## Shapes
Shapes are disciplined and "Soft-Square." We use a conservative radius to maintain the professional, technical feel of an instrument panel.

- **Standard Elements:** Buttons, inputs, and small cards use a `4px` (0.25rem) radius.
- **Large Containers:** Main dashboard cards use an `8px` (0.5rem) radius.
- **Interactive States:** Avoid circular "pill" shapes unless used for status pips or notifications; buttons should remain rectangular with soft corners to reinforce the grid-based modularity.

## Components
- **Buttons:** Primary buttons use a solid #D97706 background with white text. Secondary buttons use a white background with a #E2E8F0 border and #1A1A1A text. 
- **Input Fields:** Use a subtle inset shadow and #F9F7F2 background to denote "input" vs "display." Labels are always placed above the field in `mono-label` style.
- **Cards:** The core building block. Cards must have a header section with a bottom border separating the title/actions from the content.
- **Status Chips:** Small, rectangular indicators with a background tint matching the status color (e.g., 10% opacity) and high-contrast text.
- **Data Grids:** Use "Zebra" striping with #FBF9F6 on alternate rows. Vertical borders are omitted to emphasize the horizontal scan line.
- **Telemetry Sparklines:** Small, high-density line charts embedded within cards or table rows, utilizing the primary amber color for the data line.