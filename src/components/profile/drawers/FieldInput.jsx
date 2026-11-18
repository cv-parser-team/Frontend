export default function FieldInput({ f, v, set, disabled }) {
  const [k, label, type, req, extra] = f;
  if (type === 'check') {
    return <label className="chk"><input type="checkbox" checked={!!v[k]} onChange={(e) => set(k, e.target.checked)} />{label}</label>;
  }
  const yearOnly = type === 'year' || (type === 'month' && /^\d{4}$/.test(String(v[k] ?? '')));
  const selectedYear = String(v[k] ?? '');
  if (yearOnly) {
    const currentYear = new Date().getFullYear();
    const firstYear = Math.min(1900, Number(selectedYear) || currentYear - 100);
    const years = Array.from(
      { length: currentYear - firstYear + 1 },
      (_, index) => String(currentYear - index),
    );
    if (selectedYear && !years.includes(selectedYear)) years.unshift(selectedYear);
    return (
      <label className="fld">
        <span>{label}{!!req && <b> *</b>}</span>
        <select className="in" value={selectedYear} disabled={disabled} onChange={(e) => set(k, e.target.value)}>
          <option value="">Select year</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>
    );
  }
  const common = { className: 'in', value: v[k], disabled, onChange: (e) => set(k, e.target.value) };
  return (
    <label className="fld">
      <span>{label}{!!req && <b> *</b>}</span>
      {type === 'area' ? <textarea rows={5} maxLength={extra} {...common} />
        : type === 'select' ? <select {...common}>
          <option value="">Select a level</option>
          {v[k] && !extra.includes(v[k]) && <option value={v[k]}>{v[k]}</option>}
          {extra.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        : <input type={type === 'list' ? 'text' : type} {...common} />}
      {type === 'area' && !!extra && <small>{v[k].length}/{extra} characters</small>}
    </label>
  );
}
