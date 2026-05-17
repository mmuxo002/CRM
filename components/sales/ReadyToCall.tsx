"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall, Lock } from "lucide-react";

export function ReadyToCall({ leadId, initial }: { leadId: string; initial: string }) {
  const [status, setStatus] = useState(initial);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const locked = status === "READY_TO_CALL";
  const mark = async () => {
    if (locked) return;
    setLoading(true);
    await fetch(`/api/leads/${leadId}/ready`, { method: "POST" });
    setStatus("READY_TO_CALL");
    setLoading(false);
    router.refresh();
  };

  return (
    <button className={`ready-to-call-btn ${locked ? "locked" : ""}`} onClick={mark} disabled={loading || locked}>
      {locked ? <Lock size={16} /> : <PhoneCall size={16} />}
      {locked ? "Locked · Pushed to High Level" : loading ? "Pushing to High Level…" : "Mark Ready to Call"}
    </button>
  );
}
