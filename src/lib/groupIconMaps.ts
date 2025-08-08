const ICON_BASE = "/icons" as const;
const FALLBACK_ICON = "/window.svg";

export type GroupCategoryId =
  | 'group_shot_cat_family'
  | 'group_shot_cat_wedding_party'
  | 'group_shot_cat_extended_family'
  | 'group_shot_cat_friends'
  | 'group_shot_cat_fun'
  | 'group_shot_cat_others';

const categoryToIcon: Record<GroupCategoryId, string> = {
  group_shot_cat_family: `${ICON_BASE}/detailscat.svg`,
  group_shot_cat_wedding_party: `${ICON_BASE}/band.svg`,
  group_shot_cat_extended_family: `${ICON_BASE}/detailscat.svg`,
  group_shot_cat_friends: `${ICON_BASE}/drinks.svg`,
  group_shot_cat_fun: `${ICON_BASE}/confetti.svg`,
  group_shot_cat_others: `${ICON_BASE}/others.svg`,
};

export function getGroupCategoryIconSrc(categoryId: GroupCategoryId): string {
  return categoryToIcon[categoryId] || FALLBACK_ICON;
}

export const GENERIC_GROUP_ICON = `${ICON_BASE}/couplephotos.svg`;


