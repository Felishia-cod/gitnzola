<?php


interface IBazeRepository {

    public function create(Baze $baze): bool;

    public function delete(
        string $userId,
        string $postId
    ): bool;

    public function exists(
        string $userId,
        string $postId
    ): bool;

    public function countByPost(
        string $postId
    ): int;

    /** @return BazeDTO[] */
    public function getByPost(
        string $postId
    ): array;
    public function deleteByPost(string $postId): bool;
}