/** Cache tags. Every admin write calls `updateTag` for the tags it affects. */
export const TAGS = {
  settings: "settings",
  firms: "firms",
  accounts: "accounts",
  snapshots: "snapshots",
  positions: "positions",
  strategies: "strategies",
  trades: "trades",
  payouts: "payouts",
  journal: "journal",
  toolkit: "toolkit",
  goals: "goals",
  posts: "posts",
  milestones: "milestones",
  demo: "demo",
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];
