<?php

interface ICommentRepository {

    public function create(
        Comment $comment
    ): bool;

    public function findById(
        string $commentId
    ): ?CommentDTO;

    public function update(
        string $commentId,
        CommentDTO $dto
    ): bool;

    public function delete(
        string $commentId
    ): bool;

    public function deleteByAdmin(
        string $commentId
    ): bool;

    /** @return CommentDTO[] */
    public function getByPost(
        string $postId,
        int $page,
        int $limit
    ): array;

    public function countByPost(
        string $postId
    ): int;

    public function deleteByPost(string $postId): bool;
}