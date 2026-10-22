import QRCode from "qrcode";

// QR tiket (server): isi hanya `ticketId.sig`. SVG inline supaya tajam & bisa di-cache offline.
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
