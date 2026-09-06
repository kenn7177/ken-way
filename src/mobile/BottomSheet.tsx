import { type PropsWithChildren, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useDrag } from "@use-gesture/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useViewport } from "../viewport";
import { useKeyboard, useKeyboardInsets } from "./Keyboard";
import { useMobileDevice } from "./Device";

type BottomSheetProps = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  snap?: number;
  reducedMotion?: boolean;
}>;

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  snap = 0.72,
  reducedMotion = false,
  children,
}: BottomSheetProps) {
  const { device, standalone } = useMobileDevice();
  const viewport = useViewport();
  const systemReduced = useReducedMotion();
  const reduce = reducedMotion || Boolean(systemReduced);
  const keyboard = useKeyboard();
  const { keyboardHeight } = useKeyboardInsets();
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (open) keyboard.hide();
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      keyboard.hide();
    }

    onOpenChange(nextOpen);
  };

  const bindDrag = useDrag(
    (state) => {
      const [, movementY] = state.movement;
      const [, velocityY] = state.velocity;
      const [, directionY] = state.direction;
      const nextY = Math.max(0, movementY);

      if (!state.last) {
        setDragY(nextY);
        return;
      }

      const shouldClose = nextY > 96 || (velocityY > 0.55 && directionY > 0);
      setDragY(0);

      if (shouldClose) {
        onOpenChange(false);
      }
    },
    {
      axis: "y",
      filterTaps: true,
    },
  );

  const sheetHeight = Math.round((standalone ? viewport.height : device.geometry.screen.height) * snap);
  const effectiveHeight = standalone
    ? Math.min(Math.max(260, sheetHeight), Math.max(0, viewport.height - 12))
    : Math.max(260, sheetHeight - Math.min(keyboardHeight, 180));
  const sheetBottom =
    standalone ? Math.max(0, window.innerHeight - viewport.height - viewport.top) : device.platform === "android"
      ? Math.max(device.geometry.safeArea.bottom, keyboardHeight)
      : keyboardHeight;
  const portalContainer = undefined;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {/* Keep the portal mounted after `open` flips so AnimatePresence can run
          the sheet and overlay exit animations before Radix removes them. */}
      <Dialog.Portal container={portalContainer} forceMount>
        <AnimatePresence>
          {open ? (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="sheet-overlay"
                  data-testid="sheet-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.16 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount>
                <motion.div
                  className="bottom-sheet"
                  data-testid="bottom-sheet"
                  style={{
                    position: standalone ? "fixed" : "absolute",
                    bottom: sheetBottom,
                    maxHeight: effectiveHeight,
                    minHeight: Math.min(260, effectiveHeight),
                    touchAction: standalone ? "auto" : "none",
                  }}
                  initial={reduce ? { opacity: 0 } : { y: effectiveHeight + 36 }}
                  animate={{ y: dragY, opacity: 1 }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0 } } : {
                    y: effectiveHeight + 36,
                    transition: {
                      type: "spring",
                      stiffness: 250,
                      damping: 30,
                      mass: 1.05,
                    },
                  }}
                  transition={reduce ? { duration: 0 } : {
                    type: "spring",
                    stiffness: 500,
                    damping: 43,
                    mass: 0.9,
                  }}
                >
                  <div className="sheet-handle-zone" data-testid="sheet-handle" {...bindDrag()}>
                    <div className="sheet-handle" />
                  </div>
                  <div className="sheet-header">
                    <Dialog.Title className="sheet-title">{title}</Dialog.Title>
                    {description ? <Dialog.Description className="sheet-description">{description}</Dialog.Description> : null}
                    <Dialog.Close className="sheet-close" aria-label="关闭面板"><Cross2Icon aria-hidden="true" /></Dialog.Close>
                  </div>
                  <div className="sheet-content">{children}</div>
                </motion.div>
              </Dialog.Content>
            </>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
