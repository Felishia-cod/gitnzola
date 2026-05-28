<?php

interface ICommentService
{

    public function create(string $userId, CommentDTO $dto): bool;

    public function update(string $commentId, CommentDTO $dto): bool;

    public function delete(string $commentId, string $authUserId): bool;

    /** Apenas admin — marca removido_por_admin = true */
    public function deleteByAdmin(string $commentId): bool;

    public function getByPost(string $postId, int $page, int $limit): array;

    public function getById(string $commentId): ?CommentDTO;
}
