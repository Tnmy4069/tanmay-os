import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

import connectToDatabase from "@/lib/db";
import ScheduleBlock from "@/models/ScheduleBlock";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    await connectToDatabase();

    const blocksToSeed = [];

    // MONDAY - FRIDAY (1-5)
    for (let day = 1; day <= 5; day++) {
      blocksToSeed.push(
        { userId, dayOfWeek: day, startTime: "07:15", endTime: "08:00", title: "Wake up & Get Ready", type: "Personal", isFixed: true },
        { userId, dayOfWeek: day, startTime: "08:00", endTime: "09:00", title: "Home → MITCON commute", type: "Commute", isFixed: true },
        { userId, dayOfWeek: day, startTime: "09:00", endTime: "18:00", title: "MITCON — Planeteye Infra AI", type: "Work", isFixed: true },
        { userId, dayOfWeek: day, startTime: "18:00", endTime: "19:00", title: "MITCON → Home commute", type: "Commute", isFixed: true },
        { userId, dayOfWeek: day, startTime: "19:00", endTime: "19:30", title: "Dinner & Freshen up", type: "Personal", isFixed: true },
        { userId, dayOfWeek: day, startTime: "19:30", endTime: "19:45", title: "Mental Reset", type: "Personal", isFixed: true },
        { userId, dayOfWeek: day, startTime: "19:45", endTime: "21:45", title: "Main Focus Block", type: "Focus", isFixed: true },
        { userId, dayOfWeek: day, startTime: "21:45", endTime: "22:30", title: "Secondary Focus", type: "Focus", isFixed: true },
        { userId, dayOfWeek: day, startTime: "22:30", endTime: "23:00", title: "Wind down", type: "Personal", isFixed: true },
        { userId, dayOfWeek: day, startTime: "23:00", endTime: "23:30", title: "GF Time", type: "Relationship", isFixed: true },
        { userId, dayOfWeek: day, startTime: "23:30", endTime: "23:59", title: "Sleep", type: "Sleep", isFixed: true },
        { userId, dayOfWeek: day, startTime: "00:00", endTime: "07:15", title: "Sleep", type: "Sleep", isFixed: true }
      );
    }

    // SATURDAY (6)
    blocksToSeed.push(
      { userId, dayOfWeek: 6, startTime: "00:00", endTime: "07:00", title: "Sleep", type: "Sleep", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "07:00", endTime: "08:00", title: "Wake + Breakfast", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "08:00", endTime: "10:00", title: "IITM Mathematics", type: "Focus", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "10:00", endTime: "10:30", title: "Break", type: "Free", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "10:30", endTime: "12:30", title: "IITM Python", type: "Focus", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "12:30", endTime: "14:00", title: "Lunch & Rest", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "14:00", endTime: "15:30", title: "Weekly Assignment", type: "Focus", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "15:30", endTime: "16:00", title: "Break", type: "Free", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "16:00", endTime: "17:30", title: "DSA / Aptitude", type: "Focus", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "17:30", endTime: "18:30", title: "Fitness", type: "Fitness", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "18:30", endTime: "19:30", title: "Dinner", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "19:30", endTime: "21:00", title: "Leadership Backlog", type: "Work", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "21:00", endTime: "22:00", title: "Free Time", type: "Free", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "22:00", endTime: "23:00", title: "Relax", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "23:00", endTime: "23:30", title: "GF Time", type: "Relationship", isFixed: true },
      { userId, dayOfWeek: 6, startTime: "23:30", endTime: "23:59", title: "Sleep", type: "Sleep", isFixed: true }
    );

    // SUNDAY (0)
    blocksToSeed.push(
      { userId, dayOfWeek: 0, startTime: "00:00", endTime: "07:00", title: "Sleep", type: "Sleep", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "07:00", endTime: "08:00", title: "Wake + Breakfast", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "08:00", endTime: "10:00", title: "Weekly Assignment", type: "Focus", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "10:00", endTime: "10:30", title: "Break", type: "Free", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "10:30", endTime: "12:00", title: "Exam Prep / Revision", type: "Focus", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "12:00", endTime: "14:00", title: "Lunch & Family", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "14:00", endTime: "15:30", title: "Job / Interview Prep", type: "Work", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "15:30", endTime: "16:00", title: "Break", type: "Free", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "16:00", endTime: "17:00", title: "DSA / Aptitude", type: "Focus", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "17:00", endTime: "18:00", title: "Fitness", type: "Fitness", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "18:00", endTime: "19:00", title: "Family", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "19:00", endTime: "20:00", title: "Dinner", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "20:00", endTime: "21:00", title: "Free Time", type: "Free", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "21:00", endTime: "22:00", title: "Weekly Review", type: "Focus", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "22:00", endTime: "23:00", title: "Relax", type: "Personal", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "23:00", endTime: "23:30", title: "GF Time", type: "Relationship", isFixed: true },
      { userId, dayOfWeek: 0, startTime: "23:30", endTime: "23:59", title: "Sleep", type: "Sleep", isFixed: true }
    );

    // Fetch existing fixed blocks for the user
    const existingBlocks = await ScheduleBlock.find({ userId, isFixed: true }).lean();
    
    // Create a composite key for existing blocks to identify them quickly
    const existingKeys = new Set(existingBlocks.map(b => `${b.dayOfWeek}-${b.startTime}-${b.endTime}`));

    const blocksToInsert = blocksToSeed.filter(b => !existingKeys.has(`${b.dayOfWeek}-${b.startTime}-${b.endTime}`));

    if (blocksToInsert.length > 0) {
      await ScheduleBlock.insertMany(blocksToInsert);
      return NextResponse.json({ message: `Seeded ${blocksToInsert.length} missing default blocks successfully!` }, { status: 201 });
    } else {
      return NextResponse.json({ message: "Default routine is already fully seeded. Skipped." }, { status: 200 });
    }
  } catch (error) {
    console.error("Seed error details:", error);
    return NextResponse.json({ error: "Seed failed", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
