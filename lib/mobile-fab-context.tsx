"use client";

import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";

export type FabAction = {
  label: string;
  onAction: () => void;
};

type MobileFabContextType = {
  activeLabel: string | null;
  triggerFab: () => boolean;
  registerAction: (id: string, action: FabAction) => () => void;
};

const MobileFabContext = createContext<MobileFabContextType | null>(null);

let nextId = 0;

export function MobileFabProvider({ children }: { children: React.ReactNode }) {
  const actionsRef = useRef<Map<string, FabAction>>(new Map());
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const updateLabel = useCallback(() => {
    const entries = Array.from(actionsRef.current.values());
    const last = entries.length > 0 ? entries[entries.length - 1] : null;
    setActiveLabel((prev) => {
      const next = last?.label || null;
      return prev === next ? prev : next;
    });
  }, []);

  const registerAction = useCallback(
    (id: string, action: FabAction) => {
      actionsRef.current.set(id, action);
      updateLabel();
      return () => {
        actionsRef.current.delete(id);
        updateLabel();
      };
    },
    [updateLabel]
  );

  const triggerFab = useCallback(() => {
    const entries = Array.from(actionsRef.current.values());
    const last = entries.length > 0 ? entries[entries.length - 1] : null;
    if (last && typeof last.onAction === "function") {
      last.onAction();
      return true;
    }
    return false;
  }, []);

  return (
    <MobileFabContext.Provider value={{ activeLabel, triggerFab, registerAction }}>
      {children}
    </MobileFabContext.Provider>
  );
}

export function useMobileFab() {
  return useContext(MobileFabContext);
}

/**
 * Hook for pages/components to register their primary add action for the mobile FAB button.
 * Uses ref-based forwarding to prevent infinite re-render loops.
 */
export function useRegisterMobileFab(action: FabAction | null) {
  const fab = useMobileFab();
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!fab || !action) return;
    const id = `fab-${++nextId}`;

    const unregister = fab.registerAction(id, {
      label: action.label,
      onAction: () => {
        actionRef.current?.onAction();
      },
    });

    return () => {
      unregister();
    };
  }, [fab, action?.label]);
}
