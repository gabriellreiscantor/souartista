import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App.tsx";
import { QueryProvider } from "@/providers/QueryProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import "./index.css";

function AppWithLoading() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula loading mínimo de 1.5s para mostrar a splash screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryProvider>
      <App />
    </QueryProvider>
  );
}

createRoot(document.getElementById("root")!).render(<AppWithLoading />);
