"use client";

import { useState, useRef, useCallback } from "react";
import axios from "axios";

type DocumentType = "auto" | "equation" | "table" | "resume" | "general";

interface ConversionResult {
  latexDocument: string;
  structureMetadata: Record<string, any>;
  confidence: number;
  documentType: string;
  processingDetails?: {
    imageUrl: string;
    documentTypeHint: string;
    processingTime: string;
  };
}

export default function ImageUploader() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("auto");
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError("Please select an image first");
      return;
    }

    try {
      setStatus("loading");
      setError(null);

      const formData = new FormData();
      formData.append("image", fileInputRef.current.files[0]);
      formData.append("documentType", documentType);

      const response = await axios.post("/api/convert", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setError(err.response?.data?.error || err.message || "Conversion failed");
      console.error("Conversion error:", err);
    }
  }, [documentType]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-black";
    if (confidence >= 0.6) return "text-black opacity-80";
    return "text-black opacity-60";
  };

  const downloadLatex = () => {
    if (!result) return;

    const blob = new Blob([result.latexDocument], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.tex";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white text-black">
      <div className="space-y-4">
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
            preview ? "border-black" : "border-gray-400 hover:border-black"
          } transition-colors`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {preview ? (
            <div className="relative aspect-video">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="py-12">
              <div className="text-gray-600 mb-2">
                Drag and drop an image here, or click to select
              </div>
              <div className="text-sm text-gray-500">
                Supported formats: PNG, JPEG, WebP
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Document Type:
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full rounded-md bg-white border border-gray-300 shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
              >
                <option value="auto">Auto-detect</option>
                <option value="equation">Mathematical Equations</option>
                <option value="table">Table/Structured Data</option>
                <option value="resume">Resume/CV</option>
                <option value="general">General Document</option>
              </select>
            </div>

            <div className="md:col-span-1 flex items-end">
              <button
                onClick={handleSubmit}
                disabled={status === "loading" || !preview}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  status === "loading" || !preview
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800 border border-black"
                }`}
              >
                {status === "loading" ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Converting...
                  </div>
                ) : (
                  "Convert to LaTeX"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-gray-100 border border-black rounded-lg text-black">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-black">
                Conversion Result
              </h3>
              <div className={`text-sm ${getConfidenceColor(result.confidence)}`}>
                {(result.confidence * 100).toFixed(1)}% confidence
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm px-3 py-1 bg-white hover:bg-gray-100 text-black border border-gray-300 rounded-md transition-colors"
              >
                {showDetails ? "Hide Details" : "Show Details"}
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="p-4 bg-white rounded-lg border border-gray-300 text-sm text-black">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Document Type: </span>
                  {result.documentType}
                </div>
                <div>
                  <span className="font-medium">Processing Time: </span>
                  {new Date(
                    result.processingDetails?.processingTime || ""
                  ).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Structure Metadata: </span>
                  <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto border border-gray-200">
                    {JSON.stringify(result.structureMetadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg overflow-hidden border border-gray-300">
            <div className="bg-gray-100 p-3 flex justify-between items-center">
              <span className="font-medium text-black">LaTeX Code</span>
              <div className="flex space-x-2">
                <button
                  onClick={downloadLatex}
                  className="text-sm px-3 py-1 bg-white hover:bg-gray-50 text-black border border-gray-300 rounded-md transition-colors flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.latexDocument);
                  }}
                  className="text-sm px-3 py-1 bg-white hover:bg-gray-50 text-black border border-gray-300 rounded-md transition-colors flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy
                </button>
              </div>
            </div>
            <div className="p-4 bg-white">
              <pre className="text-sm text-black whitespace-pre-wrap font-mono">
                {result.latexDocument}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}