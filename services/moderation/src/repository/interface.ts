import { 
  ModerationCase, 
  CreateModerationCaseCommand, 
  ReviewModerationCaseCommand,
  ListModerationCasesQuery 
} from '@hx/contracts';

export interface IModerationRepository {
  create(mCase: ModerationCase, contentText?: string, mediaAssetIds?: string[]): Promise<void>;
  update(mCase: ModerationCase): Promise<void>;
  getById(caseId: string): Promise<ModerationCase | null>;
  list(query: ListModerationCasesQuery): Promise<ModerationCase[]>;
  findByIdempotencyKey(key: string): Promise<string | null>;
  saveIdempotencyKey(key: string, caseId: string): Promise<void>;
}
