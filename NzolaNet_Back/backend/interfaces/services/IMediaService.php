<?php

interface IMediaService {

    /**
     * Upload físico do ficheiro + guardar registo na BD
     * $file = $_FILES['media']
     */
    public function upload(string $postId, array $file): array;

    public function create(string $postId, MediaDTO $dto): bool;

    /** @return MediaDTO[] */
    public function findByPost(string $postId): array;

    public function delete(string $mediaId): bool;

    public function deleteByPost(string $postId): bool;
}