import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const PixelButton: React.FC<PixelButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  // Removed rounded-lg, added rounded-none.
  const baseStyle = "px-6 py-2 text-lg font-bold uppercase transition-all active:translate-y-1 border-b-4 border-r-4 border-t-2 border-l-2 relative overflow-hidden rounded-none font-vt323 tracking-widest";
  
  let colors = "";
  switch(variant) {
    case 'primary':
      colors = "bg-blue-600 border-t-blue-400 border-l-blue-400 border-b-blue-800 border-r-blue-800 text-white hover:bg-blue-500";
      break;
    case 'secondary':
      colors = "bg-gray-200 border-t-white border-l-white border-b-gray-600 border-r-gray-600 text-gray-800 hover:bg-white";
      break;
    case 'danger':
      colors = "bg-red-500 border-t-red-400 border-l-red-400 border-b-red-800 border-r-red-800 text-white hover:bg-red-400";
      break;
    case 'success':
      colors = "bg-green-600 border-t-green-400 border-l-green-400 border-b-green-900 border-r-green-900 text-white hover:bg-green-500";
      break;
  }

  return (
    <button className={`${baseStyle} ${colors} ${className}`} {...props}>
      <span className="relative z-10 drop-shadow-md">{children}</span>
    </button>
  );
};