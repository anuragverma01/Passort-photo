import React, { useEffect, useRef, useState } from "react";
import { initializeModel, processImage, getModelInfo } from "../lib/process";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./App.css";

export default function App() {
  const [image, setImage] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cropperRef = useRef<any>(null);
  const [isWebGPU, setIsWebGPU] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("running handleImageUpload");

    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);

      if (!image) {
        setIsLoading(true);
        try {
          const initialized = await initializeModel();
          if (!initialized) {
            throw new Error("Failed to initialize background removal model");
          }
          // Update WebGPU support status after model initialization
          const { isWebGPUSupported } = getModelInfo();
          setIsWebGPU(isWebGPUSupported);
        } catch (err) {
          console.error("Error initializing model:", err);
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
      }
    }
  };

  const cropImage = () => {
    console.log("running cropImage");
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      setCroppedImage(croppedCanvas.toDataURL("image/png"));
    }
  };

  const handleProcessImage = async () => {
    console.log("running handleProcessImage");
    if (!croppedImage) return;
    setIsProcessing(true); // Show loading state
    const blob = await fetch(croppedImage).then((r) => r.blob());
    const croppedFile = new File([blob], "cropped-image.png", {
      type: "image/png",
    });

    try {
      const result = await processImage(croppedFile);
      if (result?.processedFile) {
        const processedBlob = await fetch(
          URL.createObjectURL(result.processedFile)
        ).then((r) => r.blob());
        const processedCanvas = document.createElement("canvas");
        const ctx = processedCanvas.getContext("2d");

        if (ctx) {
          processedCanvas.width = 600;
          processedCanvas.height = 600;

          ctx.fillStyle = "#87CEEB"; // Light Sky Blue
          ctx.fillRect(0, 0, processedCanvas.width, processedCanvas.height);

          const img = new Image();
          img.src = URL.createObjectURL(processedBlob);
          img.onload = () => {
            ctx.drawImage(img, 0, 0, 600, 600);
            setProcessedImage(processedCanvas.toDataURL("image/png"));
            setIsProcessing(false);
          };
        } else {
          throw new Error("Failed to get canvas context");
        }
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading background removal model...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Upload an Image</h1>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="upload-input"
        />
      </div>

      {image && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="cropper-container">
            <h2>Crop Image</h2>
            <Cropper
              src={URL.createObjectURL(image)}
              style={{ height: 400, width: "100%" }}
              aspectRatio={1}
              guides={true}
              ref={cropperRef}
            />
          </div>
          <button onClick={cropImage} className="btn-crop">
            Crop Image
          </button>
        </div>
      )}

      <div className="image-view">
        {croppedImage && (
          <div className="cropped-image-container">
            <h2>Cropped Image</h2>
            <img src={croppedImage} alt="Cropped" className="cropped-image" />
            <button
              onClick={handleProcessImage}
              className={`btn-process ${isProcessing ? "disabled" : ""}`}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div style={{ display: "flex" }}>
                    <div className="loader-small"></div>
                    Processing...
                  </div>
                </>
              ) : (
                "Make Passport Size"
              )}
            </button>
          </div>
        )}

        {processedImage && (
          <div className="processed-image-container">
            <h2>Passport Size Photo</h2>
            <img
              src={processedImage}
              alt="Passport"
              className="passport-image"
            />
            <a
              href={processedImage}
              download="passport-size-photo.png"
              className="btn-download"
            >
              Download Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
