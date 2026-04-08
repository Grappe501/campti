"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { SceneReader } from "@/components/public/scene-reader";

type Props = {
  text: string;
  children: ReactNode;
};

type State = { hasError: boolean };

/**
 * If immersive client logic fails, fall back to the standard static reader.
 */
export class ImmersiveErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ImmersiveErrorBoundary]", error.message, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return <SceneReader text={this.props.text} />;
    }
    return this.props.children;
  }
}
