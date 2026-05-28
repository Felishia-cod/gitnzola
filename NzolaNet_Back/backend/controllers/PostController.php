<?php

class PostController extends BaseController
{
    private IPostService $service;

    public function __construct(IPostService $service)
    {
        $this->service = $service;
    }

    public function create(string $userId, PostDTO $dto): void
    {
        $postId = $this->service->create($userId, $dto);
        if ($postId) {
            $this->json([
                "success" => true,
                "message" => "Publicação criada",
                "data"    => ["id" => $postId]
            ], 201);
        } else {
            $this->json([
                "success" => false,
                "message" => "Erro ao criar publicação"
            ], 400);
        }
    }

    public function getMyPosts(string $userId, int $page, int $limit): void
    {
        $posts = $this->service->getUserPosts($userId, $page, $limit);
        $this->json(["success" => true, "data" => $posts]);
    }

    // Ver posts de outro utilizador
    // Só mostra se: perfil público OU eu sigo esse utilizador
    public function getPostsDeUtilizador(
        string $authUserId,
        string $targetUserId,
        int $page,
        int $limit
    ): void {
        $posts = $this->service->getPostsDeUtilizador(
            $authUserId,
            $targetUserId,
            $page,
            $limit
        );
        $this->json(["success" => true, "data" => $posts]);
    }

    public function feed(string $userId, int $page, int $limit): void
    {
        $posts = $this->service->getFeed($userId, $page, $limit);
        $this->json(["success" => true, "data" => $posts]);
    }

    public function getById(string $id, string $authUserId): void
    {
        $post = $this->service->getById($id, $authUserId);

        if (!$post) {
            $this->json([
                "success" => false,
                "message" => "Publicação não encontrada ou sem permissão para ver"
            ], 404);
        }

        $this->json(["success" => true, "data" => $post]);
    }

    public function update(string $id, PostDTO $dto): void
    {
        try {
            $result = $this->service->update($id, $dto);
            $this->json([
                "success" => $result,
                "message" => $result ? "Publicação atualizada" : "Erro ao atualizar"
            ]);
        } catch (Exception $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage()
            ], 403);
        }
    }

    public function delete(string $id, string $authUserId): void
    {
        try {
            $result = $this->service->delete($id, $authUserId);
            $this->json([
                "success" => $result,
                "message" => $result ? "Publicação eliminada" : "Erro ao eliminar"
            ]);
        } catch (Exception $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage()
            ], 403);
        }
    }
}
