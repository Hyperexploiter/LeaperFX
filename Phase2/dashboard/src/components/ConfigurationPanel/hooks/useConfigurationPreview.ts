import { useState, useCallback, useRef, useEffect } from 'react';

export interface PreviewState {
  isActive: boolean;
  originalConfiguration: Record<string, any> | null;
  previewConfiguration: Record<string, any> | null;
  changedKeys: Set<string>;
}

export const useConfigurationPreview = () => {
  const [previewState, setPreviewState] = useState<PreviewState>({
    isActive: false,
    originalConfiguration: null,
    previewConfiguration: null,
    changedKeys: new Set()
  });

  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const enablePreview = useCallback((currentConfiguration: Record<string, any>) => {
    setPreviewState({
      isActive: true,
      originalConfiguration: JSON.parse(JSON.stringify(currentConfiguration)),
      previewConfiguration: JSON.parse(JSON.stringify(currentConfiguration)),
      changedKeys: new Set()
    });
  }, []);

  const disablePreview = useCallback(() => {
    setPreviewState({
      isActive: false,
      originalConfiguration: null,
      previewConfiguration: null,
      changedKeys: new Set()
    });

    // Clear any pending timeouts
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  const previewConfiguration = useCallback((category: string, key: string, value: any) => {
    if (!previewState.isActive) return;

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce preview updates to avoid excessive re-renders
    debounceTimeoutRef.current = setTimeout(() => {
      setPreviewState(prev => {
        if (!prev.isActive || !prev.previewConfiguration) return prev;

        const newPreviewConfig = {
          ...prev.previewConfiguration,
          [category]: {
            ...prev.previewConfiguration[category],
            [key]: value
          }
        };

        const changeKey = `${category}.${key}`;
        const newChangedKeys = new Set(prev.changedKeys);

        // Check if value matches original
        const originalValue = prev.originalConfiguration?.[category]?.[key];
        if (originalValue === value) {
          newChangedKeys.delete(changeKey);
        } else {
          newChangedKeys.add(changeKey);
        }

        return {
          ...prev,
          previewConfiguration: newPreviewConfig,
          changedKeys: newChangedKeys
        };
      });

      // Apply preview changes to the actual DOM/CSS variables
      applyPreviewToDom(category, key, value);
    }, 150); // 150ms debounce
  }, [previewState.isActive]);

  const applyPreviewToDom = useCallback((category: string, key: string, value: any) => {
    try {
      const root = document.documentElement;

      // Apply color changes to CSS variables
      if (category === 'colors') {
        switch (key) {
          case 'primaryAccent':
            root.style.setProperty('--primary-accent', value);
            break;
          case 'secondaryAccent':
            root.style.setProperty('--secondary-accent', value);
            break;
          case 'positiveColor':
            root.style.setProperty('--positive-color', value);
            break;
          case 'negativeColor':
            root.style.setProperty('--negative-color', value);
            break;
          case 'backgroundColor':
            root.style.setProperty('--background-color', value);
            break;
          // Add more color mappings as needed
        }
      }

      // Apply display changes to data attributes
      if (category === 'display') {
        switch (key) {
          case 'showCountryFlags':
            root.setAttribute('data-show-flags', value.toString());
            break;
          case 'compactMode':
            root.setAttribute('data-compact-mode', value.toString());
            break;
          case 'showSparklines':
            root.setAttribute('data-show-sparklines', value.toString());
            break;
          // Add more display mappings as needed
        }
      }

      // Apply timing changes (these might affect animation durations)
      if (category === 'timing') {
        switch (key) {
          case 'bluePulseSpeed':
            root.style.setProperty('--blue-pulse-duration', `${value}ms`);
            break;
          case 'priceFlashDuration':
            root.style.setProperty('--price-flash-duration', `${value}ms`);
            break;
          case 'chartTransitionDuration':
            root.style.setProperty('--chart-transition-duration', `${value}ms`);
            break;
          // Add more timing mappings as needed
        }
      }

      // Apply performance changes
      if (category === 'performance') {
        switch (key) {
          case 'targetFPS':
            root.setAttribute('data-target-fps', value.toString());
            break;
          case 'renderMode':
            root.setAttribute('data-render-mode', value);
            break;
          // Add more performance mappings as needed
        }
      }

    } catch (error) {
      console.error('Failed to apply preview changes to DOM:', error);
    }
  }, []);

  const revertPreviewFromDom = useCallback(() => {
    try {
      const root = document.documentElement;

      // Remove custom CSS properties
      const customProperties = [
        '--primary-accent',
        '--secondary-accent',
        '--positive-color',
        '--negative-color',
        '--background-color',
        '--blue-pulse-duration',
        '--price-flash-duration',
        '--chart-transition-duration'
      ];

      customProperties.forEach(prop => {
        root.style.removeProperty(prop);
      });

      // Remove custom data attributes
      const customAttributes = [
        'data-show-flags',
        'data-compact-mode',
        'data-show-sparklines',
        'data-target-fps',
        'data-render-mode'
      ];

      customAttributes.forEach(attr => {
        root.removeAttribute(attr);
      });

    } catch (error) {
      console.error('Failed to revert preview changes from DOM:', error);
    }
  }, []);

  const applyPreview = useCallback(() => {
    if (!previewState.isActive || !previewState.previewConfiguration) {
      return null;
    }

    const result = { ...previewState.previewConfiguration };
    disablePreview();
    return result;
  }, [previewState, disablePreview]);

  const resetPreview = useCallback(() => {
    if (!previewState.isActive || !previewState.originalConfiguration) return;

    setPreviewState(prev => ({
      ...prev,
      previewConfiguration: JSON.parse(JSON.stringify(prev.originalConfiguration)),
      changedKeys: new Set()
    }));

    // Revert DOM changes
    revertPreviewFromDom();

    // Reapply original configuration to DOM
    if (previewState.originalConfiguration) {
      Object.entries(previewState.originalConfiguration).forEach(([category, settings]) => {
        Object.entries(settings as Record<string, any>).forEach(([key, value]) => {
          applyPreviewToDom(category, key, value);
        });
      });
    }
  }, [previewState, applyPreviewToDom, revertPreviewFromDom]);

  const getPreviewValue = useCallback((category: string, key: string) => {
    if (!previewState.isActive || !previewState.previewConfiguration) {
      return undefined;
    }

    return previewState.previewConfiguration[category]?.[key];
  }, [previewState]);

  const hasPreviewChanges = useCallback((category?: string, key?: string) => {
    if (!previewState.isActive) return false;

    if (category && key) {
      return previewState.changedKeys.has(`${category}.${key}`);
    }

    if (category) {
      return Array.from(previewState.changedKeys).some(changeKey =>
        changeKey.startsWith(`${category}.`)
      );
    }

    return previewState.changedKeys.size > 0;
  }, [previewState]);

  const getChangedKeys = useCallback(() => {
    return Array.from(previewState.changedKeys);
  }, [previewState]);

  // Auto-disable preview after 30 minutes of inactivity
  useEffect(() => {
    if (previewState.isActive) {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }

      previewTimeoutRef.current = setTimeout(() => {
        console.log('Auto-disabling preview mode due to inactivity');
        disablePreview();
        revertPreviewFromDom();
      }, 30 * 60 * 1000); // 30 minutes
    }
  }, [previewState.isActive, disablePreview, revertPreviewFromDom]);

  // Cleanup preview on disable
  useEffect(() => {
    if (!previewState.isActive) {
      revertPreviewFromDom();
    }
  }, [previewState.isActive, revertPreviewFromDom]);

  return {
    isPreviewActive: previewState.isActive,
    previewConfiguration: previewState.previewConfiguration,
    changedKeys: previewState.changedKeys,
    enablePreview,
    disablePreview,
    previewConfiguration: previewConfiguration,
    applyPreview,
    resetPreview,
    getPreviewValue,
    hasPreviewChanges,
    getChangedKeys
  };
};