import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-1 h-5 w-64" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Average score bar */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 flex-1 rounded-full" />
            <Skeleton className="h-5 w-12" />
          </div>
        </CardContent>
      </Card>

      {/* Recent activity cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, cardIdx) => (
          <Card key={cardIdx}>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="mt-1 h-4 w-28" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-1 h-3 w-48" />
                    </div>
                    <Skeleton className="ml-3 h-4 w-20 shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
