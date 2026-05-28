<?php

interface IPostRepository {

    public function create(Post $post): bool;

    public function findById(string $postId): ?PostDTO;

    public function update(string $postId, PostDTO $dto): bool;

    public function delete(string $postId): bool;

    /** Posts dos utilizadores que o userId segue */
    /** @return PostDTO[] */
    public function getFollowingFeed(
        string $userId,
        int $page,
        int $limit
    ): array;

    /** Posts de perfis públicos (inclui os do próprio user) */
    /** @return PostDTO[] */
    public function getPublicFeed(
        string $userId,
        int $page,
        int $limit
    ): array;

    /** Posts de um utilizador específico */
    /** @return PostDTO[] */
    public function getFeedByUser(
        string $userId,
        int $page,
        int $limit
    ): array;

    public function countByUser(string $userId): int;

    /** Verifica se o userId segue pelo menos uma pessoa */
    public function hasFollowing(string $userId): bool;

    /**
     * Verifica se authUserId pode ver os posts de targetUserId:
     * pode ver se targetUser tem perfil público
     * OU se authUser segue targetUser
     */
    public function podeVerPosts(
        string $authUserId,
        string $targetUserId
    ): bool;

    public function share(PostShare $share): bool;

    public function unshare(string $userId, string $postId): bool;

    public function isShared(string $userId, string $postId): bool;
}