# Algorithm Visualization Documentation

## Overview

This document outlines the changes made to implement a step-by-step visual breakdown of the rate lock algorithm in the Leaper-Fx website. The implementation aims to help the store owner better understand how the algorithm operates by providing a clear, visual explanation of each step in the calculation process.

## Changes Made

### 1. Added State Variables

Added state variables to track the current step and whether to show the algorithm steps:

```javascript
const [currentStep, setCurrentStep] = useState(0);
const [showAlgorithmSteps, setShowAlgorithmSteps] = useState(false);
```

### 2. Updated Handler Function

Modified the `handleCalculateRateLock` function to reset the step counter and set the default state of `showAlgorithmSteps` to false when calculating a new rate lock:

```javascript
const handleCalculateRateLock = async () => {
  try {
    setIsCalculating(true);
    // Reset step counter
    setCurrentStep(0);
    
    // ... existing code ...
    
    // Default to not showing algorithm steps
    setShowAlgorithmSteps(false);
    
    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  } finally {
    // ... existing code ...
  }
};
```

### 3. Added Toggle Button

Added a toggle button to the rate lock modal to switch between the regular view and the step-by-step visualization:

```javascript
<button
  onClick={() => setShowAlgorithmSteps(!showAlgorithmSteps)}
  className="mr-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
>
  {showAlgorithmSteps ? "Hide Steps" : "Show How It Works"}
</button>
```

### 4. Implemented Step-by-Step Visualization

Created a comprehensive step-by-step visualization component that breaks down the algorithm into 9 clear steps:

1. **Gather Input Data** - Shows the key inputs used in the calculation
2. **Calculate Time Premium** - Explains how the time premium is calculated
3. **Calculate Volatility Premium** - Explains how the volatility premium is calculated
4. **Calculate Inventory Factor** - Explains how inventory affects pricing
5. **Calculate Demand Factor** - Explains how market demand affects pricing
6. **Calculate Customer Favor** - Explains how the customer's target rate affects pricing
7. **Calculate Base Rate** - Explains how the base rate is determined
8. **Apply Total Premium** - Shows how all premiums are combined and applied
9. **Finalize Optimal Rate** - Shows how the final rate is determined

Each step includes:
- A clear title and explanation
- Visual elements to enhance understanding (cards, colors, etc.)
- Specific calculations and values relevant to that step
- Explanatory text to help the user understand the process

### 5. Added Navigation Controls

Implemented navigation controls that allow the user to move between steps:

```javascript
<div className="flex justify-between">
  <button
    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
    disabled={currentStep === 0}
    className={`px-4 py-2 rounded-lg font-medium ${
      currentStep === 0 
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    }`}
  >
    Previous Step
  </button>
  
  <div className="text-center">
    <span className="text-sm font-medium text-gray-600">
      Step {currentStep + 1} of 9
    </span>
  </div>
  
  <button
    onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}
    disabled={currentStep === 8}
    className={`px-4 py-2 rounded-lg font-medium ${
      currentStep === 8
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
        : 'bg-blue-600 text-white hover:bg-blue-700'
    }`}
  >
    Next Step
  </button>
</div>
```

### 6. Added Progress Bar

Implemented a progress bar to visually indicate the current step in the process:

```javascript
<div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
  <div 
    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
    style={{ width: `${(currentStep + 1) * (100 / 9)}%` }}
  ></div>
</div>
```

### 7. Implemented Conditional Rendering

Used conditional rendering to show either the regular view or the step-by-step visualization based on the `showAlgorithmSteps` state:

```javascript
// Conditional rendering based on showAlgorithmSteps state
if (!showAlgorithmSteps) {
  // Show regular view
} else {
  // Show step-by-step visualization
}
```

## Testing Instructions

To test the step-by-step visualization:

1. Start the website server:
   ```bash
   cd dashboard/demo/website
   npm start
   ```

2. Open the website in a browser (typically at http://localhost:3000).

3. Use the currency calculator to set up a rate lock:
   - Select currencies (e.g., USD to CAD)
   - Enter an amount (e.g., 5,000 USD)
   - Click the "DEMO: See Rate Lock Magic!" button

4. When the rate lock modal appears, click the "Show How It Works" button to see the step-by-step visualization.

5. Use the "Previous Step" and "Next Step" buttons to navigate through the steps of the algorithm.

6. Verify that each step displays correctly and provides clear explanations of the calculation process.

7. Click "Hide Steps" to return to the regular view.

## Benefits for the Store Owner

This step-by-step visualization provides several benefits for the store owner:

1. **Clear Understanding**: Breaks down the complex algorithm into easy-to-understand steps.
2. **Visual Learning**: Uses visual elements to enhance understanding of each calculation.
3. **Transparency**: Shows exactly how the rate lock price is calculated.
4. **Educational Tool**: Can be used to explain the process to customers or new staff.
5. **Step-by-Step Progression**: Allows the owner to go through the process at their own pace.

## Recent Enhancements

The following enhancements have been implemented to improve the algorithm visualization:

### 1. Interactive Parameter Controls

Added interactive slider controls that allow users to adjust key parameters and see how they affect the calculation in real-time:

- **Lock Duration** (Step 1): Adjust the number of days for the rate lock (1-30 days)
- **Market Volatility** (Step 3): Adjust the daily market volatility (0.5%-5.0%)
- **Available Inventory** (Step 4): Adjust the available inventory levels ($10,000-$100,000)
- **Market Demand** (Step 5): Adjust the market demand (0%-40% above normal)

Each parameter slider includes:
- Real-time recalculation when values change
- Color-coded visual feedback (green/yellow/red) to indicate risk levels
- Smooth transitions between values

### 2. Animated Transitions

Added smooth animations to enhance the user experience:

- **Step Transitions**: Fade and transform effects when moving between steps
- **Progress Bar**: Enhanced progress bar with smooth animations and visual effects
- **Parameter Changes**: Color transitions when adjusting parameters to provide visual feedback

### 3. Payment Method Explanation

Added a clear explanation of how the payment process works:

- No immediate payment required - payment method is saved but not charged yet
- Automatic execution when the optimal rate is found
- Secure transaction processing
- Immediate confirmation via email

## Future Enhancements

Potential future enhancements to the visualization could include:

1. **Printable Summary**: Add the ability to print or save a summary of the calculation.
2. **Video Tutorials**: Integrate short video explanations for each step.
3. **Simplified Mode**: Add an even simpler explanation mode for very basic understanding.
4. **Comparison View**: Allow users to compare different parameter combinations side by side.
5. **Historical Data**: Show how the algorithm would have performed with historical exchange rate data.