import toast, { Toaster } from "react-hot-toast";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export function CustomToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "2px solid var(--border)",
          borderRadius: "0px",
          padding: "12px 16px",
          boxShadow: "var(--shadow-sm)",
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.01em",
          maxWidth: "380px",
          lineHeight: 1.4,
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "var(--card)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--destructive)",
            secondary: "var(--card)",
          },
          duration: 5000,
        },
      }}
      containerStyle={{
        bottom: 24,
        right: 24,
      }}
    />
  );
}

function getToastClasses(type: "success" | "error" | "info") {
  const base =
    "flex items-start gap-3 w-full [&>svg]:mt-0.5 [&>svg]:shrink-0";

  if (type === "success") {
    return `${base} [&>svg]:text-green-500`;
  }
  if (type === "error") {
    return `${base} [&>svg]:text-destructive`;
  }
  return base;
}

export const showToast = {
  success(message: string) {
    toast.success(message, {
      className: getToastClasses("success"),
      icon: <CheckCircle2 className="h-4 w-4" />,
    });
  },

  error(message: string) {
    toast.error(message, {
      className: getToastClasses("error"),
      icon: <AlertCircle className="h-4 w-4" />,
    });
  },

  info(message: string) {
    toast(message, {
      icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
      className: getToastClasses("info"),
    });
  },
};

const HTTP_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your file and try again.",
  404: "Service not available. Please try again later.",
  413: "File is too large. Maximum size is 20 MB.",
  415: "Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.",
  422: "Could not read the document. Please upload a clearer image.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again later.",
  502: "Service is temporarily unavailable. Please try again in a moment.",
  503: "Service is under maintenance. Please try again shortly.",
};

const NETWORK_MESSAGE =
  "Unable to connect. Please check your internet and try again.";

const TIMEOUT_MESSAGE =
  "Analysis is taking longer than expected. Please try again.";

export function getReadableError(err: unknown, responseStatus?: number): string {
  if (responseStatus && HTTP_MESSAGES[responseStatus]) {
    return HTTP_MESSAGES[responseStatus];
  }

  const msg = err instanceof Error ? err.message : String(err);

  if (/Failed to fetch|NetworkError|TypeError/i.test(msg)) {
    return NETWORK_MESSAGE;
  }
  if (/timeout|abort/i.test(msg)) {
    return TIMEOUT_MESSAGE;
  }
  if (/413|payload.*too.*large/i.test(msg)) {
    return HTTP_MESSAGES[413];
  }
  if (/415|unsupported.*media/i.test(msg)) {
    return HTTP_MESSAGES[415];
  }

  return "Something went wrong. Please try again.";
}
