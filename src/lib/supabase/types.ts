export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  favorite_drink: string | null;
  updated_at: string;
};

export type ToolCard = {
  id: string;
  user_id: string | null;
  goal: string;
  title: string;
  what_it_does: string;
  code: string;
  example_input: string;
  example_output: string;
  explanation: string;
  when_to_use: string;
  try_changing: string;
  tags: string[];
  difficulty: string;
  prompt: string;
  system_prompt: string;
  score: number;
  created_at: string;
  concept_id?: string | null;
  learner_attempt?: string | null;
};

export type LearnedConcept = {
  id: string;
  user_id: string;
  concept_id: string;
  tool_card_id: string | null;
  learned_at: string;
};

export type ClarificationKind = "custom" | "simpler" | "example";

export type ToolCardClarification = {
  id: string;
  user_id: string;
  tool_card_id: string;
  question_text: string;
  answer_text: string;
  kind: ClarificationKind;
  created_at: string;
};

export type ToolVote = {
  id?: string;
  user_id?: string;
  tool_card_id: string;
  value: number;
};

export type SavedTool = {
  id: string;
  user_id: string;
  tool_card_id: string;
  saved_at: string;
};

export function profileNeedsNames(profile: Profile | null) {
  if (!profile) return true;
  return !profile.first_name?.trim() || !profile.last_name?.trim();
}
