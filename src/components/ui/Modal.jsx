import React from 'react'

const Modal = ({ isOpen, title, children, onClose, footer, type = 'info' }) => {
  if (!isOpen) return null

  const variants = {
    info: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-9-1a1 1 0 112 0v6a1 1 0 11-2 0V9zm1-3a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.681-1.36 3.446 0l6.518 11.59A1.75 1.75 0 0116.27 18H3.73a1.75 1.75 0 01-1.95-3.311L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-6a1 1 0 00-.894.553l-.35.697a1 1 0 00.894 1.447h.8a1 1 0 00.894-1.447l-.35-.697A1 1 0 0010 7z" clipRule="evenodd" />
        </svg>
      )
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-10.464a1 1 0 10-1.414-1.414L10 8.586 7.879 6.464a1 1 0 10-1.414 1.414L8.586 10l-2.121 2.121a1 1 0 101.414 1.414L10 11.414l2.121 2.121a1 1 0 001.414-1.414L11.414 10l2.122-2.121z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  const variant = variants[type] || variants.info

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* modal container - estilo SweetAlert */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-150 ease-out scale-100">

        {/* content (estilo SweetAlert) */}
        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          {/* icono dinámico según tipo */}
          <div className={`flex items-center justify-center h-16 w-16 rounded-full ${variant.bg} ${variant.text} mb-4`}>
            {variant.svg}
          </div>

          <h3 className="text-2xl font-bold text-gray-900 text-center">{title}</h3>

          <div className="mt-3 text-base text-gray-600 text-center max-w-[26rem]">{children}</div>
        </div>

        {/* footer */}
        {footer && (
          <div className="px-6 pb-6 flex justify-center space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
