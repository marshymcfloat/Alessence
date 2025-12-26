import { GridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function FlashcardLoading() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <GridSkeleton count={6} />
    </div>
  );
}

