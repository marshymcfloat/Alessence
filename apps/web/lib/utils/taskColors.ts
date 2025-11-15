export type DeadlineUrgency = "overdue" | "urgent" | "soon" | "normal";

export function getDeadlineUrgency(deadline: Date): DeadlineUrgency {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "overdue"; // Past deadline
  } else if (diffDays <= 1) {
    return "urgent"; // Due today or tomorrow
  } else if (diffDays <= 3) {
    return "soon"; // Due within 3 days
  } else {
    return "normal"; // More than 3 days away
  }
}

export function getDeadlineBorderColor(urgency: DeadlineUrgency): string {
  switch (urgency) {
    case "overdue":
      return "border-red-500 border-2"; // Red for overdue
    case "urgent":
      return "border-orange-500 border-2"; // Orange for urgent
    case "soon":
      return "border-yellow-500 border-2"; // Yellow for soon
    case "normal":
      return "border-gray-300"; // Gray for normal
    default:
      return "border-gray-300";
  }
}

export function getSubjectColor(subjectId: number | null | undefined): string {
  if (!subjectId) {
    return "bg-gray-200 border-gray-300"; // Default color for tasks without subject
  }

  const colors = [
    "bg-blue-100 border-blue-400",
    "bg-purple-100 border-purple-400",
    "bg-pink-100 border-pink-400",
    "bg-green-100 border-green-400",
    "bg-yellow-100 border-yellow-400",
    "bg-indigo-100 border-indigo-400",
    "bg-red-100 border-red-400",
    "bg-teal-100 border-teal-400",
    "bg-orange-100 border-orange-400",
    "bg-cyan-100 border-cyan-400",
    "bg-rose-100 border-rose-400",
    "bg-emerald-100 border-emerald-400",
    "bg-violet-100 border-violet-400",
    "bg-amber-100 border-amber-400",
    "bg-lime-100 border-lime-400",
  ];

  const colorIndex = subjectId % colors.length;
  return colors[colorIndex]!;
}

export function getTaskCardBorderColor(
  subjectId: number | null | undefined,
  deadline: Date
): string {
  const urgency = getDeadlineUrgency(deadline);
  const urgencyColor = getDeadlineBorderColor(urgency);
  const subjectColor = getSubjectColor(subjectId);

  const subjectBorderMatch = subjectColor.match(/border-(\w+)-(\d+)/);
  const subjectBorder = subjectBorderMatch
    ? `border-${subjectBorderMatch[1]}-${subjectBorderMatch[2]}`
    : "border-gray-300";

  return `${urgencyColor} ${subjectBorder}`;
}

export function getSubjectLeftBorder(
  subjectId: number | null | undefined
): string {
  if (!subjectId) {
    return "border-l-gray-300";
  }

  const borderColors = [
    "border-l-blue-400",
    "border-l-purple-400",
    "border-l-pink-400",
    "border-l-green-400",
    "border-l-yellow-400",
    "border-l-indigo-400",
    "border-l-red-400",
    "border-l-teal-400",
    "border-l-orange-400",
    "border-l-cyan-400",
    "border-l-rose-400",
    "border-l-emerald-400",
    "border-l-violet-400",
    "border-l-amber-400",
    "border-l-lime-400",
  ];

  const colorIndex = subjectId % borderColors.length;
  return borderColors[colorIndex]!;
}

export function getSubjectBackground(
  subjectId: number | null | undefined
): string {
  if (!subjectId) {
    return "bg-gray-50";
  }

  const bgColors = [
    "bg-blue-50",
    "bg-purple-50",
    "bg-pink-50",
    "bg-green-50",
    "bg-yellow-50",
    "bg-indigo-50",
    "bg-red-50",
    "bg-teal-50",
    "bg-orange-50",
    "bg-cyan-50",
    "bg-rose-50",
    "bg-emerald-50",
    "bg-violet-50",
    "bg-amber-50",
    "bg-lime-50",
  ];

  const colorIndex = subjectId % bgColors.length;
  return bgColors[colorIndex]!;
}
