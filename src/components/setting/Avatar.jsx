export default function Avatar({ initials, image, className = "", label }) {
  return (
    <div
      className={`av ${className}`}
      role="img"
      aria-label={label || "Profile avatar"}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      {!image && initials}
    </div>
  );
}
