import React from 'react'
import { X } from 'lucide-react'

const Modal = ({ isOpen, title, children, onClose, footer }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 border-t flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
