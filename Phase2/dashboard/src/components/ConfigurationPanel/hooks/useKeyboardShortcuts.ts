import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutsConfig {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onTogglePreview?: () => void;
  onClose?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onResetAll?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onSave,
  onUndo,
  onRedo,
  onTogglePreview,
  onClose,
  onSearch,
  onExport,
  onImport,
  onResetAll,
  enabled = true
}: KeyboardShortcutsConfig) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
    const isModifierPressed = ctrlKey || metaKey;

    // Prevent default browser shortcuts when we handle them
    const shouldPreventDefault = () => {
      if (!isModifierPressed) return false;

      switch (key.toLowerCase()) {
        case 's': // Save
        case 'z': // Undo
        case 'y': // Redo
        case 'f': // Search
        case 'e': // Export
        case 'i': // Import
        case 'r': // Reset
          return true;
        case 'p': // Toggle Preview
          return shiftKey;
        default:
          return false;
      }
    };

    if (shouldPreventDefault()) {
      event.preventDefault();
    }

    // Handle shortcuts
    if (isModifierPressed) {
      switch (key.toLowerCase()) {
        case 's':
          if (!shiftKey && !altKey) {
            event.preventDefault();
            onSave?.();
          }
          break;

        case 'z':
          if (!shiftKey && !altKey) {
            event.preventDefault();
            onUndo?.();
          }
          break;

        case 'y':
          if (!shiftKey && !altKey) {
            event.preventDefault();
            onRedo?.();
          }
          break;

        case 'p':
          if (shiftKey && !altKey) {
            event.preventDefault();
            onTogglePreview?.();
          }
          break;

        case 'f':
          if (!shiftKey && !altKey) {
            event.preventDefault();
            onSearch?.();
          }
          break;

        case 'e':
          if (shiftKey && !altKey) {
            event.preventDefault();
            onExport?.();
          }
          break;

        case 'i':
          if (shiftKey && !altKey) {
            event.preventDefault();
            onImport?.();
          }
          break;

        case 'r':
          if (shiftKey && altKey) {
            event.preventDefault();
            onResetAll?.();
          }
          break;
      }
    }

    // Handle non-modifier shortcuts
    switch (key) {
      case 'Escape':
        event.preventDefault();
        onClose?.();
        break;

      case 'F1':
        event.preventDefault();
        // Could trigger help modal
        break;
    }
  }, [
    enabled,
    onSave,
    onUndo,
    onRedo,
    onTogglePreview,
    onClose,
    onSearch,
    onExport,
    onImport,
    onResetAll
  ]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  // Return available shortcuts for UI display
  const shortcuts = {
    save: { keys: ['Ctrl', 'S'], description: 'Save configuration' },
    undo: { keys: ['Ctrl', 'Z'], description: 'Undo last change' },
    redo: { keys: ['Ctrl', 'Y'], description: 'Redo last undone change' },
    togglePreview: { keys: ['Ctrl', 'Shift', 'P'], description: 'Toggle live preview' },
    search: { keys: ['Ctrl', 'F'], description: 'Focus search input' },
    export: { keys: ['Ctrl', 'Shift', 'E'], description: 'Export configuration' },
    import: { keys: ['Ctrl', 'Shift', 'I'], description: 'Import configuration' },
    resetAll: { keys: ['Ctrl', 'Shift', 'Alt', 'R'], description: 'Reset all to defaults' },
    close: { keys: ['Esc'], description: 'Close configuration panel' }
  };

  return { shortcuts };
};