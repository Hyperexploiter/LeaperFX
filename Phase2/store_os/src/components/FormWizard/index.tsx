import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, AlertCircle, Clock, Shield } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  component: React.ComponentType<any>;
  validation?: (data: any) => Promise<ValidationResult> | ValidationResult;
  condition?: (data: any) => boolean;
  estimatedTime?: number; // in minutes
  complianceRequired?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  data?: any;
}

export interface FormWizardProps {
  steps: WizardStep[];
  initialData?: any;
  onComplete: (data: any) => Promise<void>;
  onStepChange?: (currentStep: number, totalSteps: number, stepData: any) => void;
  onValidation?: (stepId: string, result: ValidationResult) => void;
  allowSkipping?: boolean;
  showProgress?: boolean;
  showEstimatedTime?: boolean;
  className?: string;
}

interface StepState {
  isValid: boolean;
  isCompleted: boolean;
  errors: string[];
  warnings: string[];
  data: any;
  visitedAt?: string;
}

const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  initialData = {},
  onComplete,
  onStepChange,
  onValidation,
  allowSkipping = false,
  showProgress = true,
  showEstimatedTime = true,
  className = ''
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);

  // Get visible steps based on conditions
  const getVisibleSteps = useCallback(() => {
    return steps.filter(step => !step.condition || step.condition(formData));
  }, [steps, formData]);

  const visibleSteps = getVisibleSteps();
  const totalSteps = visibleSteps.length;
  const currentStep = visibleSteps[currentStepIndex];

  // Initialize step states
  useEffect(() => {
    const initialStates: Record<string, StepState> = {};
    visibleSteps.forEach(step => {
      if (!stepStates[step.id]) {
        initialStates[step.id] = {
          isValid: false,
          isCompleted: false,
          errors: [],
          warnings: [],
          data: {}
        };
      }
    });
    
    if (Object.keys(initialStates).length > 0) {
      setStepStates(prev => ({ ...prev, ...initialStates }));
    }
  }, [visibleSteps, stepStates]);

  // Update form data and notify parent
  const updateFormData = useCallback((stepId: string, stepData: any) => {
    const updatedData = { ...formData, [stepId]: stepData };
    setFormData(updatedData);
    
    // Update step state
    setStepStates(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        data: stepData,
        visitedAt: new Date().toISOString()
      }
    }));

    if (onStepChange) {
      onStepChange(currentStepIndex, totalSteps, updatedData);
    }
  }, [formData, currentStepIndex, totalSteps, onStepChange]);

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<ValidationResult> => {
    if (!currentStep || !currentStep.validation) {
      return { isValid: true, errors: [] };
    }

    try {
      const stepData = formData[currentStep.id] || {};
      const result = await Promise.resolve(currentStep.validation(stepData));
      
      // Update step state with validation results
      setStepStates(prev => ({
        ...prev,
        [currentStep.id]: {
          ...prev[currentStep.id],
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings || [],
          data: result.data || stepData
        }
      }));

      if (onValidation) {
        onValidation(currentStep.id, result);
      }

      return result;
    } catch (error) {
      console.error('Validation error:', error);
      const errorResult: ValidationResult = {
        isValid: false,
        errors: ['Validation failed. Please check your inputs.']
      };
      
      setStepStates(prev => ({
        ...prev,
        [currentStep.id]: {
          ...prev[currentStep.id],
          isValid: false,
          errors: errorResult.errors
        }
      }));

      return errorResult;
    }
  }, [currentStep, formData, onValidation]);

  // Navigate to next step
  const goToNext = useCallback(async () => {
    if (currentStepIndex >= totalSteps - 1) {
      // Last step - submit form
      await handleSubmit();
      return;
    }

    const validation = await validateCurrentStep();
    
    if (!validation.isValid && !allowSkipping) {
      // Show validation errors but don't prevent navigation in skippable mode
      return;
    }

    // Mark current step as completed if valid
    if (validation.isValid) {
      setStepStates(prev => ({
        ...prev,
        [currentStep.id]: {
          ...prev[currentStep.id],
          isCompleted: true
        }
      }));
    }

    setCurrentStepIndex(prev => Math.min(prev + 1, totalSteps - 1));
    setGlobalErrors([]);
  }, [currentStepIndex, totalSteps, validateCurrentStep, allowSkipping, currentStep]);

  // Navigate to previous step
  const goToPrevious = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    setGlobalErrors([]);
  }, []);

  // Jump to specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStepIndex(stepIndex);
      setGlobalErrors([]);
    }
  }, [totalSteps]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setGlobalErrors([]);

    try {
      // Validate all steps
      const validationPromises = visibleSteps.map(async (step) => {
        if (step.validation) {
          const stepData = formData[step.id] || {};
          return {
            stepId: step.id,
            result: await Promise.resolve(step.validation(stepData))
          };
        }
        return { stepId: step.id, result: { isValid: true, errors: [] } };
      });

      const validationResults = await Promise.all(validationPromises);
      const invalidSteps = validationResults.filter(v => !v.result.isValid);

      if (invalidSteps.length > 0) {
        // Update step states with validation errors
        const stateUpdates: Record<string, Partial<StepState>> = {};
        invalidSteps.forEach(({ stepId, result }) => {
          stateUpdates[stepId] = {
            isValid: false,
            errors: result.errors,
            warnings: result.warnings || []
          };
        });

        setStepStates(prev => {
          const updated = { ...prev };
          Object.keys(stateUpdates).forEach(stepId => {
            updated[stepId] = { ...updated[stepId], ...stateUpdates[stepId] };
          });
          return updated;
        });

        setGlobalErrors([
          `Please fix errors in the following steps: ${invalidSteps.map(s => 
            visibleSteps.find(step => step.id === s.stepId)?.title || s.stepId
          ).join(', ')}`
        ]);

        // Navigate to first invalid step
        const firstInvalidIndex = visibleSteps.findIndex(step => 
          invalidSteps.some(inv => inv.stepId === step.id)
        );
        if (firstInvalidIndex !== -1) {
          setCurrentStepIndex(firstInvalidIndex);
        }

        return;
      }

      // All steps valid - submit form
      await onComplete(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setGlobalErrors([
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [visibleSteps, formData, onComplete]);

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = useCallback(() => {
    if (!showEstimatedTime) return 0;
    
    const remainingSteps = visibleSteps.slice(currentStepIndex + 1);
    return remainingSteps.reduce((total, step) => total + (step.estimatedTime || 2), 0);
  }, [visibleSteps, currentStepIndex, showEstimatedTime]);

  // Render progress bar
  const renderProgressBar = () => {
    if (!showProgress) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          {showEstimatedTime && (
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              ~{getEstimatedTimeRemaining()} min remaining
            </span>
          )}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {visibleSteps.map((step, index) => {
            const state = stepStates[step.id];
            const isCompleted = state?.isCompleted || index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const hasErrors = state?.errors && state.errors.length > 0;
            const isComplianceStep = step.complianceRequired;

            return (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isCurrent 
                    ? 'bg-blue-50 text-blue-600' 
                    : isCompleted 
                      ? 'text-green-600 hover:bg-green-50' 
                      : hasErrors 
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-400 hover:bg-gray-50'
                }`}
                disabled={isSubmitting}
                title={step.title}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted 
                      ? 'bg-green-600 text-white' 
                      : hasErrors 
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : hasErrors ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : isComplianceStep ? (
                    <Shield className="h-3 w-3" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs text-center max-w-16 truncate">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render current step
  const renderCurrentStep = () => {
    if (!currentStep) return null;

    const StepComponent = currentStep.component;
    const stepState = stepStates[currentStep.id];
    const stepData = formData[currentStep.id] || {};

    return (
      <div className="flex-1">
        {/* Step header */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            {currentStep.icon && (
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                {currentStep.icon}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {currentStep.title}
                {currentStep.complianceRequired && (
                  <Shield className="h-5 w-5 ml-2 text-blue-600" />
                )}
              </h2>
              {currentStep.subtitle && (
                <p className="text-gray-600 mt-1">{currentStep.subtitle}</p>
              )}
            </div>
          </div>

          {currentStep.estimatedTime && showEstimatedTime && (
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Estimated time: {currentStep.estimatedTime} minutes
            </div>
          )}
        </div>

        {/* Step errors */}
        {stepState?.errors && stepState.errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h4 className="text-sm font-medium text-red-800">Please fix these issues:</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {stepState.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step warnings */}
        {stepState?.warnings && stepState.warnings.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <h4 className="text-sm font-medium text-yellow-800">Warnings:</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              {stepState.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step component */}
        <StepComponent
          data={stepData}
          onChange={(data: any) => updateFormData(currentStep.id, data)}
          errors={stepState?.errors || []}
          warnings={stepState?.warnings || []}
          isValid={stepState?.isValid || false}
          formData={formData}
        />
      </div>
    );
  };

  if (totalSteps === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No steps available for this form.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Global errors */}
      {globalErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h4 className="text-sm font-medium text-red-800">Form Errors:</h4>
          </div>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {globalErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress bar */}
      {renderProgressBar()}

      {/* Current step */}
      {renderCurrentStep()}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={goToPrevious}
          disabled={currentStepIndex === 0 || isSubmitting}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            currentStepIndex === 0 || isSubmitting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>

        <div className="flex items-center space-x-2">
          {allowSkipping && currentStepIndex < totalSteps - 1 && (
            <button
              onClick={() => setCurrentStepIndex(prev => prev + 1)}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          )}

          <button
            onClick={goToNext}
            disabled={isSubmitting}
            className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : currentStepIndex === totalSteps - 1 ? (
              'Submit Form'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormWizard;