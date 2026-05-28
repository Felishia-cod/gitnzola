<?php

class FollowController extends BaseController
{
    private IFollowService $service;

    public function __construct(IFollowService $service)
    {
        $this->service = $service;
    }

    public function follow(string $seguidorId, string $seguidoId): void
    {
        $result = $this->service->follow($seguidorId, $seguidoId);
        $this->json($result, $result['success'] ? 200 : 400);
    }

    public function unfollow(string $seguidorId, string $seguidoId): void
    {
        $result = $this->service->unfollow($seguidorId, $seguidoId);
        $this->json([
            "success" => $result,
            "message" => $result ? "Deixaste de seguir" : "Erro ao deixar de seguir"
        ]);
    }

    public function isFollowing(string $seguidorId, string $seguidoId): void
    {
        $result = $this->service->isFollowing($seguidorId, $seguidoId);
        $this->json([
            "success" => true,
            "data"    => ["is_following" => $result]
        ]);
    }

    public function getFollowers(string $userId): void
    {
        $followers = $this->service->getFollowers($userId);
        $this->json(["success" => true, "data" => $followers]);
    }

    public function getFollowing(string $userId): void
    {
        $following = $this->service->getFollowing($userId);
        $this->json(["success" => true, "data" => $following]);
    }

    public function aceitarFollow(string $seguidorId, string $seguidoId): void
    {
        $result = $this->service->aceitarFollow($seguidorId, $seguidoId);
        $this->json([
            "success" => $result,
            "message" => $result ? "Pedido aceite" : "Erro ao aceitar"
        ]);
    }

    public function rejeitarFollow(string $seguidorId, string $seguidoId): void
    {
        $result = $this->service->rejeitarFollow($seguidorId, $seguidoId);
        $this->json([
            "success" => $result,
            "message" => $result ? "Pedido rejeitado" : "Erro ao rejeitar"
        ]);
    }

    public function getPedidosPendentes(string $userId): void
    {
        $pedidos = $this->service->getPedidosPendentes($userId);
        $this->json(["success" => true, "data" => $pedidos]);
    }
}