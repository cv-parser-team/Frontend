
const badgeStyles = {
  yellow: "yellow",
  warning: "warning",
  neutral: "neutral",
  purple: "purple",
  success: "success",
  error: "error",
};

export default function ReviewBadge({
  children,
  tone = "neutral",
  className = "",
}) {
  const style = badgeStyles[tone] || "neutral";

  return (
    <span className={`review-badge ${style} ${className}`}>
      {children}
    </span>
  );
}
