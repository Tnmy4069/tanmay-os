"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const selectClass =
  "h-11 sm:h-9 rounded-xl border border-input bg-transparent px-3 text-base sm:text-sm";

export function SpaceSettings({ initialCores }: { initialCores: SpaceCore[] }) {
  const [cores, setCores] = useState(initialCores);
  const [coreName, setCoreName] = useState("");
  const [coreIcon, setCoreIcon] = useState("Folder");
  const [itemDraft, setItemDraft] = useState<Record<string, { name: string; icon: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    window.location.reload();
  }

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        refresh();
      } catch (e: any) {
        setError(e?.message || "Could not save");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {cores
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((core) => {
          const CoreIcon = spaceIcon(core.icon);
          const draft = itemDraft[core.id] || { name: "", icon: "Folder" };
          return (
            <Card key={core.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CoreIcon className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-lg">{core.name}</CardTitle>
                      <CardDescription>{core.builtIn ? "Built-in core" : "Custom core"}</CardDescription>
                    </div>
                  </div>
                  {!core.builtIn && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => run(() => deleteCoreAction(core.id))}
                      aria-label="Delete category"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  defaultValue={core.name}
                  onBlur={(e) => {
                    const next = e.target.value.trim();
                    if (next && next !== core.name) {
                      setCores((prev) => prev.map((c) => (c.id === core.id ? { ...c, name: next } : c)));
                      run(() => renameCoreAction(core.id, next));
                    }
                  }}
                />

                <ul className="space-y-2">
                  {core.items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item) => {
                      const ItemIcon = spaceIcon(item.icon);
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2"
                        >
                          <ItemIcon className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
                          <Input
                            defaultValue={item.name}
                            className="h-10 sm:h-9"
                            onBlur={(e) => {
                              const next = e.target.value.trim();
                              if (next && next !== item.name) run(() => renameItemAction(core.id, item.id, next));
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => run(() => setItemHiddenAction(core.id, item.id, !item.hidden))}
                            aria-label={item.hidden ? "Show" : "Hide"}
                          >
                            {item.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {!item.builtIn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              onClick={() => run(() => deleteItemAction(core.id, item.id))}
                              aria-label="Delete subcategory"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </li>
                      );
                    })}
                </ul>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="New subcategory"
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
                      <option key={icon} value={icon} className="bg-card">
                        {icon}
                      </option>
                    ))}
                  </select>
                  <Button
                    disabled={isPending || !draft.name.trim()}
                    onClick={() =>
                      run(async () => {
                        await addItemAction(core.id, draft.name, draft.icon);
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Add core category</CardTitle>
          <CardDescription>New top-level group like Career or Education.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="e.g. Finance"
            value={coreName}
            onChange={(e) => setCoreName(e.target.value)}
          />
          <select className={selectClass} value={coreIcon} onChange={(e) => setCoreIcon(e.target.value)}>
            {SPACE_ICONS.map((icon) => (
              <option key={icon} value={icon} className="bg-card">
                {icon}
              </option>
            ))}
          </select>
          <Button
            disabled={isPending || !coreName.trim()}
            onClick={() =>
              run(async () => {
                await addCoreAction(coreName, coreIcon);
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add core
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}