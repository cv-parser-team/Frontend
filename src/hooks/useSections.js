import { useState } from 'react';
import { TABS } from '../constants/config';

// Open / closed state of the collapsible section cards + scroll-to-section.
export default function useSections(tabs = TABS) {
  const [open, setOpen] = useState(() => Object.fromEntries(tabs.map(([id]) => [id, true])));

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const openCount = tabs.filter(([id]) => open[id]).length;
  const allOpen = openCount === tabs.length;
  const toggleAll = () => setOpen(Object.fromEntries(tabs.map(([id]) => [id, !allOpen])));
  const go = (id) => {
    setOpen((o) => ({ ...o, [id]: true }));
    setTimeout(() => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return { open, toggle, toggleAll, go, openCount, allOpen };
}
