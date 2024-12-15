// Common barcode formats and their validation patterns
const barcodePatterns = {
    ean13: /^[0-9]{13}$/,
    ean8: /^[0-9]{8}$/,
    upc: /^[0-9]{12}$/,
    code39: /^[A-Z0-9\-\.\ \$\/\+\%]+$/,
    code128: /^[\x00-\x7F]+$/,
  };
  
  export const validateBarcode = (barcode: string, format?: keyof typeof barcodePatterns): boolean => {
    if (!format) {
      // Try all formats if none specified
      return Object.values(barcodePatterns).some(pattern => pattern.test(barcode));
    }
    return barcodePatterns[format].test(barcode);
  };
  
  export const generateEAN13 = (): string => {
    // Generate first 12 digits
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += Math.floor(Math.random() * 10);
    }
    
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return code + checkDigit;
  };
  
  export const parseBarcode = (barcode: string) => {
    // Example implementation for EAN-13
    if (barcodePatterns.ean13.test(barcode)) {
      return {
        format: 'EAN-13',
        countryCode: barcode.slice(0, 3),
        manufacturerCode: barcode.slice(3, 7),
        productCode: barcode.slice(7, 12),
        checkDigit: barcode.slice(12),
        isValid: validateBarcode(barcode, 'ean13')
      };
    }
    
    return null;
  };