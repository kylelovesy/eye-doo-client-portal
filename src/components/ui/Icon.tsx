"use client";

// import { useAppThemeColors } from "@/lib/useAppStyle";
import Image from "next/image";
import React from "react";

export type SvgIconProps = {
  src: string; // e.g. "/icons/ceremony.svg" (served from public)
  size?: number | string; // px or css size, default 24
  title?: string; // accessibility label
  className?: string;
  style?: React.CSSProperties;
  preserveColors?: boolean; // kept for compatibility; icons always preserve colors now
};

/**
 * SvgIcon renders an SVG using CSS masks so it can be easily tinted with any color.
 * This avoids adding build-time tooling and keeps icons themable using our tokens.
 */
export const SvgIcon: React.FC<SvgIconProps> = ({ src, size = 24, title, className, style}) => {
  const dimension = typeof size === "number" ? `${size}px` : size;
  const numericSize = typeof size === "number" ? size : parseInt(String(size).replace(/[^0-9]/g, "")) || 24;

  // Always render native colors; no overlay/tint
  return (
    <Image
      src={src}
      alt={title || ""}
      width={numericSize}
      height={numericSize}
      className={className}
      style={{ width: dimension, height: dimension, ...style }}
    />
  );
};


