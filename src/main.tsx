import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import App from "./App.tsx";
import { QueryProvider } from "@/providers/QueryProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<LoadingScreen />}>
    <QueryProvider>
      <App />
    </QueryProvider>
  </Suspense>
);
