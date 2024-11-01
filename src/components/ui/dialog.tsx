import React, { useState, useEffect, ReactNode } from 'react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    setIsVisible(isOpen)
  }, [isOpen])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex">
      <div className={`relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg ${className}`}>
        <div className="flex justify-end">
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const DialogTrigger: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export const DialogContent: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>
}

export const DialogHeader: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export const DialogTitle: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>
}