import { LocationType, TimelineEventType } from "@/types";

// Public icon base path
const ICON_BASE = "/icons" as const;
const FALLBACK_ICON = "/window.svg"; // safe built-in fallback from public

const locationTypeToIcon: Record<LocationType, string> = {
  [LocationType.MAIN_VENUE]: `${ICON_BASE}/reception.svg`,
  [LocationType.CEREMONY]: `${ICON_BASE}/ceremony.svg`,
  [LocationType.GETTING_READY_1]: `${ICON_BASE}/bridalprep.svg`,
  [LocationType.GETTING_READY_2]: `${ICON_BASE}/bridalprep.svg`,
  [LocationType.RECEPTION]: `${ICON_BASE}/reception.svg`,
  [LocationType.PHOTO_LOCATION]: `${ICON_BASE}/camera.svg`,
  [LocationType.ACCOMMODATION]: `${ICON_BASE}/accommodation.svg`,
  [LocationType.OTHER]: `${ICON_BASE}/detailscat.svg`,
};

const eventTypeToIcon: Record<TimelineEventType, string> = {
  [TimelineEventType.BRIDAL_PREP]: `${ICON_BASE}/bridalprep.svg`,
  [TimelineEventType.GROOM_PREP]: `${ICON_BASE}/bridalprep.svg`,
  [TimelineEventType.GUESTS_ARRIVE]: `${ICON_BASE}/drinks.svg`,
  [TimelineEventType.CEREMONY_BEGINS]: `${ICON_BASE}/ceremony.svg`,
  [TimelineEventType.CONFETTI_AND_MINGLING]: `${ICON_BASE}/confetti.svg`,
  [TimelineEventType.RECEPTION_DRINKS]: `${ICON_BASE}/drinks.svg`,
  [TimelineEventType.GROUP_PHOTOS]: `${ICON_BASE}/camera.svg`,
  [TimelineEventType.COUPLE_PORTRAITS]: `${ICON_BASE}/couplephotos.svg`,
  [TimelineEventType.WEDDING_BREAKFAST]: `${ICON_BASE}/breakfast.svg`,
  [TimelineEventType.SPEECHES]: `${ICON_BASE}/dj.svg`,
  [TimelineEventType.EVENING_GUESTS_ARRIVE]: `${ICON_BASE}/drinks.svg`,
  [TimelineEventType.CAKE_CUTTING]: `${ICON_BASE}/cakecut.svg`,
  [TimelineEventType.FIRST_DANCE]: `${ICON_BASE}/djband.svg`,
  [TimelineEventType.EVENING_ENTERTAINMENT]: `${ICON_BASE}/dj.svg`,
  [TimelineEventType.EVENING_BUFFET]: `${ICON_BASE}/buffet.svg`,
  [TimelineEventType.CARRIAGES]: `${ICON_BASE}/carriages.svg`,
  [TimelineEventType.OTHER]: `${ICON_BASE}/detailscat.svg`,
};

// Return a robust icon path, with a last-resort fallback to a known public asset
export function getLocationIconSrc(type: LocationType): string {
  return locationTypeToIcon[type] || FALLBACK_ICON;
}

export function getTimelineEventIconSrc(type: TimelineEventType): string {
  return eventTypeToIcon[type] || FALLBACK_ICON;
}


