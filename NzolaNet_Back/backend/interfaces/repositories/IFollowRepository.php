<?php

interface IFollowRepository {

    public function follow(Follow $follow): bool;

    public function unfollow(string $seguidorId, string $seguidoId): bool;

    public function isFollowing(string $seguidorId, string $seguidoId): ?FollowDTO;

    /** @return FollowDTO[] */
    public function getFollowers(string $userId): array;

    /** @return FollowDTO[] */
    public function getFollowing(string $userId): array;

    public function countFollowers(string $userId): int;

    public function countFollowing(string $userId): int;

    public function updateStatus(
        string $seguidorId,
        string $seguidoId,
        string $status
    ): bool;

    /** @return FollowDTO[] */
    public function getPedidosPendentes(string $userId): array;
}