"use server";

import {
  cockpitEndConversation as cockpitEndConversationService,
  cockpitFetchLatestState as cockpitFetchLatestStateService,
  cockpitPauseConversation as cockpitPauseConversationService,
  cockpitResumeConversation as cockpitResumeConversationService,
  cockpitSetPresentationPlaybackPreference as cockpitSetPresentationPlaybackPreferenceService,
  cockpitStartConversationFromScene as cockpitStartConversationFromSceneService,
  cockpitSubmitReaderTurn as cockpitSubmitReaderTurnService,
} from "@/lib/services/reader-cockpit-command-service";
import { assertCapabilitySurfaceOwnership } from "@/lib/services/ui-ownership-service";

export async function cockpitStartConversationFromScene(
  params: Parameters<typeof cockpitStartConversationFromSceneService>[0]
) {
  assertCapabilitySurfaceOwnership({
    capability: "reader_cockpit",
    requestedSurface: "reader",
  });
  return await cockpitStartConversationFromSceneService(params);
}

export async function cockpitSubmitReaderTurn(
  params: Parameters<typeof cockpitSubmitReaderTurnService>[0]
) {
  assertCapabilitySurfaceOwnership({
    capability: "reader_cockpit",
    requestedSurface: "reader",
  });
  return await cockpitSubmitReaderTurnService(params);
}

export async function cockpitFetchLatestState(
  params: Parameters<typeof cockpitFetchLatestStateService>[0]
) {
  assertCapabilitySurfaceOwnership({
    capability: "reader_cockpit",
    requestedSurface: "reader",
  });
  return await cockpitFetchLatestStateService(params);
}

export async function cockpitPauseConversation(
  params: Parameters<typeof cockpitPauseConversationService>[0]
) {
  assertCapabilitySurfaceOwnership({
    capability: "reader_cockpit",
    requestedSurface: "reader",
  });
  return await cockpitPauseConversationService(params);
}

export async function cockpitResumeConversation(
  params: Parameters<typeof cockpitResumeConversationService>[0]
) {
  assertCapabilitySurfaceOwnership({
    capability: "reader_cockpit",
    requestedSurface: "reader",
  });
  return await cockpitResumeConversationService(params);
}

export async function cockpitEndConversation(
  params: Parameters<typeof cockpitEndConversationService>[0]
) {
  assertCapabilitySurfaceOwnership({
    capability: "reader_cockpit",
    requestedSurface: "reader",
  });
  return await cockpitEndConversationService(params);
}

export async function cockpitSetPresentationPlaybackPreference(
  params: Parameters<typeof cockpitSetPresentationPlaybackPreferenceService>[0]
) {
  assertCapabilitySurfaceOwnership({
    capability: "reader_cockpit",
    requestedSurface: "reader",
  });
  return await cockpitSetPresentationPlaybackPreferenceService(params);
}
