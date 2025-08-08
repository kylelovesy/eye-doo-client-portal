"use client";

import { useAppThemeColors } from "@/lib/useAppStyle";
import React from "react";

export type SvgIconProps = {
  src: string; // e.g. "/icons/ceremony.svg" (served from _temp_portal/public)
  size?: number | string; // px or css size, default 24
  color?: string; // defaults to theme.colors.onSurface
  title?: string; // accessibility label
  className?: string;
  style?: React.CSSProperties;
};

/**
 * SvgIcon renders an SVG using CSS masks so it can be easily tinted with any color.
 * This avoids adding build-time tooling and keeps icons themable using our tokens.
 */
export const SvgIcon: React.FC<SvgIconProps> = ({ src, size = 24, color, title, className, style }) => {
  const colors = useAppThemeColors();
  const dimension = typeof size === "number" ? `${size}px` : size;

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


