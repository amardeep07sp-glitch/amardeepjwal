import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

// Renders a scannable barcode/QR image on demand, straight from the value -
// no image is ever generated or stored server-side (see barcode.generator.js
// on the backend). Re-renders whenever the value/type changes.
const JSBARCODE_FORMAT_BY_TYPE = {
  code128: 'CODE128',
  code39: 'CODE39',
  ean13: 'EAN13',
  ean8: 'EAN8',
  upc: 'UPC',
};

export function BarcodeImage({ barcodeType, barcodeValue, className }) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const isQr = barcodeType === 'qr';

  useEffect(() => {
    if (!barcodeValue) return;

    if (isQr) {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, barcodeValue, { width: 160, margin: 1 }).catch(() => {});
      }
      return;
    }

    const format = JSBARCODE_FORMAT_BY_TYPE[barcodeType];
    if (svgRef.current && format) {
      try {
        JsBarcode(svgRef.current, barcodeValue, { format, height: 60, displayValue: true, fontSize: 12 });
      } catch {
        // Value doesn't fit the chosen format's constraints - leave blank
        // rather than crash the page.
      }
    }
  }, [barcodeType, barcodeValue, isQr]);

  if (isQr) {
    return <canvas ref={canvasRef} className={className} />;
  }
  return <svg ref={svgRef} className={className} />;
}
