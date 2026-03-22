import React from 'react';

// Constante unique pour l'URL du logo avec cache-buster centralisé
// Prêt à être remplacé par un fichier .svg ou un path différent si besoin
export const SNIMOP_LOGO_PATH = '/snimop-logo.png?v=6';

interface SnimopLogoProps {
  className?: string;
  style?: React.CSSProperties;
  useGradient?: boolean;
}

export function SnimopLogo({ className = '', style = {}, useGradient = false }: SnimopLogoProps) {
  if (useGradient) {
    return (
      <div 
        className={`bg-gradient-to-r from-blue-400 to-slate-300 opacity-95 hover:opacity-100 transition-opacity ${className}`}
        style={{
          WebkitMaskImage: `url('${SNIMOP_LOGO_PATH}')`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: `url('${SNIMOP_LOGO_PATH}')`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          ...style
        }}
      />
    );
  }

  return (
    <img 
      src={SNIMOP_LOGO_PATH} 
      alt="" 
      className={`object-contain block ${className}`} 
      style={{ background: 'transparent', ...style }}
    />
  );
}
