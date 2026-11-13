"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { syncTransaksi } from "@/app/actions/sync";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncTransaksi();
      alert(
        result.ok
          ? `Sync berhasil: ${result.count} transaksi diambil dari Sheets.`
          : `Sync gagal: ${result.error}`,
      );
    });
  }

  return (
    <Button type="button" variant="outline" disabled={isPending} onClick={handleSync}>
      <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} aria-hidden />
      {isPending ? "Menyinkronkan..." : "Sync"}
    </Button>
  );
}
