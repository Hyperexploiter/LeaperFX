import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import databaseService from '../../services/databaseService';

interface CSVImportProps {
  type: 'inventory' | 'customers' | 'clients';
  onImportComplete?: () => void;
}

const CSVImport: React.FC<CSVImportProps> = ({ type, onImportComplete }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    recordsProcessed?: number;
  } | null>(null);

  // Input sanitization utility
  const sanitizeInput = (input: string): string => {
    // Remove potential CSV injection patterns
    // For imports, we should not alter phone numbers starting with '+' or '-'.
    // Keep neutralization only for values starting with '=' or '@' (classic Excel formula prefixes).
    const dangerous = /^[=@]/;
    if (dangerous.test(input.trim())) {
      return "'" + input; // Prefix with single quote to neutralize potential formula content
    }
    
    // Remove HTML tags and script content
    const cleanInput = input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    return cleanInput.trim();
  };

  const parseCSV = (text: string): any[] => {
    // First, sanitize the entire text content
    const sanitizedText = text.replace(/[\r\n]+/g, '\n').trim();
    
    const lines = sanitizedText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Sanitize headers
    const headers = lines[0].split(',').map(h => {
      const clean = h.trim().replace(/"/g, '');
      return sanitizeInput(clean);
    });

    // Validate headers contain only allowed characters
    const validHeaderPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    const invalidHeaders = headers.filter(h => !validHeaderPattern.test(h));
    if (invalidHeaders.length > 0) {
      throw new Error(`Invalid header names: ${invalidHeaders.join(', ')}. Headers must start with a letter and contain only letters, numbers, and underscores.`);
    }

    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => {
        const clean = v.trim().replace(/"/g, '');
        return sanitizeInput(clean);
      });
      
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          // Additional validation for specific field types
          if (header === 'email' && values[index]) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(values[index])) {
              values[index] = ''; // Clear invalid email
            }
          }
          
          if ((header === 'amount' || header === 'buyRate' || header === 'sellRate') && values[index]) {
            const numValue = parseFloat(values[index]);
            if (isNaN(numValue) || numValue < 0) {
              values[index] = '0'; // Default invalid numbers to 0
            }
          }
          
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setImportResult({
        success: false,
        message: 'Please select a valid CSV file.'
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        setImportResult({
          success: false,
          message: 'No valid data found in CSV file.'
        });
        return;
      }

      // Validate required fields based on type
      if (type === 'inventory') {
        const requiredFields = ['currency', 'amount', 'buyRate'];
        const missingFields = requiredFields.filter(field => 
          !data.every(row => row[field] !== undefined && row[field] !== '')
        );

        if (missingFields.length > 0) {
          setImportResult({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}. Required fields are: currency, amount, buyRate`
          });
          return;
        }
      } else if (type === 'customers' || type === 'clients') {
        const requiredFields = ['firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => 
          !data.every(row => row[field] !== undefined && row[field] !== '')
        );

        if (missingFields.length > 0) {
          setImportResult({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}. Required fields are: firstName, lastName`
          });
          return;
        }
      }

      await databaseService.importFromCSV(data, type);

      setImportResult({
        success: true,
        message: `Successfully imported ${data.length} ${type} records.`,
        recordsProcessed: data.length
      });

      // Call the completion callback and wait for it if it's async
      if (onImportComplete) {
        await Promise.resolve(onImportComplete());
      }

    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error importing data. Please check file format and try again.';
      setImportResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const getTemplateData = () => {
    if (type === 'inventory') {
      return {
        filename: 'inventory_template.csv',
        content: 'currency,amount,buyRate,sellRate\nUSD,10000,0.74,0.751\nEUR,5000,0.69,0.700\nGBP,3000,0.58,0.589',
        description: 'Upload inventory data with currencies, amounts, and exchange rates.'
      };
    } else if (type === 'clients') {
      return {
        filename: 'clients_template.csv',
        content: 'firstName,lastName,email,phone,dateOfBirth,occupation,address,city,postalCode,country,idType,idNumber\nJohn,Doe,john@example.com,555-0123,1990-01-15,Engineer,123 Main St,Toronto,M5V 3A8,Canada,drivers_license,D123456789\nJane,Smith,jane@example.com,555-0456,1985-05-20,Teacher,456 Oak Ave,Montreal,H3A 1A1,Canada,passport,P987654321',
        description: 'Upload client list with FINTRAC compliance information for existing customers.'
      };
    } else {
      return {
        filename: 'customers_template.csv',
        content: 'firstName,lastName,email,phone\nJohn,Doe,john@example.com,555-0123\nJane,Smith,jane@example.com,555-0456',
        description: 'Upload customer data with names and contact information.'
      };
    }
  };

  const downloadTemplate = () => {
    const template = getTemplateData();
    const blob = new Blob([template.content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const template = getTemplateData();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Import {type === 'inventory' ? 'Inventory' : type === 'clients' ? 'Client List' : 'Customers'} from CSV
        </h3>
        <button
          onClick={downloadTemplate}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Download Template
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {template.description}
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="hidden"
          id={`csv-upload-${type}`}
        />
        <label
          htmlFor={`csv-upload-${type}`}
          className={`cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center">
            {isImporting ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            ) : (
              <Upload className="h-8 w-8 text-gray-400 mb-3" />
            )}
            <p className="text-sm font-medium text-gray-900 mb-1">
              {isImporting ? 'Importing...' : 'Click to upload CSV file'}
            </p>
            <p className="text-xs text-gray-500">
              {isImporting ? 'Please wait while we process your data' : 'or drag and drop'}
            </p>
          </div>
        </label>
      </div>

      {importResult && (
        <div className={`mt-4 p-4 rounded-md ${
          importResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </p>
              <p className={`text-sm mt-1 ${
                importResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {importResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-800">CSV Format Requirements</p>
            <div className="text-xs text-blue-700 mt-1">
              {type === 'inventory' ? (
                <ul className="list-disc list-inside space-y-1">
                  <li>Required: currency, amount, buyRate</li>
                  <li>Optional: sellRate (auto-calculated if not provided)</li>
                  <li>Example: USD,10000,0.74,0.751</li>
                </ul>
              ) : type === 'clients' ? (
                <ul className="list-disc list-inside space-y-1">
                  <li>Required: firstName, lastName</li>
                  <li>Optional: email, phone, dateOfBirth, occupation, address, city, postalCode, country, idType, idNumber</li>
                  <li>For FINTRAC compliance - include as much information as available</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  <li>Required: firstName, lastName</li>
                  <li>Optional: email, phone</li>
                  <li>Example: John,Doe,john@example.com,555-0123</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImport;