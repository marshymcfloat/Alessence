"use server";

import { prisma } from "@repo/db/server";
import { getCurrentUser } from "./authActions";
import { revalidatePath } from "next/cache";

export async function getClassSchedule() {
  try {
    const userResponse = await getCurrentUser();
    if (!userResponse.success || !userResponse.data) {
      return { success: false, error: "Unauthorized" };
    }
    
    const user = userResponse.data;

    const schedule = await prisma.classSchedule.findMany({
      where: {
        userId: user.id,
      },
      include: {
        subject: true,
      },
      orderBy: [
        {
          startTime: "asc",
        },
      ],
    });

    return { success: true, data: schedule };
  } catch (error) {
    console.error("Error fetching class schedule:", error);
    return { success: false, error: "Failed to fetch class schedule" };
  }
}

export async function updateClassSchedule(id: number, room: string | null, instructor: string | null) {
  try {
    const userResponse = await getCurrentUser();
    if (!userResponse.success || !userResponse.data) {
      return { success: false, error: "Unauthorized" };
    }

    const user = userResponse.data;

    // Verify ownership
    const existingSchedule = await prisma.classSchedule.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingSchedule) {
      return { success: false, error: "Schedule item not found or unauthorized" };
    }

    const updatedSchedule = await prisma.classSchedule.update({
      where: {
        id,
      },
      data: {
        room,
        instructor,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: updatedSchedule };
  } catch (error) {
    console.error("Error updating class schedule:", error);
    return { success: false, error: "Failed to update class schedule" };
  }
}
