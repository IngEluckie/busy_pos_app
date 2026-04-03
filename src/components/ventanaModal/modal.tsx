import React, { ReactNode, useEffect } from 'react'
import './modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  width?: string
  maxWidth?: string
  height?: string
  closeOnBackdrop?: boolean
  showCloseButton?: boolean
  className?: string
  bodyClassName?: string
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  width = 'min(92vw, 640px)',
  maxWidth = '92vw',
  height,
  closeOnBackdrop = true,
  showCloseButton = true,
  className = '',
  bodyClassName = ''
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose()
    }
  }

  const handleDialogClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  return (
    <div
      className='modal-base__overlay'
      onClick={handleBackdropClick}
      role='presentation'
    >
      <div
        aria-modal='true'
        className={`modal-base ${className}`.trim()}
        onClick={handleDialogClick}
        role='dialog'
        style={{ width, maxWidth, height }}
      >
        {(title || showCloseButton) && (
          <header className='modal-base__header'>
            <div className='modal-base__header-copy'>
              {title && <h2 className='modal-base__title'>{title}</h2>}
            </div>

            {showCloseButton && (
              <button
                aria-label='Cerrar ventana modal'
                className='modal-base__close-button'
                onClick={onClose}
                type='button'
              >
                ×
              </button>
            )}
          </header>
        )}

        <div className={`modal-base__body ${bodyClassName}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  )
}

export type { ModalProps }
