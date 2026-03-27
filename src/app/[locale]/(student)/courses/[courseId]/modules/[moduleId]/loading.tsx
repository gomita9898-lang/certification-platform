import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Skeleton className="mb-4 h-8 w-28" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-9 w-80" />
        <Skeleton className="mt-3 h-6 w-full max-w-lg" />
      </div>

      {/* Video player placeholder */}
      <Skeleton className="mb-8 aspect-video w-full rounded-lg" />

      {/* Text content placeholder */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>

      {/* Separator */}
      <Skeleton className="my-8 h-px w-full" />

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-40 rounded-md" />

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-10 w-40 rounded-md" />
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
      </div>
    </div>
  );
}
