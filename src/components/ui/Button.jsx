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
  success: 'bg-green-600 text-white hover:bg-green-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  // action: used for icon-only action buttons (no background, no border)
  action: 'bg-transparent text-gray-600 hover:bg-transparent',
}

const SIZES = {
  sm: 'px-2.5 py-1.5 text-sm h-8',
  md: 'px-4 py-2 text-sm h-10',
  lg: 'px-6 py-3 text-base h-12',
  icon: 'p-1 h-8 w-8 text-base rounded-full',
}

const Button = React.forwardRef(({
  children,
  icon = null,
  iconOnly = false,
  intent = null, // 'view' | 'edit' | 'delete' -> maps to color for icon-only actions
  className = '',
  variant = 'default',
  size = 'md',
  type = 'button',
  disabled = false,
  ...rest
}, ref) => {
  const variantClass = VARIANTS[variant] || VARIANTS.default
  const sizeClass = SIZES[size] || SIZES.md

  // if iconOnly is requested or size is icon and there are no children,
  // force the action appearance (no bg, no border) unless a different variant was explicitly set
  const isIconOnly = iconOnly || (size === 'icon' && !children)

  const finalVariant = isIconOnly && variant === 'default' ? 'action' : variant
  const finalVariantClass = VARIANTS[finalVariant] || VARIANTS.default

  // map intents to color classes for icon-only actions
  const INTENT_CLASSES = {
    view: 'text-yellow-400 hover:text-yellow-500',
    edit: 'text-blue-400 hover:text-blue-500',
    delete: 'text-red-400 hover:text-red-500',
  }

  const intentClass = (isIconOnly && intent && INTENT_CLASSES[intent]) ? INTENT_CLASSES[intent] : ''

  // don't add the default small shadow for action buttons (they should be flat/transparent)
  const extraShadow = disabled ? 'opacity-50 cursor-not-allowed' : (finalVariant === 'action' ? '' : 'shadow-sm')

  const classes = cn(
    'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none transition-colors',
    finalVariantClass,
    intentClass,
    sizeClass,
    extraShadow,
    className
  )

  // Inline style fallback to override any global element rules (e.g., plain `button { background-color: ... }`)
  // This ensures the Button colors render even if global CSS sets button background.
  const STYLE_MAP = {
    primary: { backgroundColor: '#4f46e5', color: '#ffffff' }, // indigo-600
    success: { backgroundColor: '#16a34a', color: '#ffffff' }, // green-600
    danger: { backgroundColor: '#dc2626', color: '#ffffff' },  // red-600
    default: { backgroundColor: undefined, color: undefined },
    ghost: { backgroundColor: 'transparent', color: undefined },
    action: { backgroundColor: 'transparent', color: undefined },
  }

  // For icon-only with intent, apply the intent color as text color
  const intentColorMap = {
    view: '#f59e0b', // yellow-400
    edit: '#60a5fa', // blue-400
    delete: '#f87171', // red-400
  }

  const inlineStyle = {}
  // apply background/text for non-action variants
  const mapped = STYLE_MAP[finalVariant] || STYLE_MAP.default
  if (mapped.backgroundColor) inlineStyle.backgroundColor = mapped.backgroundColor
  if (mapped.color) inlineStyle.color = mapped.color

  // if icon-only and intent provided, set text color to intent color
  if (isIconOnly && intent && intentColorMap[intent]) {
    inlineStyle.color = intentColorMap[intent]
    // ensure transparent background for icon-only
    inlineStyle.backgroundColor = 'transparent'
  }

  return (
    <button ref={ref} type={type} className={classes} style={inlineStyle} disabled={disabled} {...rest}>
      {icon ? (
        // render icon first; if it's the only content we center it
        <span className={cn('inline-flex items-center justify-center', size === 'icon' ? 'text-base' : '')}>
          {icon}
        </span>
      ) : null}

      {children ? (
        <span className={cn(icon ? 'ml-2' : '')}>
          {children}
        </span>
      ) : null}
    </button>
  )
})

export default Button
