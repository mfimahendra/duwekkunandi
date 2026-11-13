import { getDb } from "./firebase";

// Satu dokumen Firestore = satu baris dari spreadsheet.
// Nama field di bawah diasumsikan; sesuaikan dengan field yang ditulis Google Apps Script.
export type Transaction = {
  id: string;
  tanggal: string;
  jam: string;
  bank: string;
  jenis: string;
  penerima: string;
  nominal: number;
  biaya: number;
  total: number;
  kategori: string;
  rekening: string;
  noReferensi: string;
  keterangan: string;
  sortTime: number;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const n = Number(value.replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}

function parseSortTime(tanggal: string, jam: string): number {
  const time = Date.parse(`${tanggal} ${jam}`.trim());
  return Number.isNaN(time) ? 0 : time;
}

export async function getTransactions(): Promise<Transaction[]> {
  const collection = process.env.FIRESTORE_COLLECTION ?? "transaksi";
  const snapshot = await getDb().collection(collection).limit(1000).get();

  return snapshot.docs
    .map((doc) => {
      const d = doc.data();
      const tanggal = toText(d.tanggal);
      const jam = toText(d.jam);
      const nominal = toNumber(d.nominal);
      const biaya = toNumber(d.biaya);
      return {
        id: doc.id,
        tanggal,
        jam,
        bank: toText(d.bank),
        jenis: toText(d.jenis),
        penerima: toText(d.penerima_penyedia),
        nominal,
        biaya,
        total: toNumber(d.total) || nominal + biaya,
        kategori: toText(d.kategori),
        rekening: toText(d.rekening),
        noReferensi: toText(d.no_referensi),
        keterangan: toText(d.keterangan),
        sortTime: parseSortTime(tanggal, jam),
      };
    })
    .sort((a, b) => b.sortTime - a.sortTime);
}
