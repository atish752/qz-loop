"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Tesseract from "tesseract.js";
import { parseQuestionAndOptions, ParsedQuestion } from "@/lib/utils/ocrParser";

interface QuestionScannerProps {
  onParsedQuestion: (parsed: ParsedQuestion) => void;
  lang?: "en" | "hi";
}

export const QuestionScanner: React.FC<QuestionScannerProps> = ({
  onParsedQuestion,
  lang = "en",
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastScannedPreview, setLastScannedPreview] = useState<string | null>(null);
  const [extractedSnippet, setExtractedSnippet] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop media stream on unmount
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    // Auto-prompt camera access upon switching to Smart Scan Question
    if (typeof window !== "undefined" && Boolean(navigator?.mediaDevices)) {
      startCamera("environment");
    }
    return () => {
      stopCameraStream();
    };
  }, []);

  // Synchronize stream with videoRef whenever camera becomes active or video mounts
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.muted = true;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  // Multi-level fallback cascade for camera stream
  const startCamera = async (mode: "environment" | "user" = facingMode) => {
    setErrorMessage(null);
    try {
      stopCameraStream();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          lang === "hi"
            ? "आपके ब्राउज़र में कैमरा समर्थित नहीं है। कृपया फ़ोटो चुनें या कैमरा ऐप से लें।"
            : "Camera access is not supported by your browser. Please use native camera or upload."
        );
      }

      let stream: MediaStream | null = null;
      let lastErr: unknown = null;

      // 1. Level 1: Preferred facing mode with high resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (err1) {
        lastErr = err1;
      }

      // 2. Level 2: Preferred facing mode without resolution constraints
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: mode } },
            audio: false,
          });
        } catch (err2) {
          lastErr = err2;
        }
      }

      // 3. Level 3: Reverse facing mode (user webcam or desktop camera fallback)
      if (!stream) {
        try {
          const alternateMode = mode === "environment" ? "user" : "environment";
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: alternateMode } },
            audio: false,
          });
        } catch (err3) {
          lastErr = err3;
        }
      }

      // 4. Level 4: Simple video true fallback
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err4) {
          lastErr = err4;
        }
      }

      if (!stream) {
        throw lastErr || new Error("Failed to start video stream");
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setFacingMode(mode);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to access camera";
      const isPermission = msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowedError");
      const isOverconstrained = msg.includes("OverconstrainedError") || msg.includes("ConstraintNotSatisfied");
      
      setErrorMessage(
        isPermission
          ? lang === "hi"
            ? "कैमरा अनुमति अस्वीकृत हुई। 'कैमरा ऐप (Shutter)' बटन दबाकर सीधे अपने फोन के कैमरे से फोटो खींचें।"
            : "Camera permission denied or restricted. Tap 'Camera App (Shutter)' to capture directly with phone camera."
          : isOverconstrained
          ? lang === "hi"
            ? "कैमरा रिज़ॉल्यूशन समर्थित नहीं है। नीचे दिए गए कैमरा ऐप बटन से फोटो लें।"
            : "Camera resolution not supported. Please tap 'Camera App (Shutter)' to capture."
          : msg
      );
      setIsCameraActive(false);
    }
  };

  // Toggle Camera Facing
  const toggleCameraFacing = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    startCamera(nextMode);
  };

  // Pre-process Canvas for Maximum OCR Accuracy
  const optimizeCanvasForOcr = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = sourceCanvas.getContext("2d");
    if (!ctx) return sourceCanvas;

    const imgData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const d = imgData.data;

    // Convert to high-contrast grayscale to make textbook letters sharp
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Contrast stretch
      const threshold = avg > 128 ? Math.min(255, avg * 1.1) : Math.max(0, avg * 0.9);
      d[i] = threshold;
      d[i + 1] = threshold;
      d[i + 2] = threshold;
    }
    ctx.putImageData(imgData, 0, 0);
    return sourceCanvas;
  };

  // Run OCR on Canvas
  const processImageCanvas = async (canvas: HTMLCanvasElement) => {
    setIsProcessing(true);
    setProgressStatus(lang === "hi" ? "टेक्स्ट पहचान रहे हैं..." : "Recognizing textbook text (0%)...");
    setErrorMessage(null);

    try {
      const optimizedCanvas = optimizeCanvasForOcr(canvas);
      const previewDataUrl = optimizedCanvas.toDataURL("image/jpeg", 0.85);
      setLastScannedPreview(previewDataUrl);

      // Recognize text client-side without superbase / backend egress
      const ocrLang = lang === "hi" ? "hin+eng" : "eng";
      let result;
      try {
        result = await Tesseract.recognize(optimizedCanvas, ocrLang, {
          logger: (m) => {
            if (m.status === "recognizing text" && typeof m.progress === "number") {
              const pct = Math.round(m.progress * 100);
              setProgressStatus(
                lang === "hi"
                  ? `टेक्स्ट पहचान रहे हैं (${pct}%)...`
                  : `Extracting text (${pct}%)...`
              );
            }
          },
        });
      } catch {
        result = await Tesseract.recognize(optimizedCanvas, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text" && typeof m.progress === "number") {
              const pct = Math.round(m.progress * 100);
              setProgressStatus(`Extracting text (${pct}%)...`);
            }
          },
        });
      }

      const extractedText = result.data?.text || "";
      if (!extractedText.trim()) {
        throw new Error(
          lang === "hi"
            ? "छवि में कोई स्पष्ट टेक्स्ट नहीं मिला। कृपया बेहतर प्रकाश में दोबारा स्कैन करें।"
            : "No readable text detected. Please ensure good lighting and clear alignment."
        );
      }

      setExtractedSnippet(extractedText.slice(0, 180) + (extractedText.length > 180 ? "..." : ""));

      // Smart parse into Question, Options A/B/C/D, Correct Answer, Explanation
      const parsed = parseQuestionAndOptions(extractedText);
      onParsedQuestion(parsed);

      // Stop camera once captured
      stopCameraStream();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OCR Extraction failed";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setProgressStatus("");
    }
  };

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 5,
    y: 12,
    width: 90,
    height: 72,
  });
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{
    clientX: number;
    clientY: number;
    box: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);

  // Capture Frame from Live Video -> Go to interactive crop step
  const handleCaptureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    stopCameraStream();
    setCropImageSrc(dataUrl);
    setCropBox({ x: 5, y: 12, width: 90, height: 72 });
    setIsCropping(true);
  };

  // Upload Photo / File Fallback -> Go to interactive crop step
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      stopCameraStream();
      setCropImageSrc(dataUrl);
      setCropBox({ x: 5, y: 12, width: 90, height: 72 });
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = "";
  };

  // Pointer drag events for interactive cropping
  const handlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    setDragHandle(handle);
    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox },
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragHandle || !dragStart || !cropContainerRef.current) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = ((e.clientX - dragStart.clientX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.clientY) / rect.height) * 100;

    const minSize = 10;
    let { x, y, width, height } = dragStart.box;

    if (dragHandle === "box") {
      x = Math.max(0, Math.min(100 - width, x + deltaX));
      y = Math.max(0, Math.min(100 - height, y + deltaY));
    } else if (dragHandle === "nw") {
      const newX = Math.max(0, Math.min(dragStart.box.x + dragStart.box.width - minSize, x + deltaX));
      const newY = Math.max(0, Math.min(dragStart.box.y + dragStart.box.height - minSize, y + deltaY));
      width = dragStart.box.x + dragStart.box.width - newX;
      height = dragStart.box.y + dragStart.box.height - newY;
      x = newX;
      y = newY;
    } else if (dragHandle === "ne") {
      const newY = Math.max(0, Math.min(dragStart.box.y + dragStart.box.height - minSize, y + deltaY));
      width = Math.max(minSize, Math.min(100 - x, dragStart.box.width + deltaX));
      height = dragStart.box.y + dragStart.box.height - newY;
      y = newY;
    } else if (dragHandle === "sw") {
      const newX = Math.max(0, Math.min(dragStart.box.x + dragStart.box.width - minSize, x + deltaX));
      width = dragStart.box.x + dragStart.box.width - newX;
      height = Math.max(minSize, Math.min(100 - y, dragStart.box.height + deltaY));
      x = newX;
    } else if (dragHandle === "se") {
      width = Math.max(minSize, Math.min(100 - x, dragStart.box.width + deltaX));
      height = Math.max(minSize, Math.min(100 - y, dragStart.box.height + deltaY));
    } else if (dragHandle === "n") {
      const newY = Math.max(0, Math.min(dragStart.box.y + dragStart.box.height - minSize, y + deltaY));
      height = dragStart.box.y + dragStart.box.height - newY;
      y = newY;
    } else if (dragHandle === "s") {
      height = Math.max(minSize, Math.min(100 - y, dragStart.box.height + deltaY));
    } else if (dragHandle === "w") {
      const newX = Math.max(0, Math.min(dragStart.box.x + dragStart.box.width - minSize, x + deltaX));
      width = dragStart.box.x + dragStart.box.width - newX;
      x = newX;
    } else if (dragHandle === "e") {
      width = Math.max(minSize, Math.min(100 - x, dragStart.box.width + deltaX));
    }

    setCropBox({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
    });
  };

  const handlePointerUp = () => {
    setDragHandle(null);
    setDragStart(null);
  };

  // Confirm Crop and trigger OCR extraction on cropped area
  const handleConfirmCrop = () => {
    if (!cropImageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const cropX = Math.max(0, Math.round((cropBox.x / 100) * img.naturalWidth));
      const cropY = Math.max(0, Math.round((cropBox.y / 100) * img.naturalHeight));
      const cropW = Math.max(10, Math.min(img.naturalWidth - cropX, Math.round((cropBox.width / 100) * img.naturalWidth)));
      const cropH = Math.max(10, Math.min(img.naturalHeight - cropY, Math.round((cropBox.height / 100) * img.naturalHeight)));

      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      setIsCropping(false);
      setCropImageSrc(null);
      processImageCanvas(canvas);
    };
    img.src = cropImageSrc;
  };

  // Cancel Crop and return to camera viewfinder
  const handleCancelCrop = () => {
    setIsCropping(false);
    setCropImageSrc(null);
    startCamera("environment");
  };

  return (
    <div className="w-full bg-surface-container-low rounded-2xl border border-primary/25 p-3.5 shadow-sm flex flex-col gap-3">
      {/* Hidden offscreen canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={nativeCameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <span className="material-symbols-outlined text-[19px]">document_scanner</span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-xs sm:text-sm text-on-surface">
              {lang === "hi" ? "स्मार्ट क्वेश्चन स्कैनर (OCR)" : "Smart Question Scanner (OCR)"}
            </h3>
            <span className="text-[10px] text-secondary">
              {lang === "hi"
                ? "किताब या प्रश्न बैंक से प्रश्न और विकल्पों को 5 सेकंड में स्कैन करें"
                : "Scan textbook MCQs & options directly into the form in 5 seconds"}
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
          Zero DB Reads
        </span>
      </div>

      {/* Crop Mode Interface vs Camera Viewfinder */}
      {isCropping && cropImageSrc ? (
        <div className="flex flex-col gap-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/50">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">crop</span>
              <span className="font-bold text-xs sm:text-sm text-on-surface">
                {lang === "hi" ? "प्रश्न और विकल्पों को क्रॉप करें" : "Crop Question & Options"}
              </span>
            </div>
            <span className="text-[10px] text-primary font-bold bg-primary-fixed/30 px-2 py-0.5 rounded-full">
              {lang === "hi" ? "सटीक क्रॉप" : "Precise Selection"}
            </span>
          </div>

          <p className="text-[11px] text-secondary leading-snug">
            {lang === "hi"
              ? "कोनों को खींचकर केवल प्रश्न और 4 विकल्पों को चुनें। ऊपर का स्टेटस बार या अन्य प्रश्न बाहर रखें।"
              : "Drag corners to select strictly the question text and 4 options. Exclude app headers, browser bars, and other questions."}
          </p>

          {/* Interactive Crop Container with tight inline-block image wrapper */}
          <div className="w-full overflow-hidden rounded-2xl border-2 border-primary/40 bg-black/95 flex items-center justify-center min-h-[240px] max-h-[440px] p-2">
            <div
              ref={cropContainerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative inline-block select-none max-w-full max-h-[400px]"
              style={{ touchAction: "none" }}
            >
              {/* Source Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImageRef}
                src={cropImageSrc}
                alt="To Crop"
                className="block max-h-[400px] max-w-full w-auto h-auto rounded select-none pointer-events-none"
              />

            {/* Shaded Mask: Dims areas outside crop box */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "rgba(0, 0, 0, 0.65)",
                clipPath: `polygon(
                  0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                  ${cropBox.x}% ${cropBox.y}%,
                  ${cropBox.x}% ${cropBox.y + cropBox.height}%,
                  ${cropBox.x + cropBox.width}% ${cropBox.y + cropBox.height}%,
                  ${cropBox.x + cropBox.width}% ${cropBox.y}%,
                  ${cropBox.x}% ${cropBox.y}%
                )`,
              }}
            />

            {/* Active Crop Box with Grid & Touch Drag Handles */}
            <div
              onPointerDown={(e) => handlePointerDown("box", e)}
              className="absolute border-2 border-primary rounded cursor-move shadow-[0_0_15px_rgba(83,0,183,0.5)] flex flex-col justify-between"
              style={{
                left: `${cropBox.x}%`,
                top: `${cropBox.y}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
                touchAction: "none",
              }}
            >
              {/* Rule of Thirds Grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div />
              </div>

              {/* Center Hint Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="px-2 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-mono tracking-wider font-semibold backdrop-blur-xs shadow-sm">
                  {lang === "hi" ? "प्रश्न + 4 विकल्प" : "Question & Options"}
                </span>
              </div>

              {/* 4 Corner Touch Drag Handles */}
              <div
                onPointerDown={(e) => handlePointerDown("nw", e)}
                className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-white border-2 border-primary shadow-md cursor-nwse-resize flex items-center justify-center touch-none z-10 hover:scale-110 active:scale-125 transition-transform"
                title="Resize top-left"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div
                onPointerDown={(e) => handlePointerDown("ne", e)}
                className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white border-2 border-primary shadow-md cursor-nesw-resize flex items-center justify-center touch-none z-10 hover:scale-110 active:scale-125 transition-transform"
                title="Resize top-right"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div
                onPointerDown={(e) => handlePointerDown("sw", e)}
                className="absolute -bottom-3 -left-3 w-7 h-7 rounded-full bg-white border-2 border-primary shadow-md cursor-nesw-resize flex items-center justify-center touch-none z-10 hover:scale-110 active:scale-125 transition-transform"
                title="Resize bottom-left"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div
                onPointerDown={(e) => handlePointerDown("se", e)}
                className="absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-white border-2 border-primary shadow-md cursor-nwse-resize flex items-center justify-center touch-none z-10 hover:scale-110 active:scale-125 transition-transform"
                title="Resize bottom-right"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>

              {/* Edge Handles */}
              <div
                onPointerDown={(e) => handlePointerDown("n", e)}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-white border border-primary shadow cursor-ns-resize touch-none z-10"
              />
              <div
                onPointerDown={(e) => handlePointerDown("s", e)}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-white border border-primary shadow cursor-ns-resize touch-none z-10"
              />
              <div
                onPointerDown={(e) => handlePointerDown("w", e)}
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-8 rounded-full bg-white border border-primary shadow cursor-ew-resize touch-none z-10"
              />
              <div
                onPointerDown={(e) => handlePointerDown("e", e)}
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-8 rounded-full bg-white border border-primary shadow cursor-ew-resize touch-none z-10"
              />
            </div>

            {/* Processing Spinner Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-white tracking-wide">{progressStatus}</p>
                <p className="text-[10px] text-white/60">
                  {lang === "hi"
                    ? "स्मार्ट पार्सर प्रश्न और विकल्पों को अलग कर रहा है..."
                    : "Extracting cropped question and options..."}
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Quick Crop Presets */}
          <div className="flex items-center justify-between gap-1 text-[11px] px-0.5">
            <span className="text-secondary font-medium">{lang === "hi" ? "त्वरित विकल्प:" : "Presets:"}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCropBox({ x: 2, y: 15, width: 96, height: 75 })}
                className="px-2 py-0.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface text-[10px] font-semibold"
              >
                {lang === "hi" ? "शीर्ष छोड़ें (Skip Header)" : "Skip Header"}
              </button>
              <button
                type="button"
                onClick={() => setCropBox({ x: 3, y: 8, width: 94, height: 84 })}
                className="px-2 py-0.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface text-[10px] font-semibold"
              >
                {lang === "hi" ? "रीसेट" : "Default"}
              </button>
              <button
                type="button"
                onClick={() => setCropBox({ x: 0, y: 0, width: 100, height: 100 })}
                className="px-2 py-0.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface text-[10px] font-semibold"
              >
                {lang === "hi" ? "पूरी फोटो" : "Full View"}
              </button>
            </div>
          </div>

          {/* Prominent Action Buttons: Confirm Crop & Extract, Skip Header, Re-take / Cancel */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmCrop}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[19px]">crop</span>
              <span>{lang === "hi" ? "क्रॉप करें और टेक्स्ट निकालें" : "Confirm Crop & Extract"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setCropBox({ x: 2, y: 16, width: 96, height: 74 })}
                className="flex-1 py-2.5 px-3 rounded-xl bg-surface-container border border-primary/30 hover:bg-surface-container-high text-primary font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[17px]">vertical_align_bottom</span>
                <span>{lang === "hi" ? "शीर्ष छोड़ें (Skip Header)" : "Skip Header"}</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCancelCrop}
                className="py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary hover:text-on-surface font-semibold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
                <span>{lang === "hi" ? "रद्द / दोबारा लें" : "Re-take / Cancel"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Horizontal Camera Viewfinder Window */}
          <div className="relative w-full h-44 sm:h-52 bg-black/95 rounded-2xl overflow-hidden border border-surface-container-high/60 flex items-center justify-center shadow-inner">
            {/* Live Video Element: Always mounted to guarantee videoRef.current is never null */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
            />

            {isCameraActive ? (
              <>
                {/* Horizontal Alignment Reticle & Scanning Laser */}
                <div className="absolute inset-3 border-2 border-primary/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between items-start">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
                    <span className="w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
                  </div>
                  <div className="text-center">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs tracking-wider uppercase font-semibold">
                      {lang === "hi" ? "प्रश्न व विकल्पों को फ्रेम में रखें" : "Align Question & Options in Frame"}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
                    <span className="w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
                  </div>
                </div>

                {/* Animated Laser Bar */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-[0_0_8px_rgba(83,0,183,0.8)] pointer-events-none" />

                {/* Camera Floating Controls */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center backdrop-blur-xs transition-colors"
                    title="Switch Camera"
                  >
                    <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center backdrop-blur-xs transition-colors"
                    title="Close Camera"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </>
            ) : (
              /* Idle Viewfinder State */
              <div className="flex flex-col items-center justify-center p-4 text-center gap-2 text-white/80">
                {lastScannedPreview ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lastScannedPreview}
                      alt="Scanned Preview"
                      className="w-full h-full object-cover opacity-60 rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2">
                      <span className="material-symbols-outlined text-emerald-400 text-[28px] mb-1">
                        check_circle
                      </span>
                      <p className="text-xs font-bold text-white">
                        {lang === "hi" ? "प्रश्न सफलता से निकाला गया!" : "Textbook Question Extracted!"}
                      </p>
                      <p className="text-[10px] text-white/80 max-w-xs mt-0.5">
                        {lang === "hi"
                          ? "नीचे फॉर्म में प्रश्न व विकल्प भरे गए हैं। सही विकल्प चुनें और प्रकाशित करें।"
                          : "Form fields below are populated. Choose the correct option and publish."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary-fixed mb-1">
                      <span className="material-symbols-outlined text-[28px]">photo_camera</span>
                    </div>
                    <p className="text-xs font-semibold text-white/90">
                      {lang === "hi"
                        ? "किताब या नोट्स से प्रश्न स्कैन करने के लिए कैमरा खोलें"
                        : "Open horizontal camera to scan printed MCQs from textbook"}
                    </p>
                    <p className="text-[10px] text-white/60 max-w-xs leading-relaxed">
                      {lang === "hi"
                        ? "OCR प्रश्न और 4 विकल्पों (A, B, C, D) को पहचान कर अपने आप फॉर्म में भर देगा"
                        : "Smart OCR splits the prompt and 4 options (A, B, C, D) automatically"}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Processing Spinner Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-white tracking-wide">{progressStatus}</p>
                <p className="text-[10px] text-white/60">
                  {lang === "hi"
                    ? "स्मार्ट पार्सर प्रश्न और विकल्पों को अलग कर रहा है..."
                    : "Smart heuristic parser is splitting question and options..."}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {isCameraActive ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCaptureFromCamera}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
                <span>{lang === "hi" ? "कैप्चर और स्कैन करें" : "Capture & Extract Text"}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => startCamera("environment")}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                <span>{lang === "hi" ? "कैमरा खोलें" : "Open Camera"}</span>
              </button>
            )}

            {/* 100% Reliable Native Mobile Shutter Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => nativeCameraInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
              title="Direct native device camera shutter"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera_back</span>
              <span>{lang === "hi" ? "कैमरा ऐप (Shutter)" : "Camera App (Native)"}</span>
            </button>

            {/* File / Gallery Upload Fallback */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-surface-container font-semibold text-xs text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 shrink-0"
              title="Pick image from gallery"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">image</span>
              <span>{lang === "hi" ? "फ़ोटो चुनें" : "Pick Photo"}</span>
            </button>
          </div>
        </>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Extracted snippet badge */}
      {extractedSnippet && !isProcessing && (
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 text-[11px] flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
            check_circle
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-bold block">
              {lang === "hi" ? "सफलतापूर्वक निकाला गया:" : "Successfully Extracted:"}
            </span>
            <p className="line-clamp-2 text-[10px] opacity-90 mt-0.5 italic font-mono">
              &quot;{extractedSnippet}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
