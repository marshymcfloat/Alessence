"use client";

import { motion } from "framer-motion";
import { ClassSchedule } from "../ClassSchedule";
import { CalendarView } from "../CalendarView";

interface ScheduleTabProps {
  initialSchedule: any[];
}

export function ScheduleTab({ initialSchedule }: ScheduleTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Schedule Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Schedule
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your class timetable and calendar events
          </p>
        </div>
      </div>

      {/* Combined Content Area */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Schedule - flexible width */}
        <div className="flex-1 min-w-0">
           <ClassSchedule initialSchedule={initialSchedule} />
        </div>
        
        {/* Sidebar Calendar - fixed width on large screens */}
        <div className="w-full xl:w-[320px] shrink-0">
           <div className="sticky top-4">
             <CalendarView />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
