import type { VoteValue } from "@/lib/types";

export const VOTE_POINTS: Record<VoteValue, number> = {
  LOVE: 4,
  LIKE: 3,
  MAYBE: 2,
  NO: 0,
};

export function calculateVoteScore(votes: Array<{ value: VoteValue }>, eligibleParticipantCount = votes.length): number {
  if (votes.length === 0 || eligibleParticipantCount === 0) return 0;

  const earned = votes.reduce((total, vote) => total + VOTE_POINTS[vote.value], 0);
  return Math.round((earned / (eligibleParticipantCount * VOTE_POINTS.LOVE)) * 100);
}

export function countVotes(votes:Array<{value:VoteValue}>):Record<VoteValue,number>{const counts:Record<VoteValue,number>={LOVE:0,LIKE:0,MAYBE:0,NO:0};votes.forEach((vote)=>counts[vote.value]++);return counts;}
