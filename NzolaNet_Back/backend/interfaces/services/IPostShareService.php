<?php

interface IPostShareService {

    public function share(string $userId, string $postId, ?string $comentario): bool;

    public function unshare(string $userId, string $postId): bool;

    public function isShared(string $userId, string $postId): bool;
}