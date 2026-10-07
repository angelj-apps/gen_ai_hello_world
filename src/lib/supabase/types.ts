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

export type Generation = {
  id: string;
  user_id: string;
  spot_id: string | null;
  prompt: string;
  system_prompt: string;
  caption: string;
  score: number;
  created_at: string;
};

export type Vote = {
  id?: string;
  user_id?: string;
  generation_id: string;
  value: number;
};

export type GenerationCard = {
  id: string;
  caption: string;
  prompt: string;
  score: number;
  created_at: string;
  spots: { name: string; neighborhood: string } | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
};

export function profileNeedsNames(profile: Profile | null) {
  if (!profile) return true;
  return !profile.first_name?.trim() || !profile.last_name?.trim();
}
