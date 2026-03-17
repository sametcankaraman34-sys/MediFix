'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

export function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onClose])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      text: 'text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-800'
    }
  }

  const Icon = icons[toast.type]
  const color = colors[toast.type]

  return (
    <div
      className={`${color.bg} ${color.border} border rounded-lg shadow-lg p-4 mb-3 d-flex align-items-start gap-3 animate-slideIn`}
      style={{
        minWidth: '300px',
        maxWidth: '400px',
        borderRadius: '12px',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <Icon className={`h-5 w-5 ${color.icon} flex-shrink-0 mt-0.5`} />
      <div className="flex-grow-1">
        <p className={`text-sm fw-medium mb-0 ${color.text}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={`btn btn-link p-0 ${color.icon} hover:opacity-70 border-0`}
        style={{ minWidth: '20px', minHeight: '20px' }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default ToastComponent
