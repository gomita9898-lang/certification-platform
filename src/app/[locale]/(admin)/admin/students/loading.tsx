import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-36" />
          <Skeleton className="mt-1 h-5 w-24" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-4 py-3">
                    <Skeleton className="h-4 w-12" />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <Skeleton className="mx-auto h-4 w-20" />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <Skeleton className="mx-auto h-4 w-14" />
                  </th>
                  <th className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-36" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Skeleton className="mx-auto h-4 w-6" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
