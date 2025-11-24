import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App.tsx";
import { QueryProvider } from "@/providers/QueryProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import "./index.css";

function AppWithLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Loading de 800ms + 200ms de fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setIsLoading(false), 200);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`transition-opacity duration-200 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <LoadingScreen />
      </div>
    );
  }

  return (
    <QueryProvider>
      <App />
    </QueryProvider>
  );
}

createRoot(document.getElementById("root")!).render(<AppWithLoading />);
