"use client";

import FunnelComponent from '@/components/FunnelComponent';
import { useFunnel } from '@/hooks/useFunnel';

export default function HomePage() {
  const {
    participants,
    loadingParticipants,
    error,
    funnellingData,
    fetchFunnellingData,
    loadingFunnelling,
  } = useFunnel();

  if (loadingParticipants) return <p style={{ textAlign: 'center' }}>Loading...</p>;
  if (error) return <p style={{ textAlign: 'center' }}>Error loading participants.</p>;

  return (
    <FunnelComponent
      participants={participants}
      fetchFunnellingData={fetchFunnellingData}
      funnellingData={funnellingData}
      loadingFunnelling={loadingFunnelling}
    />
  );
}
