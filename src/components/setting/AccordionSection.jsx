export default function AccordionSection({
  id, icon, title, subtitle, open, onToggle, dirty = false, children,
}) {
  return (
    <section className={`acc${open ? " open" : ""}`} id={`a-${id}`}>
      <button
        className="hd"
        type="button"
        aria-expanded={open}
        aria-controls={`b-${id}`}
        id={`h-${id}`}
        onClick={onToggle}
      >
        <div className="ic" aria-hidden="true">{icon}</div>
        <div>
          <b>{title}</b>
          <span className="s">{subtitle}</span>
        </div>
        {dirty && <span className="dot on">Unsaved changes</span>}
        <span className="chev" aria-hidden="true">⌄</span>
      </button>
      <div className="body" id={`b-${id}`} role="region" aria-labelledby={`h-${id}`}>
        <div className="inner"><div className="pad">{children}</div></div>
      </div>
    </section>
  );
}
