import { IScheduleBlock } from "@/models/ScheduleBlock";

type TaskLike = { estimatedMinutes?: number | null };

export function calculateWorkload(schedule: IScheduleBlock[], tasks: TaskLike[]) {
  // Extract total available focus minutes from ScheduleBlocks
  let availableMinutes = 0;
  
  schedule.forEach(block => {
    if (block.type === "Focus" || block.type === "Work" || block.title.includes("Focus")) {
      const start = parseTime(block.startTime);
      const end = parseTime(block.endTime);
      
      let diff = end - start;
      if (diff < 0) diff += 24 * 60; // Handle over-midnight
      
      availableMinutes += diff;
    }
  });

  // Default to 165 mins (2h 45m) if no explicit focus blocks are found on a weekday
  // as per the user's focus routine spec (7:45-9:45 + 9:45-10:30)
  if (availableMinutes === 0) {
    availableMinutes = 165;
  }

  // Calculate planned minutes
  let plannedMinutes = 0;
  tasks.forEach(task => {
    plannedMinutes += task.estimatedMinutes || 60; // default 60 mins if not set
  });

  const overloadMinutes = plannedMinutes - availableMinutes;
  const isOverloaded = overloadMinutes > 0;

  return {
    availableMinutes,
    plannedMinutes,
    overloadMinutes: isOverloaded ? overloadMinutes : 0,
    isOverloaded
  };
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours * 60) + minutes;
}
