import { Suspense } from 'react';
import { HomeView } from '@/components/HomeView';
import { SkeletonGrid } from '@/components/states/SkeletonGrid';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
          <SkeletonGrid />
        </div>
      }
    >
      <HomeView />
    </Suspense>
  );
}
