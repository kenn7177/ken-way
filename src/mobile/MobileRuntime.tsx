import { useEffect, type PropsWithChildren } from "react";
import { MobileDeviceProvider, useMobileDevice } from "./Device";
import { KeyboardProvider, useKeyboard } from "./Keyboard";

export function MobileRuntime({ children }: PropsWithChildren) {
  return (
    <MobileDeviceProvider standalone>
      <KeyboardProvider>
        <KeyboardPreview />
        <MobileAppViewport>{children}</MobileAppViewport>
      </KeyboardProvider>
    </MobileDeviceProvider>
  );
}

function MobileAppViewport({ children }: PropsWithChildren) {
  const { device } = useMobileDevice();
  const keyboard = useKeyboard();

  return (
    <div
      className="mobile-app-viewport"
      data-keyboard-visible={keyboard.visible ? "true" : "false"}
      data-platform={device.platform}
      data-standalone-runtime="true"
      data-testid="mobile-app-viewport"
      style={{ "--device-safe-area-bottom": "0px" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function KeyboardPreview() {
  const keyboard = useKeyboard();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("keyboard") === "1") {
      keyboard.show();
    }
  }, [keyboard]);

  return null;
}
