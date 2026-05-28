<?php

interface IPostService {

    public function create(string $userId, PostDTO $dto): ?string;
    public function update(string $postId, PostDTO $dto): bool;

    public function delete(string $postId, string $authUserId): bool;

    /** @return PostComMediaDTO[] */
    public function getFeed(string $userId, int $page, int $limit): array;

    /** @return PostComMediaDTO[] */
    public function getUserPosts(string $userId, int $page, int $limit): array;

    /** @return PostComMediaDTO[] */
    public function getPostsDeUtilizador(
        string $authUserId,
        string $targetUserId,
        int    $page,
        int    $limit
    ): array;
    public function getById(string $postId, string $authUserId): ?PostComMediaDTO;
}