export default function FormField({ id, label, error, help, full = false, locked = false, children }) {
  return (
    <div className={full ? "full" : ""}>
      <label className="l" htmlFor={id}>{label}</label>
      <div className={`inp${locked ? " locked" : ""}${error ? " bad" : ""}`}>
        {children}
      </div>
      {help && <div className="help">{help}</div>}
      {error && <div className="help e" role="alert">{error}</div>}
    </div>
  );
}
