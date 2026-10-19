export type DiscoveryExercise = {
  skillId: string;
  prompt: string;
  /** Starter code in the Python box; empty string means a blank editor. */
  starterCode: string;
};

/** Wave 1 discovery exercises — required before learning each skill. */
export const DISCOVERY_BY_SKILL: Record<string, DiscoveryExercise> = {
  assign_value: {
    skillId: "assign_value",
    prompt: "Save the name of your favorite song in a variable called song.",
    starterCode: "",
  },
  print_value: {
    skillId: "print_value",
    prompt: 'Display "Welcome to the game!" on the screen.',
    starterCode: "",
  },
  input_read: {
    skillId: "input_read",
    prompt: "Let a user enter their destination and save it in destination.",
    starterCode: 'destination = ""',
  },
  arith_add: {
    skillId: "arith_add",
    prompt:
      "Calculate the final price after adding a $4 delivery fee to a $16 order.",
    starterCode: "price = 16\ndelivery = 4",
  },
  equality: {
    skillId: "equality",
    prompt: "Check whether the two PIN entries match.",
    starterCode: 'pin1 = "4821"\npin2 = "4821"',
  },
  inequality: {
    skillId: "inequality",
    prompt:
      "Check whether the current player and the previous winner are different people.",
    starterCode: 'player = "Kai"\nwinner = "Mina"',
  },
  compare_order: {
    skillId: "compare_order",
    prompt:
      "Check whether a train ticket costing $28 is cheaper than one costing $35.",
    starterCode: "",
  },
  if_branch: {
    skillId: "if_branch",
    prompt: 'Display "Low battery!" when the battery level is below 15.',
    starterCode: "battery = 12",
  },
  if_else: {
    skillId: "if_else",
    prompt:
      'Display "On time" if a bus arrives by 9:00. Otherwise, display "Late".',
    starterCode: "arrival_time = 9.15",
  },
  bool_and: {
    skillId: "bool_and",
    prompt:
      "Check whether a student can enter an event only if they have a ticket and their name is on the guest list.",
    starterCode: "has_ticket = True\non_guest_list = False",
  },
  bool_or: {
    skillId: "bool_or",
    prompt:
      "Check whether a player earns a bonus for finding a secret item or completing a bonus level.",
    starterCode: "found_secret = False\nbeat_bonus_level = True",
  },
  list_create: {
    skillId: "list_create",
    prompt:
      "Store the names of three cities you'd like to visit in a list called cities.",
    starterCode: "",
  },
  list_length: {
    skillId: "list_length",
    prompt: "Find how many songs are in this playlist.",
    starterCode: 'playlist = ["Blue", "Orbit", "Home", "Drift"]',
  },
  list_index: {
    skillId: "list_index",
    prompt: "Get the second stop on this itinerary.",
    starterCode: 'stops = ["Museum", "Park", "Bookstore"]',
  },
  list_membership: {
    skillId: "list_membership",
    prompt: 'Check whether "mango" is on the grocery list.',
    starterCode: 'groceries = ["rice", "mango", "eggs"]',
  },
  list_absence: {
    skillId: "list_absence",
    prompt:
      'Check whether "password123" is missing from the list of blocked passwords.',
    starterCode: 'blocked = ["qwerty", "letmein", "abc123"]',
  },
  list_append: {
    skillId: "list_append",
    prompt: 'Add "Submit assignment" to the existing to-do list.',
    starterCode: 'tasks = ["Read chapter", "Take notes"]',
  },
  string_combine: {
    skillId: "string_combine",
    prompt:
      "Combine a first name and a last name into one full name, with a space between them.",
    starterCode: 'first = "Jordan"\nlast = "Lee"',
  },
  string_length: {
    skillId: "string_length",
    prompt: "Check whether an invitation code has at least eight characters.",
    starterCode: 'code = "SUNSET42"',
  },
  string_index: {
    skillId: "string_index",
    prompt: "Get the first character of this airport code.",
    starterCode: 'airport = "JFK"',
  },
  for_loop: {
    skillId: "for_loop",
    prompt: "Print each item on the packing list, one at a time.",
    starterCode: 'packing = ["charger", "jacket", "headphones"]',
  },
  loop_accumulate: {
    skillId: "loop_accumulate",
    prompt:
      "Calculate the total number of minutes spent on these three activities.",
    starterCode: "minutes = [20, 35, 15]",
  },
};

export function getDiscoveryExercise(
  skillId: string,
): DiscoveryExercise | undefined {
  return DISCOVERY_BY_SKILL[skillId];
}

/** True when the learner has moved past the untouched starter. */
export function discoveryAttempted(
  starterCode: string,
  attempt: string,
): boolean {
  const starter = starterCode.replace(/\r\n/g, "\n").trimEnd();
  const current = attempt.replace(/\r\n/g, "\n").trimEnd();
  if (!starter) return current.trim().length > 0;
  return current !== starter;
}
