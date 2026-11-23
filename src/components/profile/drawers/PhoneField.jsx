import { useMemo, useState } from 'react';
import { countries } from '../../../data/countries';

function splitPhone(value) {
  const phone = String(value ?? '').trim();
  const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
  const country = sortedCountries.find((item) => phone.startsWith(item.code));
  if (!country) return { prefix: countries.find((item) => item.isoCode === 'US')?.code || '+1', local: phone };

  const local = phone.slice(country.code.length).trim().replace(/^[-\s]+/, '');
  return { prefix: country.code, local };
}

export default function PhoneField({ value = '', onChange, label = 'Phone number', required = false, autoFocus = false }) {
  const initial = useMemo(() => splitPhone(value), []);
  const [prefix, setPrefix] = useState(initial.prefix);
  const [local, setLocal] = useState(initial.local);

  const updatePrefix = (nextPrefix) => {
    setPrefix(nextPrefix);
    onChange(local ? `${nextPrefix} ${local}` : '');
  };

  const updateLocal = (nextLocal) => {
    const digitsAndSymbols = nextLocal.replace(/[^\d\s()-]/g, '');
    setLocal(digitsAndSymbols);
    onChange(digitsAndSymbols ? `${prefix} ${digitsAndSymbols}` : '');
  };

  return (
    <label className="fld">
      <span>{label}{required && <b> *</b>}</span>
      <div className="profile-phone-control">
        <select
          className="profile-phone-prefix"
          aria-label="Phone country code"
          value={prefix}
          onChange={(event) => updatePrefix(event.target.value)}
        >
          {countries.map((country) => (
            <option key={country.isoCode} value={country.code}>
              {country.code} {country.name}
            </option>
          ))}
        </select>
        <input
          className="profile-phone-number"
          type="tel"
          autoFocus={autoFocus}
          autoComplete="tel-national"
          placeholder="50 123 4567"
          value={local}
          onChange={(event) => updateLocal(event.target.value)}
        />
      </div>
    </label>
  );
}
