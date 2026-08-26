"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TaskItem } from "@/components/features/TaskItem";
import { getLocalAll } from "@/lib/offline/mutate";
import { useOnlineStatus } from "@/lib/offline/hooks";
import type { ClientTask } from "@/lib/serialize";

export function TasksBoard({
  mustDoTasks: initialMust,
  otherTasks: initialOther,
}: {
  mustDoTasks: ClientTask[];
  otherTasks: ClientTask[];
}) {
  const online = useOnlineStatus();
  const [mustDoTasks, setMustDo] = useState(initialMust);
  const [otherTasks, setOther] = useState(initialOther);

  useEffect(() => {
    if (online) {
      setMustDo(initialMust);
      setOther(initialOther);
      return;
    }
    getLocalAll<ClientTask>("tasks").then((rows) => {
      if (!rows.length) return;
      const open = rows.filter((t) => t.status !== "Done");
      setMustDo(open.filter((t) => t.isMustDo));
      setOther(open.filter((t) => !t.isMustDo));
    });
  }, [online, initialMust, initialOther]);

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Must do</CardTitle>
          <CardDescription>Hard cap of 3 when they are scheduled for a day.</CardDescription>
        </CardHeader>
        <CardContent>
          {mustDoTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No critical tasks.</p>
          ) : (
            <ul className="space-y-2">
              {mustDoTasks.map((task) => (
                <TaskItem key={task._id} task={task} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Everything else</CardTitle>
          <CardDescription>{otherTasks.length} open</CardDescription>
        </CardHeader>
        <CardContent>
          {otherTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Backlog is clear.</p>
          ) : (
            <ul className="space-y-2">
              {otherTasks.map((task) => (
                <TaskItem key={task._id} task={task} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
