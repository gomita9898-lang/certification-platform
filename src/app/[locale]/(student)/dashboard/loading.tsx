import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Title skeleton */}
      <div className="mb-10">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-2 h-5 w-48" />
      </div>

      {/* Section heading */}
      <Skeleton className="mb-6 h-7 w-40" />

      {/* Course cards grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>

            <CardContent className="flex-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>

            <CardFooter>
              <Skeleton className="h-10 w-full rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
