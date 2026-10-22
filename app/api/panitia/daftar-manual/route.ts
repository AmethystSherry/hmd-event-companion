import { jsPDF } from "jspdf";
import { getStore } from "@/lib/data";
import { EVENT, keyLabel } from "@/lib/event";
import { isCrew } from "@/lib/server/access";

// P07d · Daftar manual (PDF): cadangan kalau semua sistem mati, dicetak H-1.
// Kolom sama dengan pratinjau Figma: ✓ · No · Nama · Instagram · Kode (nomor kunci).
const ROWS_PER_PAGE = 28;

export async function GET() {
  if (!(await isCrew())) return new Response("Masuk sebagai panitia dulu", { status: 401 });
  const store = await getStore();
  const guests = (await store.listGuests()).filter((g) => g.rsvp !== "tidak");
  const pages = Math.max(1, Math.ceil(guests.length / ROWS_PER_PAGE));

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const L = 18;
  const R = 192;
  const col = { check: L, no: L + 9, name: L + 21, ig: L + 110, code: R };

  for (let p = 0; p < pages; p++) {
    if (p > 0) doc.addPage();
    let y = 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("HMD · Daftar tamu", L, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(111, 107, 101);
    doc.text(`Minggu, 8 Nov 2026 · ${EVENT.location}`, L, y + 5.5);
    doc.setTextColor(181, 177, 171);
    doc.text(`Hal ${p + 1}/${pages}`, R, y + 5.5, { align: "right" });

    y += 12;
    doc.setDrawColor(16, 16, 16);
    doc.setLineWidth(0.3);
    doc.line(L, y, R, y);
    doc.setTextColor(111, 107, 101);
    // "✓" digambar (font standar PDF tidak punya glyph centang).
    doc.setDrawColor(111, 107, 101);
    doc.lines(
      [
        [1.1, 1.2],
        [2.2, -2.6],
      ],
      col.check + 0.8,
      y + 3.4,
    );
    doc.setDrawColor(16, 16, 16);
    doc.text("No", col.no, y + 4.6);
    doc.text("Nama", col.name, y + 4.6);
    doc.text("Instagram", col.ig, y + 4.6);
    doc.text("Kode", col.code, y + 4.6, { align: "right" });
    y += 7;
    doc.line(L, y, R, y);

    doc.setFontSize(10);
    doc.setLineWidth(0.15);
    guests.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE).forEach((g, i) => {
      const n = p * ROWS_PER_PAGE + i + 1;
      y += 8.5;
      doc.setDrawColor(16, 16, 16);
      doc.roundedRect(col.check, y - 3.6, 4.2, 4.2, 0.6, 0.6);
      doc.setTextColor(111, 107, 101);
      doc.text(String(n).padStart(2, "0"), col.no, y);
      doc.setTextColor(16, 16, 16);
      doc.text(g.name, col.name, y);
      doc.setTextColor(111, 107, 101);
      doc.text(`@${g.ig}`, col.ig, y);
      doc.text(keyLabel(g.keyNo), col.code, y, { align: "right" });
      doc.setDrawColor(230, 230, 230);
      doc.line(L, y + 3, R, y + 3);
    });

    if (p === pages - 1) {
      doc.setFontSize(9);
      doc.setTextColor(181, 177, 171);
      doc.text("Walk-in: tulis nama + IG di baliknya", L, y + 10);
    }
  }

  return new Response(doc.output("arraybuffer"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="daftar-manual-hmd.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
