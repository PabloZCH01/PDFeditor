import React, { useEffect, useRef } from 'react';

// Ad 1 - Left Sidebar
export const AdLeft = () => {
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = "https://pl29470759.effectivecpmnetwork.com/16/66/3f/16663f049bcfa1107f37770ddb3d190b.js";
      containerRef.current.appendChild(script);
    }
  }, []);
  return <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>;
};

// Ad 2 - Top Banner
export const AdTop = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = "https://pl29470760.effectivecpmnetwork.com/9fad61adab9b93babeb29463d5db436b/invoke.js";
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div id="container-9fad61adab9b93babeb29463d5db436b"></div>
    </div>
  );
};

// Ad 3 - Right Sidebar
export const AdRight = () => {
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = "https://pl29470761.effectivecpmnetwork.com/86/98/53/86985357f68d8ac2dc3a189a7e131c70.js";
      containerRef.current.appendChild(script);
    }
  }, []);
  return <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>;
};

// Ad 4 - Bottom Banner (Direct Link)
export const AdBottomLink = () => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
      <a 
        href="https://www.effectivecpmnetwork.com/gfm832yj?key=56be8d3eb13ff0132419a488a53dcca1" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          background: 'var(--accent-gradient)',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(56, 189, 248, 0.4)';
        }}
      >
        Continuar y Apoyar al Creador ✨
      </a>
    </div>
  );
};
