import QRCode from "qrcode";

// QR tiket (server): isi hanya `ticketId.sig`, tanpa data pribadi. SVG inline supaya tajam &
// ikut ter-cache bersama halaman untuk offline. Warna QR tetap (hitam di putih) di kedua mode.
// Ukuran ikut wadah (140 di tiket, layar penuh di mode "Kecerahan maks" T05).
export async function TicketQr({ payload, label }: { payload: string; label: string }) {
  const svg = await QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#101010", light: "#ffffff" },
  });
  return (
    <div
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{
        __html: svg.replace("<svg ", '<svg width="100%" height="100%" style="display:block" '),
      }}
    />
  );
}
