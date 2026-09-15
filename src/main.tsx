import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { StartupErrorBoundary } from "./presentation/components/StartupErrorBoundary";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

function renderStartupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  root.render(
    <main style={{ fontFamily: "sans-serif", padding: 32 }}>
      <h1>No se pudo iniciar MDCapp</h1>
      <p>La instalación se abrió, pero ocurrió un error al cargar la aplicación.</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{message}</pre>
    </main>,
  );
}

void import("./App")
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <StartupErrorBoundary>
          <App />
        </StartupErrorBoundary>
      </React.StrictMode>,
    );
  })
  .catch(renderStartupError);
