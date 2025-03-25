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
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("auto");
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setStatus("idle");
        setError(null);
      }
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(file));
        if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
        }
        setResult(null);
        setStatus("idle");
        setError(null);
      } else {
        setError("Please upload an image file");
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (confidence >= 0.8) return "text-green-400";
    if (confidence >= 0.6) return "text-amber-400";
    return "text-red-400";
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
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-100 mb-4">
            Upload Your Image
          </h3>

          <div
            className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors ${
              preview
                ? "border-white bg-gray-700"
                : "border-gray-600 hover:border-white hover:bg-gray-700"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="flex flex-col items-center">
                <img
                  src={preview}
                  alt="preview"
                  className="max-w-full max-h-[300px] object-contain mb-4 rounded-md shadow-sm"
                />
                <span className="text-sm text-gray-400">
                  Click or drag to replace
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  className="w-12 h-12 text-gray-500 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-300 font-medium mb-2">
                  Drag and drop your image here
                </p>
                <p className="text-gray-500 text-sm">
                  or click to browse files
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Type:
              </label>
              <select
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value as DocumentType)
                }
                className="w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-colors"
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
                className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${
                  status === "loading" || !preview
                    ? "bg-gray-700 opacity-50 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black border border-gray-600"
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
        <div className="p-4 bg-red-900/30 border-l-4 border-red-500 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-lg font-medium text-gray-100">
                LaTeX Output
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-gray-300">
                    Type:
                  </span>
                  <span className="text-sm capitalize text-gray-200">
                    {result.documentType}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-gray-300">
                    Confidence:
                  </span>
                  <span
                    className={`text-sm ${getConfidenceColor(
                      result.confidence
                    )}`}
                  >
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white hover:text-gray-200 rounded-full transition-colors"
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>
              </div>
            </div>

            {showDetails && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <h4 className="font-medium text-gray-200 mb-3">
                  Document Structure
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ul className="space-y-2">
                      {result.structureMetadata.hasTables && (
                        <li className="flex items-center text-sm text-gray-300">
                          <svg
                            className="w-4 h-4 mr-2 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Contains tables
                        </li>
                      )}
                      {result.structureMetadata.hasEquations && (
                        <li className="flex items-center text-sm text-gray-300">
                          <svg
                            className="w-4 h-4 mr-2 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Contains equations
                        </li>
                      )}
                      {result.structureMetadata.hasLists && (
                        <li className="flex items-center text-sm text-gray-300">
                          <svg
                            className="w-4 h-4 mr-2 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Contains lists
                        </li>
                      )}
                      <li className="flex items-center text-sm text-gray-300">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Layout: {result.structureMetadata.layout || "simple"}
                      </li>
                    </ul>
                  </div>
                  {result.processingDetails && (
                    <div>
                      <h4 className="font-medium text-gray-200 mb-2">
                        Processing Details
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start text-sm text-gray-300">
                          <span className="font-medium mr-2">
                            Document Type Hint:
                          </span>
                          <span>
                            {result.processingDetails.documentTypeHint}
                          </span>
                        </li>
                        <li className="flex items-start text-sm text-gray-300">
                          <span className="font-medium mr-2">
                            Processing Time:
                          </span>
                          <span>
                            {new Date(
                              result.processingDetails.processingTime
                            ).toLocaleString()}
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg overflow-hidden border border-gray-600">
              <div className="bg-gray-700 p-3 flex justify-between items-center">
                <span className="font-medium text-gray-200">LaTeX Code</span>
                <div className="flex space-x-2">
                  <button
                    onClick={downloadLatex}
                    className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md transition-colors flex items-center"
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
                      const notification = document.createElement("div");
                      notification.className =
                        "fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg border border-gray-700";
                      notification.textContent = "LaTeX copied to clipboard!";
                      document.body.appendChild(notification);
                      setTimeout(() => {
                        notification.remove();
                      }, 2000);
                    }}
                    className="text-sm px-3 py-1 bg-black hover:bg-gray-900 text-white rounded-md transition-colors flex items-center"
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
              <div className="relative">
                <pre className="p-4 overflow-x-auto bg-gray-900 text-sm text-gray-300 max-h-[400px]">
                  {result.latexDocument}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}