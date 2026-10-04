import { useEffect, useState } from "react";

export function useNow(ms = 1000) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);

  return now;
}
