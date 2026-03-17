'use client'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
}

export default function Loading({ 
  size = 'md', 
  text, 
  fullScreen = false,
  className = ''
}: LoadingProps) {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  }

  const spinnerSize = {
    sm: { width: '1rem', height: '1rem' },
    md: { width: '2rem', height: '2rem' },
    lg: { width: '3rem', height: '3rem' }
  }

  const content = (
    <div className={`d-flex flex-column align-items-center justify-content-center gap-2 ${className}`}>
      <div 
        className={`spinner-border text-primary ${sizeClasses[size]}`}
        style={spinnerSize[size]}
        role="status"
      >
        <span className="visually-hidden">Yükleniyor...</span>
      </div>
      {text && (
        <p className="text-sm text-gray-600 mb-0">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 9999 }}>
        {content}
      </div>
    )
  }

  return content
}
