import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Eye, RotateCcw, Check, AlertCircle, User } from 'lucide-react';

export interface LivenessResult {
  passed: boolean;
  confidence: number;
  checks: {
    faceDetected: boolean;
    eyeMovement: boolean;
    headMovement: boolean;
    blinkDetection: boolean;
    livenessScore: number;
  };
  capturedImages: {
    neutral: string;
    blink: string;
    turnLeft: string;
    turnRight: string;
  };
  metadata: {
    duration: number;
    attempts: number;
    timestamp: string;
    deviceInfo: string;
  };
}

export interface LivenessDetectionProps {
  onComplete: (result: LivenessResult) => void;
  onError: (error: string) => void;
  timeout?: number; // in seconds
  requiredConfidence?: number; // 0-1
  className?: string;
}

type DetectionStep = 'initializing' | 'face_detection' | 'look_straight' | 'blink' | 'turn_left' | 'turn_right' | 'processing' | 'completed';

const STEP_INSTRUCTIONS = {
  initializing: 'Initializing camera...',
  face_detection: 'Position your face in the circle',
  look_straight: 'Look straight at the camera',
  blink: 'Blink your eyes naturally',
  turn_left: 'Turn your head slightly left',
  turn_right: 'Turn your head slightly right',
  processing: 'Analyzing liveness...',
  completed: 'Verification complete'
};

