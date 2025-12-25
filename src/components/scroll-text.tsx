"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!textRef.current) return;

      const element = textRef.current;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate scroll progress (0 to 1)
      const elementTop = rect.top;
      const progress = Math.max(0, Math.min(1,
        (windowHeight - elementTop) / (windowHeight * 0.6)
      ));

      setScrollProgress(progress);
    };

    handleScroll(); // Initial call
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Convert children to string and split into characters
  const text = typeof children === 'string' ? children : '';
  const chars = text.split('');
  const totalChars = chars.length;

  return (
    <p ref={textRef} className={className}>
      {chars.map((char, index) => {
        // Calculate opacity for this character based on scroll progress
        // Each character fades in progressively
        const charProgress = (scrollProgress * totalChars - index) / 3;
        const opacity = Math.max(0.3, Math.min(1, 0.3 + charProgress));

        return (
          <span
            key={index}
            style={{
              opacity,
              transition: "opacity 0.1s ease-out",
            }}
          >
            {char}
          </span>
        );
      })}
    </p>
  );
}
