export default function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 222 297"
      role="img"
      aria-label="LuminaCV logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path className="brand-document" d="M8 0H112L222 110V289Q222 297 214 297H8Q0 297 0 289V8Q0 0 8 0Z" />
      <path className="brand-fold" d="M140 3L194 0Q222 0 222 27V85Z" />
      <path className="brand-connections" d="M192 82L119 173M52 120L119 173M52 177L119 173M52 237L119 173" />
      <g className="brand-points">
        <circle cx="52" cy="120" r="20" />
        <circle cx="52" cy="177" r="20" />
        <circle cx="52" cy="237" r="20" />
        <circle cx="119" cy="173" r="26" />
      </g>
    </svg>
  );
}
