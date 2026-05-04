import { StorePostRecord, CreateStorePostCommand, StorePostListQuery, StorePostTransitionCommand, StorePostMutationResult, UgcRecord, CreateUserProductStoryCommand, UgcListQuery, UgcTransitionCommand, UgcMutationResult } from '@hx/contracts';
export declare const createStorePost: (command: CreateStorePostCommand) => Promise<StorePostMutationResult>;
export declare const listStorePosts: (query: StorePostListQuery) => Promise<{
    items: StorePostRecord[];
    warnings: string[];
}>;
export declare const getStorePostById: (postId: string) => Promise<StorePostRecord | undefined>;
export declare const transitionStorePost: (command: StorePostTransitionCommand) => Promise<StorePostMutationResult>;
export declare const createUserProductStory: (command: CreateUserProductStoryCommand) => Promise<UgcMutationResult>;
export declare const listUgc: (query: UgcListQuery) => Promise<{
    items: UgcRecord[];
}>;
export declare const getUgcById: (ugcId: string) => Promise<UgcRecord | undefined>;
export declare const transitionUgc: (command: UgcTransitionCommand) => Promise<UgcMutationResult>;
//# sourceMappingURL=media.d.ts.map