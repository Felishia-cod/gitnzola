<?php

interface IFollowService {

    public function follow(string $seguidorId, string $seguidoId): array;

    public function unfollow(string $seguidorId, string $seguidoId): bool;

    public function isFollowing(string $seguidorId, string $seguidoId): bool;

    public function getFollowers(string $userId): array;

    public function getFollowing(string $userId): array;

    /** Aceitar pedido de follow (perfil privado) */
    public function aceitarFollow(string $seguidorId, string $seguidoId): bool;

    /** Rejeitar pedido de follow (perfil privado) */
    public function rejeitarFollow(string $seguidorId, string $seguidoId): bool;

    /** Ver pedidos pendentes (para perfil privado) */
    public function getPedidosPendentes(string $userId): array;
}