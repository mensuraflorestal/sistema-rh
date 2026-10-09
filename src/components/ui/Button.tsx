import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  carregando?: boolean;
  variante?: 'primary' | 'secondary' | 'danger';
}

export function Button({ 
  children, 
  carregando, 
  variante = 'primary', 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  const estilosVariante = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      disabled={carregando || disabled}
      className={`h-10 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
        disabled:opacity-60 disabled:cursor-not-allowed
        ${estilosVariante[variante]} ${className}`}
      {...props}
    >
      {carregando ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}