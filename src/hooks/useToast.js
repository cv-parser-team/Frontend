import { useCallback, useEffect, useRef, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState("");
  const timer = useRef(null);

  const showToast = useCallback((nextMessage) => {
    setMessage(nextMessage);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(""), 3400);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { message, showToast };
}
