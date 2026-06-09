---
description: Use GSAP 3.15.0 (local copy) for animations in this React/Vite project. Covers import paths, available plugins, and usage patterns.
---

# GSAP Animation Skill

## Source

Local copy at `/home/technopark/Desktop/GSAP-master` — GSAP 3.15.0 with all premium plugins.

## Setup in this project

GSAP is **not yet installed** as a node_module. To use it, either:

**Option A — symlink/copy (no npm):**
```bash
cp -r /home/technopark/Desktop/GSAP-master /home/technopark/Desktop/deadend-final/deadend/src/lib/gsap
```
Then import from `../lib/gsap/esm/index.js` (ESM) or `../lib/gsap/dist/gsap.js`.

**Option B — install from local path:**
```bash
npm install /home/technopark/Desktop/GSAP-master
```
Then import normally: `import gsap from 'gsap'`

## Available plugins (src/)

| Plugin | Use case |
|--------|----------|
| `ScrollTrigger.js` | Scroll-based animations |
| `ScrollSmoother.js` | Smooth scroll |
| `SplitText.js` | Text character/word/line animations |
| `Flip.js` | Layout transition animations (FLIP technique) |
| `MorphSVGPlugin.js` | SVG shape morphing |
| `DrawSVGPlugin.js` | SVG path drawing |
| `MotionPathPlugin.js` | Animate along SVG path |
| `CustomEase.js` | Custom easing curves |
| `Draggable.js` | Drag & drop with inertia |
| `ScrambleTextPlugin.js` | Scramble text effect |
| `TextPlugin.js` | Type-writer text animation |
| `Observer.js` | Unified pointer/touch/wheel events |
| `ScrollToPlugin.js` | Smooth scroll-to |

## Basic usage pattern in React

```jsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function MyComponent() {
  const el = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(el.current, { opacity: 0, y: 40, duration: 0.6 });
    }, el);
    return () => ctx.revert(); // cleanup on unmount
  }, []);

  return <div ref={el}>Hello</div>;
}
```

## Key rules

- Always use `gsap.context()` + `ctx.revert()` in React for proper cleanup
- Register plugins once at module level: `gsap.registerPlugin(ScrollTrigger)`
- Use `gsap.timeline()` for sequenced animations
- Prefer `useRef` targets over string selectors in React

## Common animations

```js
// Fade in stagger
gsap.from('.card', { opacity: 0, y: 30, stagger: 0.1, duration: 0.5, ease: 'power2.out' });

// ScrollTrigger entrance
gsap.from(el, {
  scrollTrigger: { trigger: el, start: 'top 80%' },
  opacity: 0, y: 50, duration: 0.7
});

// Timeline
const tl = gsap.timeline();
tl.from('.hero-title', { opacity: 0, y: -20, duration: 0.6 })
  .from('.hero-sub', { opacity: 0, duration: 0.4 }, '-=0.2');
```
