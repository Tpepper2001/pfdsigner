import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client'; // Added this
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import './index.css'; // Make sure this imports your Tailwind styles

const App = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const sigCanvas = useRef({});

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfFile(e.target.result);
        setFileName(file.name);
        setSignedPdfUrl(null);
        setErrorMsg("");
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrorMsg("Please upload a valid PDF file.");
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const processPdf = async () => {
    if (!pdfFile) {
      setErrorMsg("Please upload a PDF first.");
      return;
    }
    if (sigCanvas.current.isEmpty()) {
      setErrorMsg("Please draw a signature first.");
      return;
    }

    try {
      const pdfDoc = await PDFDocument.load(pdfFile);
      const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      const signatureImageBytes = await fetch(signatureDataUrl).then((res) => res.arrayBuffer());
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width } = firstPage.getSize();
      const sigDims = signatureImage.scale(0.5); 

      firstPage.drawImage(signatureImage, {
        x: width - sigDims.width - 20,
        y: 20,
        width: sigDims.width,
        height: sigDims.height,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setSignedPdfUrl(url);
      setErrorMsg("");
      
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while creating the PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans text-gray-800">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-2">PDF Signer</h1>
        <p className="text-gray-600">Securely sign documents in your browser</p>
      </header>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {errorMsg}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">1. Upload Document</h2>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {fileName && <p className="mt-2 text-green-600 font-medium text-sm">Selected: {fileName}</p>}
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-700">2. Draw Signature</h2>
            <button onClick={clearSignature} className="text-sm text-red-500 hover:text-red-700 font-semibold underline">Clear</button>
          </div>
          <div className="border border-gray-300 rounded-lg bg-white overflow-hidden flex justify-center cursor-crosshair">
            <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ width: 500, height: 200, className: 'sigCanvas' }} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={processPdf}
            disabled={!pdfFile}
            className={`w-full py-3 px-6 rounded-lg text-white font-bold text-lg shadow-md transition-all duration-200 ${!pdfFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Sign PDF
          </button>

          {signedPdfUrl && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <h3 className="text-lg font-bold text-green-800 mb-2">Success!</h3>
              <a href={signedPdfUrl} download={`signed_${fileName}`} className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-md">Download Signed PDF</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- THIS PART REPLACES MAIN.JSX ---
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default App;
