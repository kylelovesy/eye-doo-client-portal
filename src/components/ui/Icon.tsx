"use client";

import { useAppThemeColors } from "@/lib/useAppStyle";
import Image from "next/image";
import React from "react";

export type SvgIconProps = {
  src: string; // e.g. "/icons/ceremony.svg" (served from _temp_portal/public)
  size?: number | string; // px or css size, default 24
  color?: string; // defaults to theme.colors.onSurface
  title?: string; // accessibility label
  className?: string;
  style?: React.CSSProperties;
  preserveColors?: boolean; // when true, render the SVG as-is (no mask tint)
};

/**
 * SvgIcon renders an SVG using CSS masks so it can be easily tinted with any color.
 * This avoids adding build-time tooling and keeps icons themable using our tokens.
 */
export const SvgIcon: React.FC<SvgIconProps> = ({ src, size = 24, color, title, className, style, preserveColors = false }) => {
  const colors = useAppThemeColors();
  const dimension = typeof size === "number" ? `${size}px` : size;
  const numericSize = typeof size === "number" ? size : parseInt(String(size).replace(/[^0-9]/g, "")) || 24;

  if (preserveColors) {
    return (
      <Image
        src={src}
        alt={title || ""}
        width={numericSize}
        height={numericSize}
        className={className}
        style={style}
      />
    );
  }

  const styles: React.CSSProperties = {
    width: dimension,
    height: dimension,
    backgroundColor: color || colors.onSurface,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    display: "inline-block",
    ...style,
  };

  return <span role={title ? "img" : undefined} aria-label={title} className={className} style={styles} />;
};


