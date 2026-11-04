"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Upload, Loader2, X } from "lucide-react";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
  folder?: string;
}

export function ImageUpload({ currentImageUrl, onUploadComplete, folder = "profiles" }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setImageUrl(data.url);
      onUploadComplete(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-vena-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setImageUrl(null);
              onUploadComplete("");
            }}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-32 h-32 rounded-full border-2 border-dashed border-vena-200 flex items-center justify-center cursor-pointer hover:bg-vena-50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-vena-500" />
          ) : (
            <Upload className="h-6 w-6 text-charcoal-muted" />
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}