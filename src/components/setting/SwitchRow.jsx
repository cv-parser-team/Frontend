export default function SwitchRow({ title, description, checked, onChange, disabled = false, sub = false, ariaLabel }) {
  return (
    <div className={`row${sub ? " sub" : ""}${sub && disabled ? " off" : ""}`}>
      <div className="t"><b>{title}</b><span>{description}</span></div>
      <label className="sw">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.checked)}
          aria-label={ariaLabel || title}
        />
        <span />
      </label>
    </div>
  );
}
