import { redirect } from "next/navigation";

// `/` = pintu panitia: langsung ke /panitia (P01 PIN, atau PE01 kalau udah masuk).
// Tamu masuk lewat link unik /t/{token}; alat dev & design system di /dev.
export default function Home() {
  redirect("/panitia");
}
