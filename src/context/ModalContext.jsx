import React, { createContext, useContext, useState, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const ModalContext = createContext(null)

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({ open: false })

  const close = useCallback(() => setModalState({ open: false }), [])

  const alert = useCallback(({ title = 'Aviso', message = '', iconType = 'info' } = {}) => {
    return new Promise((resolve) => {
      const onClose = () => {
        setModalState({ open: false })
        resolve()
      }

      setModalState({
        open: true,
        kind: 'alert',
        title,
        message,
        onClose,
        iconType
      })
    })
  }, [])

  const confirm = useCallback(({ title = 'Confirmar', message = '', okVariant = 'primary', cancelVariant = 'default', iconType = 'warning' } = {}) => {
    return new Promise((resolve) => {
      const handleOk = () => {
        setModalState({ open: false })
        resolve(true)
      }
      const handleCancel = () => {
        setModalState({ open: false })
        resolve(false)
      }

      setModalState({
        open: true,
        kind: 'confirm',
        title,
        message,
        handleOk,
        handleCancel,
        okVariant,
        cancelVariant,
        iconType
      })
    })
  }, [])

  // dialog: show a modal with multiple custom options and return the selected key
  const dialog = useCallback(({ title = '', message = '', options = [], iconType = 'warning' } = {}) => {
    return new Promise((resolve) => {
      setModalState({
        open: true,
        kind: 'dialog',
        title,
        message,
        options,
        resolve,
        iconType
      })
    })
  }, [])

  const value = { alert, confirm, dialog, close }

  return (
    <ModalContext.Provider value={value}>
      {children}

      <Modal
        isOpen={modalState.open}
        title={modalState.title}
        type={modalState.iconType}
        onClose={() => modalState.onClose ? modalState.onClose() : setModalState({ open: false })}
        footer={
          modalState.open && modalState.kind === 'confirm' ? (
            <>
              <Button variant={modalState.cancelVariant || 'default'} size="md" onClick={modalState.handleCancel}>Cancelar</Button>
              <Button variant={modalState.okVariant || 'primary'} size="md" onClick={modalState.handleOk}>Aceptar</Button>
            </>
          ) : modalState.open && modalState.kind === 'alert' ? (
            <Button variant="primary" size="md" onClick={modalState.onClose || (() => setModalState({ open: false }))}>OK</Button>
          ) : modalState.open && modalState.kind === 'dialog' ? (
            <div className="flex items-center justify-center space-x-3">
              {modalState.options && modalState.options.map(opt => (
                <Button key={opt.key} variant={opt.variant || 'default'} size="md" onClick={() => { setModalState({ open: false }); modalState.resolve && modalState.resolve(opt.key); }}>
                  {opt.label}
                </Button>
              ))}
            </div>
          ) : null
        }
      >
        <div className="text-sm text-gray-700">{modalState.message}</div>
      </Modal>
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

export default ModalContext