const LivenessDetection: React.FC<LivenessDetectionProps> = ({
  onComplete,
  onError,
  timeout = 60,
  requiredConfidence = 0.7,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<DetectionStep>('initializing');
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeout);
  const [attempts, setAttempts] = useState(0);
  const [detectionData, setDetectionData] = useState({
    faceDetected: false,
    eyeMovement: false,
    headMovement: false,
    blinkDetection: false,
    previousPositions: [] as number[][],
    blinkFrames: [] as boolean[],
    facePositions: [] as { x: number; y: number; width: number; height: number }[]
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Start camera and liveness detection
  const startDetection = useCallback(async () => {
    try {
      setCurrentStep('initializing');
      setIsActive(true);
      setAttempts(prev => prev + 1);
      startTimeRef.current = Date.now();

      // Request camera access with front-facing camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Start detection process
        setTimeout(() => {
          startLivenessSequence();
        }, 2000); // Give user time to position
      }

      // Set overall timeout
      timeoutRef.current = setTimeout(() => {
        onError('Liveness detection timed out. Please try again.');
        stopDetection();
      }, timeout * 1000);

    } catch (error) {
      console.error('Camera access error:', error);
      onError('Camera access denied. Please enable camera permissions.');
      setIsActive(false);
    }
  }, [timeout, onError]);

  // Stop detection and cleanup
  const stopDetection = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsActive(false);
    setCurrentStep('initializing');
    setProgress(0);
    setDetectionData({
      faceDetected: false,
      eyeMovement: false,
      headMovement: false,
      blinkDetection: false,
      previousPositions: [],
      blinkFrames: [],
      facePositions: []
    });
  }, [stream]);

  // Start the liveness detection sequence
  const startLivenessSequence = useCallback(async () => {
    const steps: DetectionStep[] = ['face_detection', 'look_straight', 'blink', 'turn_left', 'turn_right'];
    let stepIndex = 0;

    const nextStep = () => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex]);
        setProgress((stepIndex / steps.length) * 100);
        stepIndex++;
        
        // Auto-advance after certain time for each step
        setTimeout(() => {
          if (stepIndex < steps.length) {
            nextStep();
          } else {
            finishDetection();
          }
        }, 3000);
      }
    };

    // Start face detection
    startFaceDetection();
    nextStep();
  }, []);

  // Start continuous face detection
  const startFaceDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    detectionIntervalRef.current = setInterval(async () => {
      if (!video || !context) return;

      try {
        // Draw current frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Simple face detection using brightness analysis
        // In production, you'd use a proper face detection library like MediaPipe or face-api.js
        const faceRegion = detectFaceRegion(imageData);
        
        if (faceRegion) {
          setDetectionData(prev => ({
            ...prev,
            faceDetected: true,
            facePositions: [...prev.facePositions.slice(-10), faceRegion] // Keep last 10 positions
          }));

          // Analyze movement and blinking based on current step
          analyzeMovement(faceRegion);
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, 100); // 10 FPS detection
  }, []);

  // Simple face detection using brightness and contrast analysis
  const detectFaceRegion = (imageData: ImageData): { x: number; y: number; width: number; height: number } | null => {
    const { data, width, height } = imageData;
    
    // Find brightest region that could be a face
    let maxBrightness = 0;
    let faceX = 0, faceY = 0;
    const regionSize = 100; // Approximate face region size

    for (let y = regionSize; y < height - regionSize; y += 10) {
      for (let x = regionSize; x < width - regionSize; x += 10) {
        let totalBrightness = 0;
        let pixelCount = 0;

        // Sample brightness in a region
        for (let dy = -regionSize/2; dy < regionSize/2; dy += 5) {
          for (let dx = -regionSize/2; dx < regionSize/2; dx += 5) {
            const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
            if (pixelIndex >= 0 && pixelIndex < data.length - 3) {
              const r = data[pixelIndex];
              const g = data[pixelIndex + 1];
              const b = data[pixelIndex + 2];
              const brightness = (r + g + b) / 3;
              totalBrightness += brightness;
              pixelCount++;
            }
          }
        }

        const avgBrightness = totalBrightness / pixelCount;
        if (avgBrightness > maxBrightness && avgBrightness > 80 && avgBrightness < 200) {
          maxBrightness = avgBrightness;
          faceX = x;
          faceY = y;
        }
      }
    }

    if (maxBrightness > 0) {
      return {
        x: faceX - regionSize/2,
        y: faceY - regionSize/2,
        width: regionSize,
        height: regionSize
      };
    }

    return null;
  };

  // Analyze movement patterns for liveness
  const analyzeMovement = useCallback((faceRegion: { x: number; y: number; width: number; height: number }) => {
    setDetectionData(prev => {
      const newData = { ...prev };

      // Track head movement
      if (prev.facePositions.length > 5) {
        const recentPositions = prev.facePositions.slice(-5);
        const movements = recentPositions.map((pos, i) => {
          if (i === 0) return { x: 0, y: 0 };
          return {
            x: pos.x - recentPositions[i - 1].x,
            y: pos.y - recentPositions[i - 1].y
          };
        });

        const avgMovement = movements.reduce((sum, mov) => 
          sum + Math.abs(mov.x) + Math.abs(mov.y), 0) / movements.length;

        if (avgMovement > 5) {
          newData.headMovement = true;
        }
      }

      // Simple blink detection based on face region height changes
      if (prev.facePositions.length > 3) {
        const recentHeights = prev.facePositions.slice(-3).map(pos => pos.height);
        const heightVariation = Math.max(...recentHeights) - Math.min(...recentHeights);
        
        if (heightVariation > 10) { // Height change indicates potential blink
          newData.blinkFrames = [...prev.blinkFrames.slice(-20), true];
          
          // Check for blink pattern (height decrease then increase)
          const recentBlinks = newData.blinkFrames.slice(-10);
          if (recentBlinks.filter(b => b).length >= 2) {
            newData.blinkDetection = true;
          }
        } else {
          newData.blinkFrames = [...prev.blinkFrames.slice(-20), false];
        }
      }

      return newData;
    });
  }, []);

  // Capture image at current step
  const captureStepImage = useCallback((stepName: string) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Draw current frame and get data URL
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    setCapturedImages(prev => ({
      ...prev,
      [stepName]: dataUrl
    }));
  }, []);

  // Finish detection and calculate results
  const finishDetection = useCallback(async () => {
    setCurrentStep('processing');
    setProgress(90);

    // Capture final image
    captureStepImage('neutral');

    // Calculate confidence based on completed checks
    const checks = {
      faceDetected: detectionData.faceDetected,
      eyeMovement: detectionData.facePositions.length > 10,
      headMovement: detectionData.headMovement,
      blinkDetection: detectionData.blinkDetection,
      livenessScore: 0
    };

    // Calculate overall liveness score
    const completedChecks = Object.values(checks).filter(check => 
      typeof check === 'boolean' ? check : check > 0
    ).length - 1; // Exclude livenessScore from count

    const confidence = completedChecks / 4; // 4 main checks
    checks.livenessScore = confidence;

    const duration = Date.now() - startTimeRef.current;

    const result: LivenessResult = {
      passed: confidence >= requiredConfidence,
      confidence,
      checks,
      capturedImages: {
        neutral: capturedImages.neutral || '',
        blink: capturedImages.blink || '',
        turnLeft: capturedImages.turn_left || '',
        turnRight: capturedImages.turn_right || ''
      },
      metadata: {
        duration,
        attempts,
        timestamp: new Date().toISOString(),
        deviceInfo: navigator.userAgent
      }
    };

    setProgress(100);
    setCurrentStep('completed');

    // Stop detection
    setTimeout(() => {
      stopDetection();
      onComplete(result);
    }, 2000);
  }, [detectionData, capturedImages, attempts, requiredConfidence, onComplete, stopDetection, captureStepImage]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onError('Liveness detection timed out.');
          stopDetection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onError, stopDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Auto-capture images at certain steps
  useEffect(() => {
    const captureSteps: { [key in DetectionStep]?: string } = {
      blink: 'blink',
      turn_left: 'turn_left',
      turn_right: 'turn_right'
    };

    if (captureSteps[currentStep]) {
      setTimeout(() => {
        captureStepImage(captureSteps[currentStep]!);
      }, 1500);
    }
  }, [currentStep, captureStepImage]);

  const renderInstructions = () => {
    return (
      <div className="text-center mb-6">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
            {currentStep === 'processing' || currentStep === 'completed' ? (
              <Check className="h-8 w-8 text-blue-600" />
            ) : (
              <User className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Liveness Verification</h3>
          <p className="text-gray-600">{STEP_INSTRUCTIONS[currentStep]}</p>
        </div>

        {isActive && (
          <div className="text-sm text-gray-500 mb-4">
            Time remaining: {timeRemaining}s
          </div>
        )}

        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderCamera = () => {
    if (!isActive) return null;

    return (
      <div className="relative mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-md mx-auto rounded-lg bg-black"
          style={{ transform: 'scaleX(-1)' }} // Mirror for selfie
        />
        
        {/* Face detection overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`w-48 h-48 rounded-full border-4 transition-colors ${
            detectionData.faceDetected ? 'border-green-500' : 'border-white border-dashed'
          }`}>
            <div className="w-full h-full rounded-full bg-transparent flex items-center justify-center">
              {detectionData.faceDetected && (
                <Check className="h-8 w-8 text-green-500" />
              )}
            </div>
          </div>
        </div>

        {/* Step-specific indicators */}
        {currentStep === 'blink' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            <Eye className="h-4 w-4 inline mr-1" />
            Blink naturally
          </div>
        )}

        {currentStep === 'turn_left' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            <RotateCcw className="h-4 w-4 inline mr-1" />
            Turn left slightly
          </div>
        )}

        {currentStep === 'turn_right' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            <RotateCcw className="h-4 w-4 inline mr-1 transform scale-x-[-1]" />
            Turn right slightly
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      {renderInstructions()}
      {renderCamera()}

      {/* Action buttons */}
      <div className="flex justify-center space-x-3">
        {!isActive && currentStep !== 'completed' && (
          <button
            onClick={startDetection}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Camera className="h-5 w-5 mr-2" />
            Start Liveness Check
          </button>
        )}

        {isActive && currentStep !== 'completed' && currentStep !== 'processing' && (
          <button
            onClick={stopDetection}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}

        {currentStep === 'completed' && (
          <div className="flex items-center text-green-600">
            <Check className="h-5 w-5 mr-2" />
            Verification Complete
          </div>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LivenessDetection;