/** Discrete actions emitted by voice or gaze dwell (scene reader). */

export type HandsFreeAction =
  | { type: "next" }
  | { type: "previous" }
  | { type: "brighter" }
  | { type: "dimmer" }
  | { type: "zoomIn" }
  | { type: "zoomOut" }
  | { type: "goToChapter"; chapterNumber: number }
  | { type: "scrollDown" }
  | { type: "scrollUp" };
