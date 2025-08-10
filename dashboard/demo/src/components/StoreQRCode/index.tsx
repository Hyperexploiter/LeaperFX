import React, { useState, useEffect, useRef } from 'react';
import { Download, QrCode, Copy, Check, RefreshCw, Plus } from 'lucide-react';
import formService from '../../services/formService';

interface StoreQRCodeProps {
  storeUrl?: string;
  size?: number;
}

const StoreQRCode: React.FC<StoreQRCodeProps> = ({ 
  storeUrl, 
  size = 200 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessionUrl, setCurrentSessionUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNewSession = async () => {
    setIsGenerating(true);
    try {
      console.log('Attempting to create form session...');
      const session = await formService.createFormSession();
      console.log('Form session created:', session);
      
      // Use the complete URL with token from the session
      setCurrentSessionUrl(session.sessionUrl);
      await generateQRCode(session.sessionUrl);
      
      console.log('QR code generated successfully');
    } catch (error) {
      console.error('Error creating form session:', error);
      alert(`Failed to create new form session: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQRCode = async (url: string) => {
    if (!canvasRef.current) return;
    
    setIsLoading(true);
    try {
      // Dynamically import the QR code library
      const QRCodeGenerator = await import('qrcode');
      
      // Generate QR code on canvas
      await QRCodeGenerator.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'M',
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize with either provided URL or generate new session
    if (storeUrl) {
      setCurrentSessionUrl(storeUrl);
      generateQRCode(storeUrl);
    } else {
      generateNewSession();
    }
  }, [storeUrl, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    try {
      // Convert canvas to blob and download
      canvasRef.current.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'store-qr-code.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentSessionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <QrCode className="h-5 w-5 mr-2" />
          Customer Form QR Code
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={generateNewSession}
            disabled={isGenerating}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            title="Generate New Session"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                New QR
              </>
            )}
          </button>
          <button
            onClick={handleCopyUrl}
            disabled={!currentSessionUrl}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={!currentSessionUrl}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Download QR Code"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ width: size, height: size }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              className="block"
            />
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium">Customer Form URL:</p>
          <p className="break-all bg-gray-50 px-3 py-2 rounded mt-1">
            {currentSessionUrl || 'Generating...'}
          </p>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>Customers scan this QR code to access the secure ID verification form</p>
          <p>Each QR code creates a unique session for FINTRAC compliance</p>
        </div>
      </div>
    </div>
  );
};

export default StoreQRCode;