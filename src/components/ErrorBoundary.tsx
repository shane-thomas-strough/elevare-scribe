"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console; Sentry integration will be added later
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0A0A0F",
            color: "#F0F0F8",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            {/* Brand mark */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 212, 255, 0.05)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00D4FF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "rgba(240, 240, 248, 0.6)",
                margin: 0,
              }}
            >
              Elevare Scribe encountered an unexpected error. Please reload the
              page to try again.
            </p>

            <button
              onClick={this.handleReload}
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(0, 212, 255, 0.4)",
                background: "rgba(0, 212, 255, 0.1)",
                color: "#00D4FF",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.2s ease",
                fontFamily: "inherit",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(0, 212, 255, 0.2)")
              }
              onFocus={(e) =>
                (e.currentTarget.style.background = "rgba(0, 212, 255, 0.2)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)")
              }
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
