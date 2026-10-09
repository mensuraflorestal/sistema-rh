import React, { HTMLAttributes, ReactNode } from 'react';


interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}