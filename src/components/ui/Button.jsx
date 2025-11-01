import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Reusable Button component
 * Props:
 * - variant: 'default' | 'primary' | 'danger' | 'ghost'
 * - size: 'sm' | 'md' | 'lg' | 'icon'
 * - iconOnly: boolean (for accessibility, still renders children)
 */
const VARIANTS = {
  default: 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50',
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
}

const SIZES = {
  sm: 'px-2.5 py-1.5 text-sm h-8',
  md: 'px-4 py-2 text-sm h-10',
  lg: 'px-6 py-3 text-base h-12',
  icon: 'p-2 h-10 w-10',
}

const Button = React.forwardRef(({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  type = 'button',
  disabled = false,
  ...rest
}, ref) => {
  const variantClass = VARIANTS[variant] || VARIANTS.default
  const sizeClass = SIZES[size] || SIZES.md

  const classes = cn(
    'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none transition-colors',
    variantClass,
    sizeClass,
    disabled ? 'opacity-50 cursor-not-allowed' : 'shadow-sm',
    className
  )

  return (
    <button ref={ref} type={type} className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  )
})

export default Button
