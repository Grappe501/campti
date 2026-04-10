import type {
  CharacterChoiceProfile,
  CharacterConstraint,
  CharacterPerceptionProfile,
  CharacterProfile,
  CharacterState,
  CharacterTrigger,
  CharacterVoiceProfile,
} from "@prisma/client";

export type CharacterProfileRecord = CharacterProfile;
export type CharacterStateRecord = CharacterState;
export type CharacterConstraintRecord = CharacterConstraint;
export type CharacterTriggerRecord = CharacterTrigger;
export type CharacterPerceptionProfileRecord = CharacterPerceptionProfile;
export type CharacterVoiceProfileRecord = CharacterVoiceProfile;
export type CharacterChoiceProfileRecord = CharacterChoiceProfile;

/** Deterministic bundle for scene / branch engines (see `getCharacterSimulationBundle`). */
export type CharacterSimulationBundle = {
  personId: string;
  profile: CharacterProfile | null;
  currentState: CharacterState | null;
  states: CharacterState[];
  constraints: CharacterConstraint[];
  triggers: CharacterTrigger[];
  perception: CharacterPerceptionProfile | null;
  voice: CharacterVoiceProfile | null;
  choice: CharacterChoiceProfile | null;
};

/** Context for future choice-space evaluation (Stage 12+). */
export type CharacterChoiceContext = {
  sceneId?: string;
  metaSceneId?: string;
  placeId?: string;
  payload?: unknown;
};
