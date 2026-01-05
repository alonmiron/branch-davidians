import { useState } from 'react';

export function MainLogo({ className = "h-12 w-auto" }) {
  const [failed, setFailed] = useState(false);
  const [useSvg, setUseSvg] = useState(true);

  if (failed) {
    // Fallback SVG placeholder for main logo
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg px-4 py-2 shadow-md">
        <span className="text-white font-bold text-2xl tracking-wider">רעננה</span>
      </div>
    );
  }

  const logoSrc = useSvg ? '/logos/main-logo.svg' : '/logos/main-logo.png';

  return (
    <img 
      src={logoSrc}
      alt="Ra'anana Municipality" 
      className={className + " object-contain"}
      onError={() => {
        if (useSvg) {
          setUseSvg(false);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

export function SecondaryLogo({ className = "h-10 w-auto" }) {
  const [failed, setFailed] = useState(false);
  const [useSvg, setUseSvg] = useState(true);

  if (failed) {
    // Fallback SVG placeholder for community emblem
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 shadow-md">
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
    );
  }

  const logoSrc = useSvg ? '/logos/secondary-logo.svg' : '/logos/secondary-logo.png';

  return (
    <img 
      src={logoSrc}
      alt="Community Tax" 
      className={className + " object-contain"}
      onError={() => {
        if (useSvg) {
          setUseSvg(false);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

