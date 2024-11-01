'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  children: React.ReactNode;
}

interface SelectContextType<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType<any> | undefined>(undefined)

export function Select<T extends string>({ value, onValueChange, children }: SelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref}>
      <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
        {children}
      </SelectContext.Provider>
    </div>
  )
}

export function SelectTrigger({ id, children }: { id: string; children: React.ReactNode }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within a Select')

  return (
    <div className="relative">
      <button
        id={id}
        onClick={() => context.setIsOpen(!context.isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
      >
        {children}
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>
      {context.isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === SelectContent) {
              return child
            }
          })}
        </div>
      )}
    </div>
  )
}

export function SelectValue({ placeholder }: { placeholder: string }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within a Select')
  return <span>{context.value || placeholder}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-1">
      {children}
    </div>
  )
}

export function SelectItem<T extends string>({ value, children }: { value: T; children: React.ReactNode }) {
  const context = React.useContext(SelectContext) as SelectContextType<T> | undefined
  if (!context) throw new Error('SelectItem must be used within a Select')

  return (
    <div
      className="px-4 py-2 text-sm text-gray-700 hover:bg-violet-500 hover:text-white cursor-pointer"
      onClick={() => {
        context.onValueChange(value)
        context.setIsOpen(false)
      }}
    >
      {children}
    </div>
  )
}