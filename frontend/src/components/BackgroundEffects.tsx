import React, { useEffect, useRef } from 'react';

const BackgroundEffects = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorGlow = cursorGlowRef.current;

    if (!cursor || !cursorGlow) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Update cursor position
      cursor.style.left = e.clientX - 4 + 'px';
      cursor.style.top = e.clientY - 4 + 'px';

      // Update cursor glow position
      cursorGlow.style.left = e.clientX - 200 + 'px';
      cursorGlow.style.top = e.clientY - 200 + 'px';

      // Update CSS custom properties for interactive elements
      document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
      document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
    };

    const handleMouseEnter = () => {
      cursor.style.opacity = '1';
      cursorGlow.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = '0';
      cursorGlow.style.opacity = '0';
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Add interactive hover effects to cards
    const cards = document.querySelectorAll('.glass, .glass-deep');
    cards.forEach(card => {
      card.classList.add('interactive-hover');
    });

         // Add magnetic effect to specific cards
     const magneticCards = document.querySelectorAll('.magnetic-card');
     magneticCards.forEach(card => {
       card.addEventListener('mousemove', (e: MouseEvent) => {
         const rect = card.getBoundingClientRect();
         const x = e.clientX - rect.left;
         const y = e.clientY - rect.top;
         
         const centerX = rect.width / 2;
         const centerY = rect.height / 2;
         
         const rotateX = (y - centerY) / 10;
         const rotateY = (centerX - x) / 10;
         
         (card as HTMLElement).style.transform = 
           `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
       });
       
       card.addEventListener('mouseleave', () => {
         (card as HTMLElement).style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
       });
     });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Interactive cursor */}
      <div ref={cursorRef} className="cursor-dot" style={{ opacity: 0 }} />
      <div ref={cursorGlowRef} className="cursor-glow" style={{ opacity: 0 }} />
      
      {/* Floating orbs */}
      <div className="floating-orb" />
      <div className="floating-orb" />
      <div className="floating-orb" />
      
      {/* Grid overlay */}
      <div className="grid-overlay" />
      
      {/* Scan line */}
      <div className="scan-line" />
      
      {/* Matrix rain effect */}
      <div className="matrix-rain" />
    </>
  );
};

export default BackgroundEffects; 