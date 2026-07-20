# UI/UX Specification Document
## Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform

This document describes the design system, component library, routing layout, and responsive rules for the frontend dashboard.

---

## 1. Design System

### 1.1 Color Palette
The interface uses a dark-mode first design to minimize eye strain in high-pressure medical environments:
*   **Base Background**: Deep Slate Black (`#0B0F19`)
*   **Surface Cards (Glassmorphism)**: Dark Navy Blue (`#161D30`) with a transparent white border (`rgba(255, 255, 255, 0.08)`) and background blur.
*   **Primary Action**: Neon Azure (`#00F0FF`)
*   **Success Indicator**: Emerald Green (`#10B981`)
*   **Warning Highlight**: Amber Gold (`#F59E0B`)
*   **Critical Alert / Tamper**: Crimson Red (`#EF4444`)
*   **Text (Primary)**: Off-White (`#F3F4F6`)
*   **Text (Secondary)**: Cool Gray (`#9CA3AF`)

### 1.2 Typography
*   **Primary Font Family**: `Outfit`, sans-serif (imported from Google Fonts).
*   **Weights**: Light (300), Regular (400), Medium (500), Semi-Bold (600), Bold (700).
*   **Type Scale**:
    *   `h1`: 2.25rem (36px) - Page Titles
    *   `h2`: 1.5rem (24px) - Section Titles
    *   `h3`: 1.25rem (20px) - Card Headings
    *   `body`: 1rem (16px) - Standard Text
    *   `caption`: 0.875rem (14px) - Form labels and detail notes

### 1.3 Spacing & Spacing Scale
The design system follows a 4px grid system:
*   `xs`: 4px | `sm`: 8px | `md`: 16px | `lg`: 24px | `xl`: 32px | `xxl`: 48px

### 1.4 Glassmorphism Rules
*   **Background Blur**: `backdrop-filter: blur(12px)`
*   **Card Fill**: `background: rgba(22, 29, 48, 0.7)`
*   **Border Styling**: `border: 1px solid rgba(255, 255, 255, 0.08)`
*   **Shadow Drop**: `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37)`

---

## 2. Component Library

### 1. Button Component
*   **Styles**: Primary (Neon Azure fill), Secondary (Outline white border), Danger (Red fill).
*   **Interactions**: Scale transform down slightly on active click (`scale-95`). Transitions take 150ms.

### 2. Status Badge
*   **States**:
    *   `Harvested`: Gray badge.
    *   `Matched`: Purple badge.
    *   `In Transit`: Blue pulse indicator badge.
    *   `Delivered`: Green check badge.
    *   `Compromised`: Red warning badge.

### 3. Organ Card
*   Shows organ type, donor UUID hash, harvest timestamp, and active cold ischemic remaining time indicator (visual ring countdown).

### 4. Blockchain Verification Card
*   Shows transaction status (validated/pending), block number, transaction hash, and timestamp, with a link to verify the record history.

### 5. Live Tracking Map
*   Displays active routes with start points, destinations, and a real-time moving transport box marker. The marker color changes dynamically (e.g. green for normal, flashing red for alerts).

### 6. Notification Panel
*   A slide-out drawer list showing system alerts, warnings, and notifications, sorted in reverse-chronological order.

---

## 3. Page Hierarchy & Routing

```
                          [ Authentication Screen ]
                                      │
                                      ▼
                            [ Shared Layout ]
                                      │
         ┌──────────────────┬─────────┴─────────┬──────────────────┐
         ▼                  ▼                   ▼                  ▼
    [ Dashboard ]    [ Waitlist ]       [ Live Tracking ]   [ Ledger Audit ]
    (Quick metrics)  (Recipients)       (OpenStreetMap)     (Verify tool)
```

1.  **`/auth/login`**: Simple centered card layout on a dark background.
2.  **`/dashboard`**: Quick overview dashboard showing active matches, current transports, and recent alerts.
3.  **`/donors` & `/recipients`**: Tables displaying patient details and waiting lists, with search filters for blood types.
4.  **`/matching`**: Panel to run the compatibility engine, showing prioritized candidates side-by-side.
5.  **`/tracking/:missionId`**: Split-screen interface:
    *   *Left*: Live map tracing coordinates.
    *   *Right*: Charts showing real-time temperature, battery status, and access verification logs.
6.  **`/audit`**: Portal to look up transaction histories and verify database hashes against the blockchain ledger.

---

## 4. UI Dashboard Behavior & States

*   **Loading States**: Card elements show skeletal loading animations (`pulse` effect) during data fetches, maintaining layout structures.
*   **Empty States**: Displays clean illustrations with helpful actions (e.g., "No active transport missions found. Register a matching organ to start transport.").
*   **Error States**: Form validation errors highlight relevant inputs in red, while page-level fetch errors display retry buttons.
*   **Live Updates & WebSocket Indicators**: The top navbar contains a status dot indicating WebSocket connection status (Green = Connected, Yellow = Reconnecting, Red = Offline).

---

## 5. Responsive Layout Rules
The layout is designed using a mobile-first approach, scaling to support different viewports:

*   **Mobile (< 768px)**: Standard single-column views. Tables convert to collapsible card lists. Sidebars fold into standard hamburger drawer menus.
*   **Tablet (768px - 1024px)**: Grid configurations expand to two-column layouts. Navigation menus collapse into icon-only sidebars.
*   **Desktop (> 1024px)**: Standard three-column layouts. The live tracking view displays maps and charts side-by-side.
*   **Large Medical Display (Hackathon Screens)**: Grid items adapt to fill screen spaces, keeping telemetry charts, coordinates, and alerts visible simultaneously in control center layouts.
