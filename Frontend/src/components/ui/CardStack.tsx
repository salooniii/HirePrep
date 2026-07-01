"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import ReactDOM from "react-dom/client";

gsap.registerPlugin(Flip);

interface CardStackProps {
  cards: React.ReactNode[];
}

export default function CardStack({ cards }: CardStackProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  const offsets = [
    { left: 0, top: 0 },
    { left: 16, top: -16 },
    { left: 32, top: -32 },
    { left: 48, top: -48 },
    { left: 64, top: -64 },
  ];

  const applyOffsets = (items: HTMLElement[]) => {
    items.forEach((item, i) => {
      const idx = items.length - 1 - i;
      const offset = offsets[Math.min(idx, offsets.length - 1)];
      gsap.set(item, {
        left: offset.left,
        top: offset.top,
        zIndex: i,
      });
    });
  };

  // Mount cards imperatively on first render
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    // Clear existing
    slider.innerHTML = "";
    
    // We store the roots created in this specific effect execution
    const localRoots: ReactDOM.Root[] = [];

    // Build cards from bottom to top (last card = bottom)
    const reversed = [...cards].reverse();
    reversed.forEach((card, i) => {
      const div = document.createElement("div");
      div.className = "stack-item";
      Object.assign(div.style, {
        position: "absolute",
        width: "340px",
        height: "460px",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      });
      slider.appendChild(div);
      const root = ReactDOM.createRoot(div);
      root.render(card as React.ReactElement);
      localRoots.push(root);
    });

    // Apply initial offsets
    const items = Array.from(
      slider.querySelectorAll<HTMLElement>(".stack-item")
    );
    applyOffsets(items);

    return () => {
      setTimeout(() => {
        localRoots.forEach((root) => root.unmount());
      }, 0);
    };
  }, []);

  const moveCard = () => {
    if (isAnimating.current || !sliderRef.current) return;
    isAnimating.current = true;

    const slider = sliderRef.current;
    const items = slider.querySelectorAll<HTMLElement>(".stack-item");
    const state = Flip.getState(items);

    // Move last child to first
    const lastItem = slider.querySelector<HTMLElement>(".stack-item:last-child");
    if (lastItem) {
      slider.insertBefore(lastItem, slider.firstChild);
    }

    const newItems = slider.querySelectorAll<HTMLElement>(".stack-item");
    applyOffsets(Array.from(newItems));

    Flip.from(state, {
      targets: newItems,
      ease: "sine.inOut",
      duration: 0.6,
      absolute: true,
      nested: true,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { yPercent: 20, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.4, ease: "expo.out" }
        ),
      onLeave: (elements) =>
        gsap.fromTo(
          elements,
          { yPercent: 0, xPercent: 0, opacity: 1 },
          {
            yPercent: 5,
            xPercent: -5,
            opacity: 0,
            duration: 0.4,
            ease: "expo.out",
            transformOrigin: "bottom left",
          }
        ),
      onComplete: () => {
        isAnimating.current = false;
      },
    });
  };

  useEffect(() => {
    const interval = setInterval(moveCard, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={sliderRef}
      onClick={moveCard}
      style={{
        position: "relative",
        width: "340px",
        height: "460px",
        cursor: "pointer",
        margin: "0 auto",
      }}
    />
  );
}