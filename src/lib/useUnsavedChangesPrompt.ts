"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useUnsavedChangesPrompt(enabled: boolean, message = "You have unsaved changes. Leave this page?") {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    const onPopState = () => {
      if (enabled && !confirm(message)) {
        history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled, message, router]);
}


