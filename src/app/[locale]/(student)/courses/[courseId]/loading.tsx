import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Course header */}
      <div className="mb-10">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="mt-3 h-6 w-full max-w-lg" />
      </div>

      {/* Module list section */}
      <section className="mb-12">
        <Skeleton className="mb-6 h-7 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="mt-2 h-4 w-72" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24 shrink-0 rounded-full" />
                </div>
              </CardHeader>
              {i < 2 && (
                <CardFooter>
                  <Skeleton className="h-9 w-36 rounded-md" />
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Exam section skeleton */}
      <Skeleton className="mb-8 h-px w-full" />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-0.5 h-6 w-6" />
              <div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-56" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
