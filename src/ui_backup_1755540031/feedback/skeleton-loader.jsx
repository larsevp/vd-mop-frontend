import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function SkeletonLoader({ cardCount = 3, cardHeight = 150, cardSpacing = 16 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: cardCount }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm"
          style={{ marginBottom: cardSpacing }}
        >
          <Skeleton height={cardHeight} />
        </div>
      ))}
    </div>
  );
}
