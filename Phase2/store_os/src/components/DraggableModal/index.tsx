import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize, Maximize } from 'lucide-react';
// @ts-ignore - Ignoring missing type definitions for react-draggable
import Draggable from 'react-draggable';
// import { Modal } from '../Modal'; // Not currently used

// DraggableModal Component
interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  initialPosition?: { x: number; y: number };
  onMinimize?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
  isMaximized?: boolean;
  zIndex?: number;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  initialPosition = { x: 0, y: 0 },
  onMinimize,
  isMinimized = false,
  onMaximize,
  isMaximized = false,
  zIndex = 50
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef(null);

  // Reset position when modal is opened
  useEffect(() => {
    if (isOpen) {
      setPosition(initialPosition);
    }
  }, [isOpen, initialPosition]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMinimized]);

  if (!isOpen) return null;
  if (isMinimized) return null; // Don't render content when minimized

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (_e: any, data: any) => {
    setIsDragging(false);
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <div className="fixed inset-0 overflow-y-auto pointer-events-none" style={{ zIndex }}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 pointer-events-none">
        {/* Backdrop - only show if not dragging */}
        {!isDragging && (
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity pointer-events-auto"
            onClick={onClose}
            aria-hidden="true"
          ></div>
        )}

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <Draggable
          nodeRef={nodeRef}
          handle=".draggable-handle"
          position={position}
          onStart={handleDragStart}
          onStop={handleDragStop}
          bounds="parent"
        >
          <div
            ref={nodeRef}
            className={`inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full ${
              sizeClasses[size]
            } pointer-events-auto ${isMaximized ? 'fixed inset-4 max-w-none' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-headline"
          >
            <div className="draggable-handle flex items-center justify-between p-4 border-b border-gray-200 cursor-move">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                {title}
              </h3>
              <div className="flex items-center space-x-2">
                {onMinimize && (
                  <button
                    onClick={onMinimize}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
                    aria-label="Minimize"
                  >
                    <Minimize className="h-5 w-5" />
                  </button>
                )}
                {onMaximize && (
                  <button
                    onClick={onMaximize}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                  >
                    <Maximize className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
              {children}
            </div>
          </div>
        </Draggable>
      </div>
    </div>
  );
};

// MinimizedModal Component for showing minimized modals
interface MinimizedModalProps {
  title: string;
  onRestore: () => void;
  onClose: () => void;
  index: number;
}

export const MinimizedModal: React.FC<MinimizedModalProps> = ({
  title,
  onRestore,
  onClose,
  index
}) => {
  return (
    <div 
      className="fixed bottom-4 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-between p-2 w-48 cursor-pointer"
      style={{ left: `${(index * 200) + 16}px` }}
      onClick={onRestore}
    >
      <span className="text-sm font-medium text-gray-700 truncate">{title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// ModalManager Component for managing multiple modals
interface ModalState {
  id: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  title: string;
  position: { x: number; y: number };
  zIndex: number;
}

export const useModalManager = () => {
  const [modals, setModals] = useState<Record<string, ModalState>>({});
  const [highestZIndex, setHighestZIndex] = useState(50);

  const openModal = (id: string, title: string, initialPosition = { x: 0, y: 0 }) => {
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    
    setModals(prev => ({
      ...prev,
      [id]: {
        id,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        title,
        position: initialPosition,
        zIndex: newZIndex
      }
    }));
  };

  const closeModal = (id: string) => {
    setModals(prev => {
      const newModals = { ...prev };
      delete newModals[id];
      return newModals;
    });
  };

  const minimizeModal = (id: string) => {
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMinimized: true
      }
    }));
  };

  const restoreModal = (id: string) => {
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMinimized: false,
        zIndex: newZIndex
      }
    }));
  };

  const maximizeModal = (id: string) => {
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMaximized: !prev[id].isMaximized
      }
    }));
  };

  const updatePosition = (id: string, position: { x: number; y: number }) => {
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        position
      }
    }));
  };

  const bringToFront = (id: string) => {
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        zIndex: newZIndex
      }
    }));
  };

  return {
    modals,
    openModal,
    closeModal,
    minimizeModal,
    restoreModal,
    maximizeModal,
    updatePosition,
    bringToFront
  };
};

// MinimizedModalsBar Component for showing all minimized modals
export const MinimizedModalsBar: React.FC<{
  modals: Record<string, ModalState>;
  onRestore: (id: string) => void;
  onClose: (id: string) => void;
}> = ({ modals, onRestore, onClose }) => {
  const minimizedModals = Object.values(modals).filter(modal => modal.isMinimized);
  
  if (minimizedModals.length === 0) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {minimizedModals.map((modal, index) => (
        <MinimizedModal
          key={modal.id}
          title={modal.title}
          onRestore={() => onRestore(modal.id)}
          onClose={() => onClose(modal.id)}
          index={index}
        />
      ))}
    </div>
  );
};