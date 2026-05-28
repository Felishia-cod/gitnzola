<?php

interface IMediaRepository {

    public function create(
        Media $media
    ): bool;

    /** @return MediaDTO[] */
    public function findByPost(
        string $postId
    ): array;

    public function delete(
        string $mediaId
    ): bool;

    public function deleteByPost(
        string $postId
    ): bool;
}