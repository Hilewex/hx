import { RankingInput, RankingOutput, RecommendationInput, RecommendationOutput } from '@hx/contracts';

/**
 * Minimum ranking foundation helper for smoke readiness
 * - Takes public-safe candidate set
 * - Does not mutate commerce/content/social truth
 * - Returns boundary flags
 */
export function rankCandidates(input: RankingInput): RankingOutput {
  // We simulate ranking logic simply by sorting candidates by a deterministic factor (e.g. scoreFoundationOnly)
  // Hidden/unavailable candidates are NOT re-included, we only process the public-safe set provided in input.
  const ranked = [...input.candidates].sort((a, b) => b.scoreFoundationOnly - a.scoreFoundationOnly);

  return {
    rankingFinal: true, // we are simulating final rank
    recommendationTruthMutated: false,
    productTruthMutated: false,
    priceTruthMutated: false,
    stockTruthMutated: false,
    mediaTruthMutated: false,
    searchCandidateTruthMutated: false,
    businessTruthMutated: false,
    outputPublicSafe: true, // Output strictly derives from public-safe input
    rankedCandidates: ranked
  };
}

/**
 * Minimum recommendation foundation helper for smoke readiness
 * - Produces recommendation list from public-safe candidates
 * - Mutates NO truths
 */
export function recommendCandidates(input: RecommendationInput): RecommendationOutput {
  // We simply simulate returning recommendations (e.g., shuffling or returning as is)
  const recommendations = [...input.publicSafeCandidates];
  
  return {
    rankingFinal: true,
    recommendationTruthMutated: false,
    productTruthMutated: false,
    priceTruthMutated: false,
    stockTruthMutated: false,
    mediaTruthMutated: false,
    searchCandidateTruthMutated: false,
    businessTruthMutated: false,
    outputPublicSafe: true, // Only recommending from public-safe inputs
    recommendations: recommendations
  };
}
