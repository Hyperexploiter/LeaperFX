import React, { useEffect, useRef } from 'react';

// Real QR code implementation using canvas-based rendering
// This approach avoids compatibility issues with React 19.1.0

interface QRCodeSVGProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
  id?: string;
}

// QR code error correction levels
const ERROR_CORRECTION_LEVELS = {
  L: 0, // 7% of codewords can be restored
  M: 1, // 15% of codewords can be restored
  Q: 2, // 25% of codewords can be restored
  H: 3  // 30% of codewords can be restored
};

export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({ 
  value, 
  size = 240, 
  level = 'M',
  includeMargin = true,
  className,
  id
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return;
      
      try {
        // Dynamically import the QR code library
        // Using dynamic import to avoid issues with SSR and to load only when needed
        const QRCodeGenerator = await import('qrcode');
        
        // Generate QR code on canvas
        await QRCodeGenerator.toCanvas(canvasRef.current, value, {
          width: size,
          margin: includeMargin ? 4 : 0,
          errorCorrectionLevel: level,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
        
        // Fallback to a simple message if QR code generation fails
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = '#000000';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('QR Code Error', size / 2, size / 2);
          ctx.fillText('Please try again', size / 2, size / 2 + 20);
        }
      }
    };
    
    generateQRCode();
  }, [value, size, level, includeMargin]);
  
  return (
    <canvas
      ref={canvasRef}
      id={id}
      width={size}
      height={size}
      className={className}
    />
  );
};