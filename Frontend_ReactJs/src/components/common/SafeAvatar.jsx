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
  defaultSrc,
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    if (defaultSrc) {
      return (
        <img
          className={imageClassName}
          src={defaultSrc}
          alt={alt ?? name ?? "Avatar"}
        />
      );
    }
    return <span className={fallbackClassName}>{getInitials(name)}</span>;
  }

  return (
    <img
      className={imageClassName}
      src={src}
      alt={alt ?? name ?? "Avatar"}
      onError={() => setHasError(true)}
    />
  );
}
