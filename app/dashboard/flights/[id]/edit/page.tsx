"use client";

import { useParams } from "next/navigation";
import { AirTicketComposer } from "@/components/agent/AirTicketComposer";
import { useFeatureGate } from "@/components/agent/ui";

export default function EditAirTicketPage() {
  const { id } = useParams<{ id: string }>();
  const enabled = useFeatureGate("air_ticket", "Air ticketing");
  return enabled ? <AirTicketComposer editId={id} /> : null;
}
