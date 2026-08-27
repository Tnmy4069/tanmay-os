"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SPACE_ICONS, type SpaceCore } from "@/lib/spaces";
import { spaceIcon } from "@/lib/space-icons";
import {
  addCoreAction,
  addItemAction,
  deleteCoreAction,
  deleteItemAction,
  renameCoreAction,
  renameItemAction,
  setItemHiddenAction,
} from "@/app/actions/space.actions";
import { mutateWithOffline } from "@/lib/offline/mutate";
import { offlineDb } from "@/lib/offline/db";
import { useOnlineStatus } from "@/lib/offline/hooks";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-2xl border-0 bg-secondary px-3 text-sm font-semibold outline-none sm:h-10 sm:w-auto";

export function SpaceSettings({ initialCores }: { initialCores: SpaceCore[] }) {
  const [cores, setCores] = useState(initialCores);
  const [coreName, setCoreName] = useState("");
  const [coreIcon, setCoreIcon] = useState("Folder");
  const [itemDraft, setItemDraft] = useState<Record<string, { name: string; icon: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(initialCores[0]?.id ?? null);
  const [isPending, startTransition] = useTransition();
  const online = useOnlineStatus();

  function refresh() {
    window.location.reload();
  }

  async function persistCores(next: SpaceCore[]) {
    setCores(next);
    if (offlineDb) await offlineDb.meta.put({ key: "spacesCores", value: next });
  }

  function run(
    action: string,
    payload: any,
    onlineFn: () => Promise<any>,
    applyLocal?: (prev: SpaceCore[]) => SpaceCore[]
  ) {
    setError(null);
    startTransition(async () => {
      try {
        const { offline } = await mutateWithOffline({
          action,
          payload,
          onlineFn,
          offlineApply: async () => {
            if (applyLocal) {
              await persistCores(applyLocal(cores));
            }
          },
        });
        if (!offline) refresh();
      } catch (e: any) {
        setError(e?.message || "Could not save");
      }
    });
  }

  return (
    <div className="space-y-2.5">
      {error && <p className="px-1 text-sm font-bold text-destructive">{error}</p>}
      {!online && (
        <p className="rounded-2xl bg-[color:var(--warning)]/20 px-3 py-2 text-xs font-semibold text-[color:var(--warning-foreground)]">
          Offline — edits queue and sync later.
        </p>
      )}

      {cores
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((core) => {
          const CoreIcon = spaceIcon(core.icon);
          const draft = itemDraft[core.id] || { name: "", icon: "Folder" };
          const open = openId === core.id;

          return (
            <div key={core.id} className="overflow-hidden rounded-3xl bg-secondary/80">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : core.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.995]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <CoreIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{core.name}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {core.items.length} item{core.items.length === 1 ? "" : "s"}
                    {core.builtIn ? " · built-in" : ""}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-muted-foreground">{open ? "Hide" : "Edit"}</span>
              </button>

              {open && (
                <div className="space-y-3 border-t border-border/40 px-3 pb-3.5 pt-3">
                  <div className="flex gap-2">
                    <Input
                      defaultValue={core.name}
                      className="border-0 bg-card shadow-none"
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (next && next !== core.name) {
                          run(
                            "renameCore",
                            { coreId: core.id, name: next },
                            () => renameCoreAction(core.id, next),
                            (prev) => prev.map((c) => (c.id === core.id ? { ...c, name: next } : c))
                          );
                        }
                      }}
                    />
                    {!core.builtIn && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            "deleteCore",
                            { coreId: core.id },
                            () => deleteCoreAction(core.id),
                            (prev) => prev.filter((c) => c.id !== core.id)
                          )
                        }
                        aria-label="Delete category"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <ul className="space-y-1.5">
                    {core.items
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((item) => {
                        const ItemIcon = spaceIcon(item.icon);
                        return (
                          <li
                            key={item.id}
                            className={cn(
                              "flex items-center gap-1.5 rounded-2xl bg-card px-2 py-1.5",
                              item.hidden && "opacity-55"
                            )}
                          >
                            <ItemIcon className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
                            <Input
                              defaultValue={item.name}
                              className="h-10 border-0 bg-transparent shadow-none sm:h-9"
                              onBlur={(e) => {
                                const next = e.target.value.trim();
                                if (next && next !== item.name) {
                                  run(
                                    "renameItem",
                                    { coreId: core.id, itemId: item.id, name: next },
                                    () => renameItemAction(core.id, item.id, next),
                                    (prev) =>
                                      prev.map((c) =>
                                        c.id === core.id
                                          ? {
                                              ...c,
                                              items: c.items.map((i) =>
                                                i.id === item.id ? { ...i, name: next } : i
                                              ),
                                            }
                                          : c
                                      )
                                  );
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              onClick={() =>
                                run(
                                  "setItemHidden",
                                  { coreId: core.id, itemId: item.id, hidden: !item.hidden },
                                  () => setItemHiddenAction(core.id, item.id, !item.hidden),
                                  (prev) =>
                                    prev.map((c) =>
                                      c.id === core.id
                                        ? {
                                            ...c,
                                            items: c.items.map((i) =>
                                              i.id === item.id ? { ...i, hidden: !i.hidden } : i
                                            ),
                                          }
                                        : c
                                    )
                                )
                              }
                              aria-label={item.hidden ? "Show" : "Hide"}
                            >
                              {item.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            {!item.builtIn && (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isPending}
                                onClick={() =>
                                  run(
                                    "deleteItem",
                                    { coreId: core.id, itemId: item.id },
                                    () => deleteItemAction(core.id, item.id),
                                    (prev) =>
                                      prev.map((c) =>
                                        c.id === core.id
                                          ? { ...c, items: c.items.filter((i) => i.id !== item.id) }
                                          : c
                                      )
                                  )
                                }
                                aria-label="Delete subcategory"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </li>
                        );
                      })}
                  </ul>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="New subcategory"
                      className="border-0 bg-card shadow-none"
                      value={draft.name}
                      onChange={(e) =>
                        setItemDraft((prev) => ({ ...prev, [core.id]: { ...draft, name: e.target.value } }))
                      }
                    />
                    <select
                      className={selectClass}
                      value={draft.icon}
                      onChange={(e) =>
                        setItemDraft((prev) => ({ ...prev, [core.id]: { ...draft, icon: e.target.value } }))
                      }
                    >
                      {SPACE_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                    <Button
                      disabled={isPending || !draft.name.trim()}
                      onClick={() =>
                        run(
                          "addItem",
                          { coreId: core.id, name: draft.name, icon: draft.icon },
                          () => addItemAction(core.id, draft.name, draft.icon),
                          (prev) =>
                            prev.map((c) =>
                              c.id === core.id
                                ? {
                                    ...c,
                                    items: [
                                      ...c.items,
                                      {
                                        id: crypto.randomUUID(),
                                        name: draft.name.trim(),
                                        icon: draft.icon,
                                        slug: draft.name.trim().toLowerCase().replace(/\s+/g, "-"),
                                        href: `/s/${c.slug}/${draft.name.trim().toLowerCase().replace(/\s+/g, "-")}`,
                                        order: c.items.length,
                                        hidden: false,
                                        builtIn: false,
                                      },
                                    ],
                                  }
                                : c
                            )
                        )
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      <div className="rounded-3xl bg-secondary/50 px-4 py-3.5">
        <p className="text-sm font-extrabold">Add a space</p>
        <p className="text-xs font-semibold text-muted-foreground">New top-level group</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="e.g. Finance"
            className="border-0 bg-card shadow-none"
            value={coreName}
            onChange={(e) => setCoreName(e.target.value)}
          />
          <select className={selectClass} value={coreIcon} onChange={(e) => setCoreIcon(e.target.value)}>
            {SPACE_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
          <Button
            disabled={isPending || !coreName.trim()}
            onClick={() =>
              run(
                "addCore",
                { name: coreName, icon: coreIcon },
                () => addCoreAction(coreName, coreIcon),
                (prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    name: coreName.trim(),
                    icon: coreIcon,
                    slug: coreName.trim().toLowerCase().replace(/\s+/g, "-"),
                    order: prev.length,
                    builtIn: false,
                    hidden: false,
                    items: [],
                  },
                ]
              )
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
