import React, { createContext, useContext, useState, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const ModalContext = createContext(null)

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({ open: false })

  const close = useCallback(() => setModalState({ open: false }), [])

  const alert = useCallback(({ title = 'Aviso', message = '' } = {}) => {
    return new Promise((resolve) => {
      const onClose = () => {
        setModalState({ open: false })
        resolve()
      }

      setModalState({
        open: true,
        type: 'alert',
        title,
        message,
        onClose
      })
    })
  }, [])

  const confirm = useCallback(({ title = 'Confirmar', message = '' } = {}) => {
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
        type: 'confirm',
        title,
        message,
        handleOk,
        handleCancel
      })
    })
  }, [])

  const value = { alert, confirm, close }

  return (
    <ModalContext.Provider value={value}>
      {children}

      <Modal
        isOpen={modalState.open}
        title={modalState.title}
        onClose={() => modalState.onClose ? modalState.onClose() : setModalState({ open: false })}
        footer={
          modalState.open && modalState.type === 'confirm' ? (
            <>
              <Button variant="default" size="md" onClick={modalState.handleCancel}>Cancelar</Button>
              <Button variant="primary" size="md" onClick={modalState.handleOk}>Aceptar</Button>
            </>
          ) : modalState.open && modalState.type === 'alert' ? (
            <Button variant="primary" size="md" onClick={modalState.onClose || (() => setModalState({ open: false }))}>OK</Button>
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
