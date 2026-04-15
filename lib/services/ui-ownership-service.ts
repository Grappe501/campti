export type OwnershipSurface = "reader" | "author" | "internal";

export type OwnershipCapability =
  | "story_reentry"
  | "author_inspection"
  | "conversation_observer"
  | "reader_cockpit";

type CapabilityOwnership = {
  capability: OwnershipCapability;
  surface: OwnershipSurface;
  owner: "reader_experience" | "authoring_console" | "platform_internal";
};

const OWNERSHIP_REGISTRY: Record<OwnershipCapability, CapabilityOwnership> = {
  story_reentry: {
    capability: "story_reentry",
    surface: "reader",
    owner: "reader_experience",
  },
  author_inspection: {
    capability: "author_inspection",
    surface: "author",
    owner: "authoring_console",
  },
  conversation_observer: {
    capability: "conversation_observer",
    surface: "author",
    owner: "authoring_console",
  },
  reader_cockpit: {
    capability: "reader_cockpit",
    surface: "reader",
    owner: "reader_experience",
  },
};

export function resolveCapabilityOwnership(capability: OwnershipCapability): CapabilityOwnership {
  return OWNERSHIP_REGISTRY[capability];
}

export function assertCapabilitySurfaceOwnership(input: {
  capability: OwnershipCapability;
  requestedSurface: OwnershipSurface;
}): CapabilityOwnership {
  const ownership = resolveCapabilityOwnership(input.capability);
  if (ownership.surface !== input.requestedSurface) {
    throw new Error(
      `[ui-ownership] ${input.capability} belongs to ${ownership.surface} surface, requested ${input.requestedSurface}.`
    );
  }
  return ownership;
}
