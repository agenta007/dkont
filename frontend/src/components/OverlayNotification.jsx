import { useEffect, useRef, useState } from "react";

export function useOverlayNotification(duration = 3000) {
  const [message, setMessage] = useState("");
  const timerRef = useRef(null);

  const notify = (msg) => {
    clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = setTimeout(() => setMessage(""), duration);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { message, notify };
}

export function OverlayNotification({ message }) {
  if (!message) return null;
  return (
    <div className="success-overlay">
      <div className="success-popup">{message}</div>
    </div>
  );
}
