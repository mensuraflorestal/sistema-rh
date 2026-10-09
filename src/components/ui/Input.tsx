import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    erro?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, erro, className = '', ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <input
                    ref={ref}
                    className={`h-10 px-3 rounded-lg border bg-white text-slate-900 transition-colors
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${erro ? 'border-red-500 focus:ring-red-400' : 'border-slate-300'}
            ${className}`}
                    {...props}
                />
                {erro && <span className="text-xs text-red-500">{erro}</span>}
            </div>
        )
    }
)

Input.displayName = 'Input';