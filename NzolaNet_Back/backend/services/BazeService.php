<?php

declare(strict_types=1);

class BazeService extends BaseService implements IBazeService
{
    private IBazeRepository      $bazeRepository;
    private INotificationService $notificationService;
    private IPostRepository      $postRepository;

    public function __construct(
        IBazeRepository      $bazeRepository,
        INotificationService $notificationService,
        IPostRepository      $postRepository
    ) {
        $this->bazeRepository      = $bazeRepository;
        $this->notificationService = $notificationService;
        $this->postRepository      = $postRepository;
    }

    public function like(string $userId, string $postId): bool
    {
        if ($this->bazeRepository->exists($userId, $postId)) {
            return false;
        }

        $baze = new Baze(
            id:         $this->generateUUID(),
            user_id:    $userId,
            post_id:    $postId,
            criado_em:  date("Y-m-d H:i:s")
        );

        $created = $this->bazeRepository->create($baze);

        if ($created) {
            // Buscar dono do post
            $post = $this->postRepository->findById($postId);

            // Não notificar a si próprio
            if ($post && $post->user_id !== $userId) {
                $dto = new NotificationDTO(
                    id:              "",
                    destinatario_id: $post->user_id,
                    remetente_id:    $userId,
                    tipo:            "baze",
                    referencia_id:   $postId,
                    referencia_tipo: "post",
                    lida:            false,
                    criado_em:       ""
                );
                $this->notificationService->create($dto);
            }
        }

        return $created;
    }

    public function unlike(string $userId, string $postId): bool
    {
        return $this->bazeRepository->delete($userId, $postId);
    }

    public function countByPost(string $postId): int
    {
        return $this->bazeRepository->countByPost($postId);
    }

    public function getByPost(string $postId): array
    {
        return $this->bazeRepository->getByPost($postId);
    }
}