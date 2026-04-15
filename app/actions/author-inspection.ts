"use server";

import {
  runAuthorialInspection,
  type AuthorialInspectionRequest,
} from "@/lib/services/authorial-inspection-service";
import { assertCapabilitySurfaceOwnership } from "@/lib/services/ui-ownership-service";

/**
 * P3-R — Author/admin-only action.
 * Keep separate from reader cockpit actions.
 */
export async function actionRunAuthorialInspection(request: AuthorialInspectionRequest) {
  assertCapabilitySurfaceOwnership({
    capability: "author_inspection",
    requestedSurface: "author",
  });
  return runAuthorialInspection(request);
}
