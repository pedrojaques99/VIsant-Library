// O CSS deste bloco vem pelo campo `css` do item (vai para o globals.css no `shadcn add`).

export { MediaTimeline, type ClipChange, type MediaClip, type MediaTimelineProps, type MediaTrack } from "./media-timeline";
export { useMediaTimeline, type MediaTimelineController, type UseMediaTimelineOptions } from "./use-media-timeline";
export { createClock, useClockTime, WithTime, type Clock } from "./clock";
export { formatSeconds, rulerLabel, rulerScale, snapTo, timecode } from "./ruler";
export { Filmstrip, type FilmstripSprite } from "./filmstrip";
export { TrackHeaders, TrackRename, TRACK_HEADER_LABELS, type TrackHeader, type TrackHeaderLabels, type TrackState } from "./track-headers";
export { RULER_HEIGHT, TRACKS_TOP } from "./overlay";
export { cropRows, needsNewWindow, viewOf, VisibleTimeline, windowOf, type View } from "./window";
