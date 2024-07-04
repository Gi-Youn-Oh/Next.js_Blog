import SignButtons from "@/components/SignButtons";
import { Suspense } from "react";
import SkeletonLoader from "./SkeletonLoader";

export default function SignPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <SignButtons />
    </Suspense>
  );
}