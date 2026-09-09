"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import ScheduleBlock, { IScheduleBlock } from "@/models/ScheduleBlock";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";

export type BlockFormData = {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: string;
  isFixed: boolean;
  allowOverride: boolean;
};

export async function createScheduleBlockAction(data: BlockFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  // Check for exact overlap on same day
  const overlap = await ScheduleBlock.findOne({
    userId: session.user.id,
    dayOfWeek: data.dayOfWeek,
    $or: [
      { startTime: { $lt: data.endTime }, endTime: { $gt: data.startTime } },
    ],
  });

  if (overlap) {
    return {
      success: false,
      error: "TIME_OVERLAP",
      message: `This block overlaps with "${overlap.title}" (${overlap.startTime}–${overlap.endTime}).`,
    };
  }

  await ScheduleBlock.create({
    ...data,
    userId: session.user.id,
    type: data.type as IScheduleBlock["type"],
  });
  revalidatePath("/settings/routine");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateScheduleBlockAction(blockId: string, data: Partial<BlockFormData>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  const existing = await ScheduleBlock.findOne({ _id: blockId, userId: session.user.id });
  if (!existing) throw new Error("Block not found");

  // Check overlap excluding self
  if (data.startTime && data.endTime) {
    const overlap = await ScheduleBlock.findOne({
      userId: session.user.id,
      dayOfWeek: data.dayOfWeek ?? existing.dayOfWeek,
      _id: { $ne: blockId },
      $or: [{ startTime: { $lt: data.endTime }, endTime: { $gt: data.startTime } }],
    });
    if (overlap) {
      return {
        success: false,
        error: "TIME_OVERLAP",
        message: `This block overlaps with "${overlap.title}" (${overlap.startTime}–${overlap.endTime}).`,
      };
    }
  }

  await ScheduleBlock.findOneAndUpdate({ _id: blockId, userId: session.user.id }, { $set: data });
  revalidatePath("/settings/routine");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteScheduleBlockAction(blockId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  await ScheduleBlock.deleteOne({ _id: blockId, userId: session.user.id });
  revalidatePath("/settings/routine");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function generateRoutineFromTextAction(prompt: string, dayOfWeek: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const user = await User.findById(session.user.id);
  const apiKey = user?.geminiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, message: "No Gemini API Key provided. Please add one in your account or configure the server." };
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
You are an expert routine scheduler. The user will provide a natural language description of their day.
Analyze the text and extract their schedule blocks for a single day.
Respond ONLY with a valid JSON array of objects representing the schedule blocks.
Each object MUST conform EXACTLY to this JSON schema:
{
  "title": "Short descriptive title (e.g., Morning Workout, Commute, Deep Work)",
  "startTime": "HH:MM", // 24-hour format string (e.g. 09:00, 13:30)
  "endTime": "HH:MM",   // 24-hour format string (e.g. 10:00, 17:00)
  "type": "One of exactly: 'Fixed', 'Focus', 'Personal', 'Commute', 'Work', 'Sleep', 'Relationship', 'Fitness', 'Free'",
  "isFixed": boolean (true for essential things like sleep, work, commute; false for flexible things),
  "allowOverride": boolean (true if the block is flexible and other tasks can be scheduled here, false if strictly protected)
}

Notes:
- Parse the time accurately into 24-hour strings.
- Ensure end time is strictly after start time. If something goes past midnight, end it at 23:59 or split it into blocks.
- Ensure no blocks overlap.
- Infer missing gaps as 'Free' type if appropriate, but stick primarily to what the user explicitly mentioned.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text();
    if (!text) {
      return { success: false, message: "Failed to generate routine from AI." };
    }

    const parsedBlocks = JSON.parse(text) as Omit<BlockFormData, "dayOfWeek">[];
    
    await connectToDatabase();

    // Clear existing blocks for this day
    await ScheduleBlock.deleteMany({ userId: session.user.id, dayOfWeek });

    // Insert new blocks
    const blocksToInsert = parsedBlocks.map((b) => ({
      ...b,
      userId: session.user.id,
      dayOfWeek,
      type: b.type as IScheduleBlock["type"],
    }));

    if (blocksToInsert.length > 0) {
      await ScheduleBlock.insertMany(blocksToInsert);
    }

    revalidatePath("/settings/routine");
    revalidatePath("/today");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error: any) {
    console.error("AI Routine Generation Error:", error);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}
