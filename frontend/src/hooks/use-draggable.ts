"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseDraggableProps {
  initialPosition?: { x: number; y: number };
  onClick?: () => void;
  clickThreshold?: number; // Distance in pixels to distinguish click from drag
  itemSize?: number; // The size (width/height) of the dragged item to compute viewport bounds
}

export function useDraggable({
  initialPosition,
  onClick,
  clickThreshold = 5,
  itemSize = 64, // Assume 64px roughly for an avatar button
}: UseDraggableProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
    hasMovedThreshold: false,
  });

  // Calculate default position (bottom-right) or use saved initial
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const savedPos = localStorage.getItem("chisa_assistant_pos");
      if (savedPos) {
        try {
          const parsed = JSON.parse(savedPos);
          // Clamp immediately upon restoring
          const clampedX = Math.max(0, Math.min(parsed.x, window.innerWidth - itemSize));
          const clampedY = Math.max(0, Math.min(parsed.y, window.innerHeight - itemSize));
          setPosition({ x: clampedX, y: clampedY });
        } catch (e) {
          setPosition(
            initialPosition ?? { x: window.innerWidth - 24 - itemSize, y: window.innerHeight - 24 - itemSize },
          );
        }
      } else {
        setPosition(initialPosition ?? { x: window.innerWidth - 24 - itemSize, y: window.innerHeight - 24 - itemSize });
      }
      setIsInitialized(true);
    }
  }, [initialPosition, itemSize, isInitialized]);

  // Handle window resize to clamp position inside bounds
  useEffect(() => {
    if (!isInitialized) return;

    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(0, Math.min(prev.x, window.innerWidth - itemSize)),
        y: Math.max(0, Math.min(prev.y, window.innerHeight - itemSize)),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isInitialized, itemSize]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only left clicks/touches
      if (e.button !== 0 && e.pointerType === "mouse") return;

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialPosX: position.x,
        initialPosY: position.y,
        hasMovedThreshold: false,
      };
    },
    [position],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (!dragRef.current.hasMovedThreshold && Math.sqrt(dx * dx + dy * dy) > clickThreshold) {
        dragRef.current.hasMovedThreshold = true;
      }

      // Clamp coordinates to viewport
      const newX = Math.max(0, Math.min(dragRef.current.initialPosX + dx, window.innerWidth - itemSize));
      const newY = Math.max(0, Math.min(dragRef.current.initialPosY + dy, window.innerHeight - itemSize));

      setPosition({ x: newX, y: newY });
    },
    [isDragging, clickThreshold, itemSize],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (!dragRef.current.hasMovedThreshold && onClick) {
        onClick();
      } else if (dragRef.current.hasMovedThreshold) {
        // Save position if it was a drag
        localStorage.setItem("chisa_assistant_pos", JSON.stringify(position));
      }
    },
    [isDragging, onClick, position],
  );

  return {
    position,
    isInitialized,
    isDragging: isDragging && dragRef.current.hasMovedThreshold,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
