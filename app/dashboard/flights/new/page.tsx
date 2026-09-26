"use client";

import { AirTicketComposer } from "@/components/agent/AirTicketComposer";
import { useFeatureGate } from "@/components/agent/ui";

export default function NewAirTicketPage() {
  const enabled = useFeatureGate("air_ticket", "Air ticketing");
  return enabled ? <AirTicketComposer /> : null;
}
