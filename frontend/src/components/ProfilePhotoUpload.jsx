import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  UploadCloud,
  FolderOpen,
  FileType,
  HardDrive,
  ScanLine,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Check,
  ArrowRight,
  Video,
  VideoOff,
  RefreshCw,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import ImageCropper from './ImageCropper';
import ImagePreview from './ImagePreview';

export default function ProfilePhotoUpload({
  photoFile,
  photoPreviewUrl,
  onPhotoSelected,
  onPhotoRemoved,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRawImage, setSelectedRawImage] = useState(null); // Data URL or Object URL
  const [fileMeta, setFileMeta] = useState(null); // { name, sizeKb, width, height, type }
  const [capturedWithCamera, setCapturedWithCamera] = useState(false);
  const [validation, setValidation] = useState({
    formatOk: null,
    sizeOk: null,
    resolutionOk: null,
    orientationOk: null,
    allValid: false,
    errorMessage: '',
  });

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [videoDevices, setVideoDevices] = useState([]);

  const fileInputRef = useRef(null);
  const cropperRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Stop camera stream safely and release hardware
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping track:', e);
          }
        });
      } catch (err) {
        console.warn('Error getting tracks from stream:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
    setCameraError(null);
  }, []);

  // Ensure camera stream is stopped if component unmounts
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Safely bind live stream to video element when camera becomes active or DOM renders
  useEffect(() => {
    if (isCameraActive && !cameraError && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current
          .play()
          .catch((e) => console.warn('Delayed video playback:', e));
      }
    }
  }, [isCameraActive, cameraError, isCameraLoading]);

  // Request browser camera and initialize video stream
  const startCamera = async (requestedFacingMode = 'user') => {
    // 1. Check for browser support
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setIsCameraActive(true);
      setIsCameraLoading(false);
      setCameraError(
        'Camera access is not supported by your current browser or over insecure HTTP. Please use "Choose Photo" instead or run over localhost / HTTPS.'
      );
      return;
    }

    // Stop any previously running stream
    stopCameraStream();

    setIsCameraActive(true);
    setIsCameraLoading(true);
    setCameraError(null);
    setFacingMode(requestedFacingMode);

    try {
      const constraints = {
        video: {
          facingMode: requestedFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback for devices/browsers that reject complex facingMode/resolution constraints
        if (
          firstErr.name === 'OverconstrainedError' ||
          firstErr.name === 'ConstraintNotSatisfiedError'
        ) {
          console.warn('Falling back to basic video constraint:', firstErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw firstErr;
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play was delayed:', playErr);
        }
      }

      setIsCameraLoading(false);

      // Check available video devices for flipping camera (front/back on mobile)
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(videoInputs);
        } catch (devErr) {
          console.warn('Could not enumerate devices:', devErr);
        }
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsCameraLoading(false);

      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg =
          'Camera permission was denied. Please allow camera access in your browser settings (click the camera icon in your address bar) to take a photo.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg =
          'No camera device found on this system. Please connect a webcam or choose an existing photo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg =
          'Camera is currently in use by another application or video call. Please close other camera apps and try again.';
      } else if (err.name === 'OverconstrainedError') {
        msg = 'Camera does not satisfy requested video settings.';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
    }
  };

  // Toggle front/back camera if device supports multiple cameras
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  // Capture video frame into a portrait File and transition into crop workflow
  const captureFrameFromCamera = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    // Calculate center portrait 3:4 crop from video feed
    let cropW = vWidth;
    let cropH = vHeight;

    if (vWidth > vHeight * 0.75) {
      // Landscape or wide video (common for webcams): crop center horizontally
      cropW = Math.round(vHeight * 0.75);
      cropH = vHeight;
    } else {
      // Very tall video: crop center vertically
      cropW = vWidth;
      cropH = Math.round(vWidth / 0.75);
    }

    const startX = Math.max(0, Math.round((vWidth - cropW) / 2));
    const startY = Math.max(0, Math.round((vHeight - cropH) / 2));

    // Target dimensions matching valid portrait specification: 400 x 533 px
    const targetW = 400;
    const targetH = 533;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Mirror image horizontally if user/front camera for natural selfie view
    if (facingMode === 'user') {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, targetW, targetH);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedFile = new File([blob], `camera_photo_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          // Stop camera stream immediately
          stopCameraStream();
          setCapturedWithCamera(true);
          // Send into existing validation & crop flow
          inspectAndValidateFile(capturedFile);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  // Validate an image file and its dimensions
  const inspectAndValidateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const formatOk =
      allowedTypes.includes(file.type.toLowerCase()) ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.png');
    const sizeKb = Math.round(file.size / 1024);
    const sizeOk = sizeKb <= 600;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // Validation bounds according to portal specification:
        // Min resolution: 200 x 260
        // Max resolution: 530 x 690 (for input or cropped output)
        const resolutionOk = width >= 200 && height >= 260;
        const orientationOk = height >= width; // portrait

        let errorMsg = '';
        if (!formatOk) {
          errorMsg = 'Unsupported image format. Please upload a JPG, JPEG, or PNG image.';
        } else if (!sizeOk) {
          errorMsg = `File size is ${sizeKb} KB. Maximum allowed size is 600 KB.`;
        } else if (!resolutionOk) {
          errorMsg = 'Image resolution is too small. Minimum required is 200 × 260 pixels.';
        } else if (!orientationOk) {
          errorMsg = 'Please upload a portrait-oriented photograph or rotate inside frame.';
        }

        const allValid = formatOk && sizeOk && resolutionOk && orientationOk;

        setFileMeta({
          name: file.name,
          sizeKb,
          width,
          height,
          type: file.type || 'image/jpeg',
        });

        setValidation({
          formatOk,
          sizeOk,
          resolutionOk,
          orientationOk,
          allValid,
          errorMessage: errorMsg,
        });

        setSelectedRawImage(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCapturedWithCamera(false);
      inspectAndValidateFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCapturedWithCamera(false);
      inspectAndValidateFile(e.dataTransfer.files[0]);
    }
  };

  // Quick Sample generator (Valid Portrait & Invalid Test)
  const handleLoadSample = (isValid) => {
    setCapturedWithCamera(false);
    if (isValid) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 520;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 520);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 520);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(200, 180, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(200, 450, 180, Math.PI, 0, true);
      ctx.fill();
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#eff6ff';
      ctx.textAlign = 'center';
      ctx.fillText('STUDENT ID PHOTO', 200, 310);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'student_portrait.jpg', { type: 'image/jpeg' });
        inspectAndValidateFile(file);
      }, 'image/jpeg', 0.9);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800; // landscape
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(0, 0, 1200, 800);
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('LANDSCAPE INVALID SAMPLE (750 KB)', 600, 400);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'landscape_oversized.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 720 * 1024 });
        inspectAndValidateFile(file);
      }, 'image/jpeg', 0.85);
    }
  };

  // Open modal and immediately start camera when "Take Photo" is clicked
  const handleTakePhotoDirect = (e) => {
    if (e) e.stopPropagation();
    setIsModalOpen(true);
    setSelectedRawImage(null);
    setFileMeta(null);
    startCamera('user');
  };

  const handleRetake = () => {
    setSelectedRawImage(null);
    setFileMeta(null);
    setValidation({
      formatOk: null,
      sizeOk: null,
      resolutionOk: null,
      orientationOk: null,
      allValid: false,
      errorMessage: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (capturedWithCamera) {
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }
  };

  const handleCloseModal = () => {
    stopCameraStream();
    setIsModalOpen(false);
  };

  const handleConfirmCrop = async () => {
    if (!validation.allValid) return;

    try {
      if (cropperRef.current) {
        // Target: 400x508 portrait within the required 200x260 to 530x690 dimensions
        const { blob, dataUrl } = await cropperRef.current.getCroppedImageBlob(
          400,
          508,
          'image/jpeg',
          0.92
        );
        const fileName = (fileMeta?.name || 'student_profile.jpg').replace(/\.[^/.]+$/, '.jpg');
        const finalFile = new File([blob], fileName, { type: 'image/jpeg' });

        onPhotoSelected(finalFile, dataUrl);
        handleCloseModal();
      }
    } catch (err) {
      console.error('Failed to crop image:', err);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
        Profile Photo
      </label>

      {/* STATE 1: Empty state placeholder (Click to trigger Full-Screen Modal) */}
      {!photoPreviewUrl ? (
        <div className="w-full max-w-[170px] flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              stopCameraStream();
            }}
            className="group w-full aspect-[3/3.8] rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 transition-all duration-200 flex flex-col items-center justify-center p-3 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          >
            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-2">
              <Camera className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-xs font-bold text-blue-700 group-hover:text-blue-800">
              Upload Photo
            </span>
            <span className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">
              JPG, PNG (Max 600KB)
            </span>
          </button>

          {/* Quick Action Buttons on Form Card */}
          <div className="mt-2 flex items-center gap-1.5 w-full">
            <button
              type="button"
              id="take-photo-btn"
              onClick={handleTakePhotoDirect}
              className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-[11px] font-bold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take Photo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                stopCameraStream();
              }}
              className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      ) : (
        /* STATE 7: Photo uploaded preview state */
        <ImagePreview
          imageUrl={photoPreviewUrl}
          onChangePhoto={() => {
            setIsModalOpen(true);
            stopCameraStream();
          }}
          onRemovePhoto={onPhotoRemoved}
        />
      )}

      {/* ========================================================================= */}
      {/* FULL-SCREEN IMAGE UPLOAD & CROP INTERACTION MODAL (UI STATES 2-6)        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300">
          {/* Backdrop Blur & Darken */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
            onClick={handleCloseModal}
          ></div>

          {/* Centered Responsive Modal Container */}
          <div className="relative w-full h-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] pointer-events-auto">
              {/* Modal Top Bar */}
              <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Upload Profile Photo</h3>
                    <p className="text-xs text-slate-500">
                      Official student identity card & academic records photograph
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  type="button"
                  id="close-photo-modal-btn"
                  onClick={handleCloseModal}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              {/* Modal Body: Two column layout */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* LEFT COLUMN: Image Selection or Cropping Workspace */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 sm:p-6 min-h-[380px] sm:min-h-[440px] relative overflow-hidden">
                  {/* WORKSPACE STATE 1: Live Browser Camera Stream */}
                  {isCameraActive ? (
                    <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-200">
                      {/* Live Video Viewport Container (Portrait 3:4 Frame) */}
                      <div className="relative bg-slate-950 rounded-2xl shadow-xl overflow-hidden border border-slate-700 w-full max-w-[320px] aspect-[3/4] flex items-center justify-center">
                        {isCameraLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white z-20">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                            <span className="text-xs font-semibold tracking-wide">
                              Accessing camera...
                            </span>
                          </div>
                        )}

                        {cameraError ? (
                          <div className="p-6 text-center z-20 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                              <VideoOff className="w-6 h-6" />
                            </div>
                            <h5 className="text-sm font-bold text-white mb-1.5">Camera Error</h5>
                            <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">
                              {cameraError}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                id="retry-camera-btn"
                                onClick={() => startCamera(facingMode)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Allow / Retry Camera Access</span>
                              </button>
                              <button
                                type="button"
                                id="fallback-choose-photo-btn"
                                onClick={() => {
                                  stopCameraStream();
                                  fileInputRef.current?.click();
                                }}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Choose Photo Instead</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Live Video Element with mirror effect for front camera */}
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              onLoadedMetadata={() => {
                                videoRef.current
                                  ?.play()
                                  .catch((e) => console.warn('Autoplay caught:', e));
                              }}
                              className={`w-full h-full object-cover ${
                                facingMode === 'user' ? 'scale-x-[-1]' : ''
                              }`}
                            />

                            {/* 3x3 Composition Overlay */}
                            <div className="absolute inset-0 pointer-events-none crop-grid-overlay opacity-30"></div>

                            {/* Corner Guides */}
                            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white pointer-events-none"></div>
                            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white pointer-events-none"></div>
                            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white pointer-events-none"></div>
                            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white pointer-events-none"></div>

                            {/* Silhouette Face Guide */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                              <svg
                                className="w-40 h-52 stroke-white fill-none stroke-[1.5]"
                                viewBox="0 0 100 130"
                              >
                                <ellipse cx="50" cy="45" rx="25" ry="32"></ellipse>
                                <path d="M 20 120 C 20 90, 80 90, 80 120"></path>
                              </svg>
                            </div>

                            {/* Live Camera Badge */}
                            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-[10px] text-white font-medium px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 z-10">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Live Camera</span>
                            </div>

                            {/* Switch Camera Button if multiple devices available (mobile front/back) */}
                            {videoDevices.length > 1 && (
                              <button
                                type="button"
                                onClick={toggleFacingMode}
                                title="Switch Camera"
                                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm text-white p-2 rounded-full border border-white/20 transition-all cursor-pointer z-10"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Camera Control Actions Bar */}
                      {!cameraError && !isCameraLoading && (
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            type="button"
                            id="capture-photo-btn"
                            onClick={captureFrameFromCamera}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capture Photo</span>
                          </button>
                          <button
                            type="button"
                            id="cancel-camera-btn"
                            onClick={stopCameraStream}
                            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 rounded-xl transition-all cursor-pointer"
                          >
                            Cancel Camera
                          </button>
                        </div>
                      )}
                    </div>
                  ) : !selectedRawImage ? (
                    /* WORKSPACE STATE 2: Empty / Drop Area */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleFileDrop}
                      className={`w-full max-w-md h-full flex flex-col items-center justify-center border-2 border-dashed ${
                        isDraggingOver ? 'border-blue-500 bg-blue-50/30' : 'border-slate-300'
                      } hover:border-blue-500 rounded-2xl p-8 text-center transition-all bg-white shadow-sm`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8 stroke-[1.7]" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1">
                        Upload your profile photo
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mb-5">
                        Drag & drop your photo here, take a photo with your camera, or browse your files
                      </p>

                      {/* Hidden input file */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          id="modal-choose-photo-btn"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span>Choose Photo</span>
                        </button>
                        <button
                          type="button"
                          id="modal-take-photo-btn"
                          onClick={() => startCamera('user')}
                          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-blue-600" />
                          <span>Take Photo</span>
                        </button>
                      </div>

                      {/* Quick sample buttons to test states */}
                      <div className="mt-6 pt-5 border-t border-slate-100 w-full flex items-center justify-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">Quick sample:</span>
                        <button
                          type="button"
                          onClick={() => handleLoadSample(true)}
                          className="text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Valid Student Portrait
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadSample(false)}
                          className="text-[11px] font-bold text-rose-600 hover:underline bg-rose-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Invalid Size Test
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* WORKSPACE STATE 3: Crop & Edit Workspace */
                    <ImageCropper
                      ref={cropperRef}
                      imageSrc={selectedRawImage}
                    />
                  )}
                </div>

                {/* RIGHT COLUMN: Guidelines, Real-time Validation & File Specs */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Photo Specifications
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Required for official university registry, examination hall tickets, and smart campus badges.
                    </p>

                    {/* Live Validation Card (STATES 5 & 6) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-700">Pre-flight Checklist</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            !fileMeta
                              ? 'bg-slate-200 text-slate-700'
                              : validation.allValid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {!fileMeta
                            ? 'Awaiting Image'
                            : validation.allValid
                            ? 'All Valid'
                            : 'Action Required'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {/* Rule 1: Format */}
                        <div
                          className={`flex items-center justify-between font-medium ${
                            validation.formatOk === null
                              ? 'text-slate-600'
                              : validation.formatOk
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <FileType className="w-3.5 h-3.5 text-slate-400" />
                            <span>Format (JPG, JPEG, PNG)</span>
                          </span>
                          <span className="font-semibold text-slate-400">
                            {validation.formatOk === null ? (
                              '—'
                            ) : validation.formatOk ? (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                                <Check className="w-3.5 h-3.5" /> JPG/PNG
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-rose-600">
                                <AlertCircle className="w-3.5 h-3.5" /> Unsupported
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Rule 2: File size <= 600 KB */}
                        <div
                          className={`flex items-center justify-between font-medium ${
                            validation.sizeOk === null
                              ? 'text-slate-600'
                              : validation.sizeOk
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                            <span>Size (Max 600 KB)</span>
                          </span>
                          <span className="font-semibold text-slate-400">
                            {validation.sizeOk === null ? (
                              '—'
                            ) : validation.sizeOk ? (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                                <Check className="w-3.5 h-3.5" /> {fileMeta?.sizeKb} KB
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-rose-600">
                                <AlertCircle className="w-3.5 h-3.5" /> {fileMeta?.sizeKb} KB
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Rule 3: Resolution */}
                        <div
                          className={`flex items-center justify-between font-medium ${
                            validation.resolutionOk === null
                              ? 'text-slate-600'
                              : validation.resolutionOk
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ScanLine className="w-3.5 h-3.5 text-slate-400" />
                            <span>Resolution (200x260 to 530x690)</span>
                          </span>
                          <span className="font-semibold text-slate-400">
                            {validation.resolutionOk === null ? (
                              '—'
                            ) : validation.resolutionOk ? (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                                <Check className="w-3.5 h-3.5" /> {fileMeta?.width}×{fileMeta?.height} px
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-rose-600">
                                <AlertCircle className="w-3.5 h-3.5" /> {fileMeta?.width}×{fileMeta?.height} px
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Rule 4: Portrait orientation */}
                        <div
                          className={`flex items-center justify-between font-medium ${
                            validation.orientationOk === null
                              ? 'text-slate-600'
                              : validation.orientationOk
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            <span>Portrait Orientation</span>
                          </span>
                          <span className="font-semibold text-slate-400">
                            {validation.orientationOk === null ? (
                              '—'
                            ) : validation.orientationOk ? (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                                <Check className="w-3.5 h-3.5" /> Portrait
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-rose-600">
                                <AlertCircle className="w-3.5 h-3.5" /> Landscape
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Error Warning Alert Box */}
                      {validation.errorMessage && (
                        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                          <span>{validation.errorMessage}</span>
                        </div>
                      )}

                      {/* Success Box */}
                      {validation.allValid && (
                        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                          <div>
                            <span className="font-bold">Photo verified!</span> All identity portal standards met.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* General Rules List */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-600 pl-1">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        <span>Clear, front-facing eye-level photograph</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        <span>Single person with plain or light background</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        <span>Neutral facial expression or gentle smile</span>
                      </div>
                    </div>
                  </div>

                  {/* Upload File Details Summary when file loaded */}
                  {fileMeta && (
                    <div className="text-xs text-slate-500 font-mono bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                      <div className="flex justify-between">
                        <span>File:</span>
                        <span className="text-slate-800 font-semibold truncate max-w-[170px]">
                          {fileMeta.name}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Dimensions:</span>
                        <span className="text-slate-800">{fileMeta.width} × {fileMeta.height} px</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>File Size:</span>
                        <span className="text-slate-800">{fileMeta.sizeKb} KB</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  id="modal-cancel-btn"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  {selectedRawImage && (
                    <button
                      type="button"
                      id="retake-photo-btn"
                      onClick={handleRetake}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>{capturedWithCamera ? 'Retake Photo' : 'Choose Another Photo'}</span>
                    </button>
                  )}
                  {/* Primary Confirm Button */}
                  <button
                    type="button"
                    id="use-this-photo-btn"
                    disabled={!validation.allValid}
                    onClick={handleConfirmCrop}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Use This Photo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
