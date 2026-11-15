import ApplicantPortal from "@/components/ApplicantPortal";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
        </div>
      }
    >
      <ApplicantPortal />
    </Suspense>
  );
}
