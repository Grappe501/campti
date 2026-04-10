import { redirect } from "next/navigation";

/** Avoids `/admin/narrative-rules/[id]` capturing the literal segment `constitutional`. */
export default function ConstitutionalSegmentRedirect() {
  redirect("/admin/narrative-rules");
}
