"use client";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
  accept,
  value,
}: {
  onChange?: (files: File[]) => void;
  accept?: string;
  value?: File | null;
}) => {
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const files = value !== undefined ? (value ? [value] : []) : internalFiles;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setInternalFiles((prevFiles) => [...prevFiles, ...newFiles]);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    accept: accept ? { [accept]: [] } : undefined,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
  onClick={handleClick}
  whileHover="animate"
  className="group/file relative block w-full cursor-pointer rounded-lg p-0"
>
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept={accept}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2 w-full" style={{
  border: isDragActive ? "2px dashed rgba(201,74,58,0.6)" : "2px dashed rgba(245,240,232,0.15)",
  borderRadius: "8px",
  padding: "28px 20px",
  transition: "all 0.2s",
  background: isDragActive ? "rgba(255,255,255,0.04)" : "transparent",
}}>
  

  <div className="relative mx-auto mt-4 w-full max-w-xl">
    {files.length > 0 && files.map((file, idx) => (
      <motion.div
        key={"file" + idx}
        layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
        className="relative z-40 mx-auto mt-4 flex w-full items-center justify-between overflow-hidden rounded-md p-4 shadow-sm"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", height: "72px" }}
      >
        <div className="flex w-full items-center justify-between gap-4">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout
            className="truncate text-sm"
            style={{ color: "var(--text-cream)", fontFamily: "var(--font-sans)" }}>
            {file.name}
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout
            className="shrink-0 rounded px-2 py-0.5 text-xs"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </motion.p>
        </div>
      </motion.div>
    ))}

    {!files.length && (
  <motion.div
    layoutId="file-upload"
    variants={mainVariant}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="relative z-40 mx-auto mt-4 flex w-full items-center justify-center gap-3 rounded-md group-hover/file:shadow-2xl"
    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", height: "72px" }}
  >
    {isDragActive ? (
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-2"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
        <IconUpload className="h-4 w-4" style={{ color: "var(--accent-red)" }} />
        Drop it here
      </motion.p>
    ) : (
      <>
        <IconUpload className="h-4 w-4" style={{ color: "var(--accent-red)" }} />
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "14px", color: "var(--text-cream)" }}>
          Drag & drop your file here
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
          or click to browse
        </span>
      </>
    )}
  </motion.div>
)}

{!files.length && (
  <motion.div
    variants={secondaryVariant}
    className="absolute inset-0 z-30 mx-auto mt-4 w-full rounded-md opacity-0"
    style={{ border: "1px dashed var(--accent-red)", background: "transparent", height: "72px" }}
  />
)}
  </div>
</div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-x-px gap-y-px bg-gray-100 dark:bg-neutral-900">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`flex h-10 w-10 shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:bg-neutral-950 dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        }),
      )}
    </div>
  );
}
