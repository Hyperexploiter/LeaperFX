import React from 'react';
import { Calculator } from 'lucide-react';
import { DraggableModal, useModalManager, MinimizedModalsBar } from '../DraggableModal';
import SmartCalculator from '../SmartCalculator';

// Floating button to open the calculator
interface FloatingCalculatorButtonProps {
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingCalculatorButton: React.FC<FloatingCalculatorButtonProps> = ({
  onClick,
  position = 'bottom-right'
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-110`}
      aria-label="Open Calculator"
    >
      <Calculator className="h-6 w-6" />
    </button>
  );
};

// Draggable Calculator Component
const DraggableCalculator: React.FC = () => {
  const {
    modals,
    openModal,
    closeModal,
    minimizeModal,
    restoreModal,
    maximizeModal
  } = useModalManager();

  const calculatorId = 'smart-calculator';

  const handleOpenCalculator = () => {
    // Check if calculator is already open but minimized
    if (modals[calculatorId] && modals[calculatorId].isMinimized) {
      restoreModal(calculatorId);
    } 
    // Check if calculator is not open at all
    else if (!modals[calculatorId]) {
      openModal(calculatorId, 'Smart Calculator', { x: 100, y: 100 });
    }
  };

  return (
    <>
      <FloatingCalculatorButton onClick={handleOpenCalculator} />
      
      {modals[calculatorId] && (
        <DraggableModal
          isOpen={modals[calculatorId].isOpen}
          onClose={() => closeModal(calculatorId)}
          title="Smart Calculator"
          size="lg"
          initialPosition={modals[calculatorId].position}
          onMinimize={() => minimizeModal(calculatorId)}
          isMinimized={modals[calculatorId].isMinimized}
          onMaximize={() => maximizeModal(calculatorId)}
          isMaximized={modals[calculatorId].isMaximized}
          zIndex={modals[calculatorId].zIndex}
        >
          <SmartCalculator />
        </DraggableModal>
      )}
      
      <MinimizedModalsBar
        modals={modals}
        onRestore={restoreModal}
        onClose={closeModal}
      />
    </>
  );
};

export default DraggableCalculator;