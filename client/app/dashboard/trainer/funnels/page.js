"use client";

import FunnelComponent from '@/components/FunnelComponent';
import { useFunnel } from '@/hooks/useFunnel';

export default function HomePage() {
  const { participants, loading, error } = useFunnel();

  if (loading) return <p style={{ textAlign: 'center' }}>Loading...</p>;
  if (error) return <p style={{ textAlign: 'center' }}>Error loading participants.</p>;

  return <FunnelComponent participants={participants} />;
}
