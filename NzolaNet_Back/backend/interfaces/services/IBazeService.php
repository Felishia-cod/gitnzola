<?php

interface IBazeService {

    public function like(string $userId, string $postId): bool;

    public function unlike(string $userId, string $postId): bool;

    public function countByPost(string $postId): int;

    public function getByPost(string $postId): array;
}