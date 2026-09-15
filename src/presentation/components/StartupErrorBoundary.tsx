import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class StartupErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Startup] Error al iniciar la aplicación:", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main style={{ fontFamily: "sans-serif", padding: 32 }}>
        <h1>No se pudo iniciar MDCapp</h1>
        <p>La instalación se abrió, pero falta configuración o ocurrió un error al cargar la aplicación.</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error.message}</pre>
      </main>
    );
  }
}