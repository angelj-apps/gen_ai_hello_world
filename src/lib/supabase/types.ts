export type Spot = {
  id: string;
  name: string;
  neighborhood: string;
  note: string;
};

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  favorite_drink: string | null;
  updated_at: string;
};

export function profileNeedsNames(profile: Profile | null) {
  if (!profile) return true;
  return !profile.first_name?.trim() || !profile.last_name?.trim();
}
