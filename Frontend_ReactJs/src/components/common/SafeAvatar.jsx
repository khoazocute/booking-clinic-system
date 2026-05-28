import { useEffect, useState } from "react";

function getInitials(name) {
  if (!name) return "U";

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SafeAvatar({
  src,
  alt,
  name,
  imageClassName,
  fallbackClassName,
  fallbackSrc,
}) {
  const [hasError, setHasError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setFallbackError(false);
  }, [src]);

  const actualSrc = src === "null" || src === "undefined" || !src ? null : src;

  if (!actualSrc || hasError) {
    if (fallbackSrc && !fallbackError) {
      return (
        <img
          className={imageClassName}
          src={fallbackSrc}
          alt={alt ?? name ?? "Avatar"}
          onError={() => setFallbackError(true)}
        />
      );
    }
    return <span className={fallbackClassName}>{getInitials(name)}</span>;
  }

  return (
    <img
      className={imageClassName}
      src={actualSrc}
      alt={alt ?? name ?? "Avatar"}
      onError={() => setHasError(true)}
    />
  );
}
