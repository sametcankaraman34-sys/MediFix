'use client'

import { ReactNode, memo } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
  'aria-label'?: string
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
}

const Button = memo(function Button({
  loading = false,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  'aria-label': ariaLabel,
  icon: Icon,
  iconPosition = 'left',
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline-primary',
    danger: 'btn-danger',
    success: 'btn-success'
  }

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-busy={loading}
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${loading ? 'position-relative' : ''}`}
      style={{
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {loading ? (
        <span className="d-flex align-items-center justify-content-center gap-2" aria-hidden="true">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Yükleniyor...</span>
        </span>
      ) : (
        <span className="d-flex align-items-center justify-content-center gap-2">
          {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" aria-hidden="true" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="h-4 w-4" aria-hidden="true" />}
        </span>
      )}
    </button>
  )
})

export default Button
