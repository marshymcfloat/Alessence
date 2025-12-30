import { Skeleton } from "@/components/ui/skeleton";

export default function AssistantLoading() {
  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      {/* Sidebar skeleton */}
      <div className="hidden w-72 border-r p-4 space-y-4 md:block">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
      
      {/* Main chat area skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="text-center py-12">
              <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-4" />
              <Skeleton className="h-6 w-64 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto mt-2" />
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Input area */}
        <div className="border-t p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

