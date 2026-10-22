import QRCode from "qrcode";

// QR tiket (server): isi hanya `ticketId.sig`, tanpa data pribadi. SVG inline supaya tajam &
// ikut ter-cache bersama halaman untuk offline. Warna QR tetap (hitam di putih) di kedua mode.
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
      style={{ width: 140, height: 140 }}
      dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", '<svg width="140" height="140" ') }}
    />
  );
}
