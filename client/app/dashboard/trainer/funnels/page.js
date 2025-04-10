"use client";

import { Input, Button } from '@/components/ui/components';
import FunnelComponent from '@/components/FunnelComponent';
import { useFunnel } from '@/hooks/useFunnel';

export default function HomePage() {
  const {
    participants,
    funnellingData,
    funnellingMessage,
    loadingParticipants,
    loadingFunnelling,
    error,
    fetchFunnellingData,
  } = useFunnel();

  if (loadingParticipants) return (
    <div className="text-center p-8 text-gray-500 dark:text-gray-400">
      Loading...
    </div>
  );

  if (error) return (
    <div className="text-center p-8 text-red-500 dark:text-red-400">
      Error loading participants.
    </div>
  );

  return (
    <div className="dark:bg-gray-900 min-h-screen p-8">
      <FunnelComponent
        participants={participants}
        fetchFunnellingData={fetchFunnellingData}
        funnellingData={funnellingData}
        funnellingMessage={funnellingMessage}
        loadingFunnelling={loadingFunnelling}
      />
    </div>
  );
}