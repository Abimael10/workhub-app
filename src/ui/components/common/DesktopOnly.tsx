import { useEffect, useState } from "react";
import { MonitorSmartphone } from "lucide-react";

type DesktopOnlyProps = {
  children: React.ReactNode;
};

export function DesktopOnly({ children }: DesktopOnlyProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Check if the device is mobile/tablet
    const checkDevice = () => {
      // Using window.matchMedia to detect smaller screens
      const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(isSmallScreen || isTouchDevice);
      setShowMessage(isSmallScreen || isTouchDevice);
    };

    // Run on mount and add resize listener
    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  if (showMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md space-y-6 rounded-3xl border border-white/10 bg-black/40 p-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MonitorSmartphone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">WorkHub Works Best on Desktop</h1>
          <p className="text-muted-foreground">
            This application is optimized for desktop use. For the best experience,
            please use a computer or laptop.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setShowMessage(false)}
              className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-amber-500/30 transition hover:shadow-glow"
            >
              Continue on Desktop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <div className="desktop-only">{children}</div>;
}