<?php

class BazeController extends BaseController
{
    private IBazeService $service;

    public function __construct(IBazeService $service)
    {
        $this->service = $service;
    }

    public function like(string $userId, string $postId): void
    {
        $result = $this->service->like($userId, $postId);

        if ($result) {
            $this->json([
                "success" => true,
                "message" => "Baze dado com sucesso"
            ]);
        } else {
            $this->json([
                "success" => false,
                "message" => "Já deste baze nesta publicação"
            ], 400);
        }
    }

    public function unlike(string $userId, string $postId): void
    {
        $result = $this->service->unlike($userId, $postId);

        $this->json([
            "success" => $result,
            "message" => $result ? "Baze removido" : "Erro ao remover baze"
        ]);
    }

    public function count(string $postId): void
    {
        $total = $this->service->countByPost($postId);

        $this->json([
            "success" => true,
            "data"    => ["total" => $total]
        ]);
    }
}