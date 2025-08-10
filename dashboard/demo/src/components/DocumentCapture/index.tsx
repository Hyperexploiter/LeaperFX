import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Check, AlertCircle, Upload, X } from 'lucide-react';
import { DocumentValidation } from '../../utils/security';

export interface CapturedDocument {
  id: string;
  type: 'photo_id' | 'proof_of_address' | 'selfie';
  file: File;
  dataUrl: string;
  quality: DocumentQuality;
  metadata: DocumentMetadata;
}

export interface DocumentQuality {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  brightness: number; // 0-100
  sharpness: number; // 0-100
  resolution: { width: number; height: number };
  fileSize: number;
  issues: string[];
}

export interface DocumentMetadata {
  timestamp: string;
  deviceInfo: string;
  geolocation?: { latitude: number; longitude: number };
  captureMethod: 'camera' | 'upload';
}

interface DocumentCaptureProps {
  documentType: 'photo_id' | 'proof_of_address' | 'selfie';
  title: string;
  subtitle: string;
  instructions: string[];
  onCapture: (document: CapturedDocument) => void;
  onError: (error: string) => void;
  required?: boolean;
  maxFileSize?: number; // in MB
  quality?: 'high' | 'medium' | 'low';
}

const DocumentCapture: React.FC<DocumentCaptureProps> = ({
  documentType,
  title,
  subtitle,
  instructions,
  onCapture,
  onError,
  required = false,
  maxFileSize = 5,
  quality = 'high'
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentQuality, setDocumentQuality] = useState<DocumentQuality | null>(null);
  const [showUploadOption, setShowUploadOption] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera constraints based on document type
  const getCameraConstraints = useCallback(() => {
    const baseConstraints = {
      video: {
        facingMode: documentType === 'selfie' ? 'user' : 'environment',
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        aspectRatio: documentType === 'photo_id' ? 1.586 : 1.777, // ID card vs standard ratio
      },
      audio: false
    };

    // Enhanced quality for ID documents
    if (documentType === 'photo_id' && quality === 'high') {
      baseConstraints.video.width = { ideal: 2560, min: 1920 };
      baseConstraints.video.height = { ideal: 1440, min: 1080 };
    }

    return baseConstraints;
  }, [documentType, quality]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const constraints = getCameraConstraints();
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      onError('Camera access denied. Please enable camera permissions or use file upload.');
      setShowUploadOption(true);
    }
  }, [getCameraConstraints, onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  // Capture photo from video stream
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    setIsProcessing(true);

    try {
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob with high quality
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.95);
      });

      if (!blob) throw new Error('Failed to create image blob');

      // Create file from blob
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${documentType}_${timestamp}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Get data URL for preview
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);

      // Analyze document quality
      const quality = await analyzeDocumentQuality(file, canvas);
      setDocumentQuality(quality);

      // Create captured document object
      const capturedDoc: CapturedDocument = {
        id: `${documentType}_${Date.now()}`,
        type: documentType,
        file,
        dataUrl,
        quality,
        metadata: {
          timestamp: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          captureMethod: 'camera'
        }
      };

      // Stop camera after capture
      stopCamera();

      // Return captured document
      onCapture(capturedDoc);
    } catch (error) {
      console.error('Capture error:', error);
      onError('Failed to capture image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [documentType, stopCamera, onCapture, onError]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Validate file type and size
      if (!DocumentValidation.isValidDocumentType(file.name, file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or PDF file.');
      }

      if (!DocumentValidation.isValidFileSize(file.size, maxFileSize)) {
        throw new Error(`File size too large. Maximum ${maxFileSize}MB allowed.`);
      }

      // Create data URL for preview
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      setCapturedImage(dataUrl);

      // Create temporary canvas for quality analysis
      const canvas = document.createElement('canvas');
      const img = new Image();
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = dataUrl;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext('2d');
      context?.drawImage(img, 0, 0);

      // Analyze document quality
      const quality = await analyzeDocumentQuality(file, canvas);
      setDocumentQuality(quality);

      // Create captured document object
      const capturedDoc: CapturedDocument = {
        id: `${documentType}_${Date.now()}`,
        type: documentType,
        file,
        dataUrl,
        quality,
        metadata: {
          timestamp: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          captureMethod: 'upload'
        }
      };

      onCapture(capturedDoc);
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Failed to upload file.');
    } finally {
      setIsProcessing(false);
    }
  }, [documentType, maxFileSize, onCapture, onError]);

  // Analyze document quality
  const analyzeDocumentQuality = async (file: File, canvas: HTMLCanvasElement): Promise<DocumentQuality> => {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    // Calculate brightness
    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      brightness += (r + g + b) / 3;
    }
    brightness = (brightness / (width * height)) / 2.55; // Convert to 0-100 scale

    // Calculate sharpness (simplified edge detection)
    let sharpness = 0;
    for (let i = 0; i < height - 1; i++) {
      for (let j = 0; j < width - 1; j++) {
        const idx = (i * width + j) * 4;
        const nextIdx = ((i + 1) * width + j) * 4;
        const diff = Math.abs(data[idx] - data[nextIdx]);
        sharpness += diff;
      }
    }
    sharpness = Math.min(100, (sharpness / (width * height)) / 2.55);

    // Identify quality issues
    const issues: string[] = [];
    if (brightness < 30) issues.push('Image too dark');
    if (brightness > 85) issues.push('Image too bright');
    if (sharpness < 20) issues.push('Image blurry');
    if (width < 1280 || height < 720) issues.push('Resolution too low');
    if (file.size < 100 * 1024) issues.push('File size too small');

    // Determine overall quality
    let overall: DocumentQuality['overall'];
    if (issues.length === 0 && brightness > 40 && brightness < 75 && sharpness > 40) {
      overall = 'excellent';
    } else if (issues.length <= 1 && brightness > 35 && brightness < 80 && sharpness > 25) {
      overall = 'good';
    } else if (issues.length <= 2 && brightness > 25 && brightness < 85 && sharpness > 15) {
      overall = 'fair';
    } else {
      overall = 'poor';
    }

    return {
      overall,
      brightness: Math.round(brightness),
      sharpness: Math.round(sharpness),
      resolution: { width, height },
      fileSize: file.size,
      issues
    };
  };

  // Retry capture
  const retryCapture = useCallback(() => {
    setCapturedImage(null);
    setDocumentQuality(null);
    setIsProcessing(false);
    startCamera();
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Render quality indicator
  const renderQualityIndicator = () => {
    if (!documentQuality) return null;

    const getQualityColor = (quality: string) => {
      switch (quality) {
        case 'excellent': return 'text-green-600 bg-green-100';
        case 'good': return 'text-blue-600 bg-blue-100';
        case 'fair': return 'text-yellow-600 bg-yellow-100';
        case 'poor': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="mt-4 p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Document Quality</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(documentQuality.overall)}`}>
            {documentQuality.overall.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
          <div>Brightness: {documentQuality.brightness}%</div>
          <div>Sharpness: {documentQuality.sharpness}%</div>
          <div>Size: {Math.round(documentQuality.fileSize / 1024)}KB</div>
          <div>Resolution: {documentQuality.resolution.width}×{documentQuality.resolution.height}</div>
        </div>

        {documentQuality.issues.length > 0 && (
          <div className="text-xs">
            <span className="text-red-600 font-medium">Issues:</span>
            <ul className="list-disc list-inside text-red-600 ml-2">
              {documentQuality.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
        
        {instructions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Camera View */}
      {isCapturing && !capturedImage && (
        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black"
            style={{ maxHeight: '400px', objectFit: 'cover' }}
          />
          
          {/* Camera overlay for ID documents */}
          {documentType === 'photo_id' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Position ID within frame
                </span>
              </div>
            </div>
          )}

          {/* Selfie guide */}
          {documentType === 'selfie' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white border-dashed rounded-full"></div>
            </div>
          )}
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="mb-4">
          <img
            src={capturedImage}
            alt="Captured document"
            className="w-full rounded-lg shadow-md"
            style={{ maxHeight: '400px', objectFit: 'contain' }}
          />
          {renderQualityIndicator()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isCapturing && !capturedImage && (
          <div className="flex flex-col space-y-3">
            <button
              onClick={startCamera}
              disabled={isProcessing}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              <Camera className="h-5 w-5 mr-2" />
              {isProcessing ? 'Starting Camera...' : 'Start Camera'}
            </button>
            
            {(showUploadOption || documentType !== 'selfie') && (
              <>
                <div className="text-center text-sm text-gray-500">or</div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:bg-gray-50 transition-colors"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload File
                </button>
              </>
            )}
          </div>
        )}

        {isCapturing && !capturedImage && (
          <div className="flex space-x-3">
            <button
              onClick={capturePhoto}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 transition-colors"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Capture
                </>
              )}
            </button>
            
            <button
              onClick={stopCamera}
              disabled={isProcessing}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {capturedImage && (
          <div className="flex space-x-3">
            {documentQuality?.overall === 'poor' ? (
              <button
                onClick={retryCapture}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Retake (Quality Issues)
              </button>
            ) : (
              <button
                onClick={retryCapture}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            )}
            
            <div className="flex-1 flex items-center text-green-600 bg-green-50 px-4 py-3 rounded-lg">
              <Check className="h-5 w-5 mr-2" />
              Document Captured
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
};

export default DocumentCapture;