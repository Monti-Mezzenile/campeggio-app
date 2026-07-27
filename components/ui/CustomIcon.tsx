import React from "react";

// 1. Nomi icone supportate con Autocomplete attivo in VS Code
export type IconName =
  | "coniglio"
  | "cavallo"
  | "tenda-grossa"
  | "macchina"
  | "zaino"
  | "medaglia"
  | "lampadina"
  | "profilo"
  | (string & {});

// 2. Interfaccia Props estesa con tutti i tag HTML standard dell'immagine
export interface CustomIconProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "name"> {
  name: IconName;
  size?: number;
  className?: string;
}

// 3. Componente CustomIcon
export default function CustomIcon({
  name,
  size = 24,
  className = "",
  style,
  alt,
  ...props
}: CustomIconProps) {
  return (
    <img
      src={`/icons/${name}.png`}
      alt={alt || name}
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px`, ...style }}
      className={`object-contain ${className}`}
      {...props}
    />
  );
}