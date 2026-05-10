import { rankCandidates, recommendCandidates } from '@hx/ranking';
import { RankingInput, RecommendationInput } from '@hx/contracts';

export const rankingRecommendationReadinessSmoke = {
  name: 'Ranking / Recommendation Smoke Readiness',
  run: async (baseUrl: string) => {
    try {
      // 1. Search Surface Ranking Test
      const searchInput: RankingInput = {
        surface: 'search',
        inputCandidateSetSource: 'search-public-candidates',
        candidates: [
          { candidateId: 'c1', productId: 'p1', scoreFoundationOnly: 10 },
          { candidateId: 'c2', productId: 'p2', scoreFoundationOnly: 50 },
          { candidateId: 'c3', productId: 'p3', scoreFoundationOnly: 30 }
        ]
      };

      const searchOutput = rankCandidates(searchInput);

      if (searchOutput.rankedCandidates[0].productId !== 'p2') {
        return { result: 'FAIL', message: 'Ranking did not sort search candidates correctly.' };
      }
      if (!searchOutput.outputPublicSafe) {
        return { result: 'FAIL', message: 'Ranking output is not marked as public safe.' };
      }
      if (searchOutput.searchCandidateTruthMutated || searchOutput.productTruthMutated) {
        return { result: 'FAIL', message: 'Ranking unexpectedly mutated candidate or product truth.' };
      }

      // 2. Category / PLP Surface Ranking Test
      const plpInput: RankingInput = {
        surface: 'category',
        inputCandidateSetSource: 'category-public-candidates',
        candidates: [
          { candidateId: 'c10', productId: 'p10', scoreFoundationOnly: 100 },
          { candidateId: 'c11', productId: 'p11', scoreFoundationOnly: 1000 }
        ]
      };
      
      const plpOutput = rankCandidates(plpInput);
      if (plpOutput.rankedCandidates[0].productId !== 'p11') {
        return { result: 'FAIL', message: 'Ranking did not sort category candidates correctly.' };
      }

      // 3. Recommendation Test (discover surface)
      const recInput: RecommendationInput = {
        surface: 'discover',
        publicSafeCandidates: [
          { productId: 'p20', recommendedReason: 'Similar to seed' }
        ]
      };

      const recOutput = recommendCandidates(recInput);
      if (!recOutput.outputPublicSafe || recOutput.recommendationTruthMutated) {
        return { result: 'FAIL', message: 'Recommendation boundaries violated.' };
      }
      if (recOutput.recommendations.length !== 1 || recOutput.recommendations[0].productId !== 'p20') {
        return { result: 'FAIL', message: 'Recommendation output does not match input public-safe candidates.' };
      }

      return { result: 'PASS', message: 'Ranking & recommendation boundaries, mutation, and safety checks passed.' };
    } catch (e: unknown) {
      return { result: 'FAIL', message: e instanceof Error ? e.message : String(e) };
    }
  }
};
