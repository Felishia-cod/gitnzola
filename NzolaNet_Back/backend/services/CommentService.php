<?php

declare(strict_types=1);

class CommentService extends BaseService implements ICommentService
{
    private ICommentRepository   $commentRepository;
    private INotificationService $notificationService;
    private IPostRepository      $postRepository;

    public function __construct(
        ICommentRepository   $commentRepository,
        INotificationService $notificationService,
        IPostRepository      $postRepository
    ) {
        $this->commentRepository   = $commentRepository;
        $this->notificationService = $notificationService;
        $this->postRepository      = $postRepository;
    }

    public function create(string $userId, CommentDTO $dto): bool
    {
        $comment = new Comment(
            id: $this->generateUUID(),
            user_id: $userId,
            post_id: $dto->post_id,
            conteudo: $dto->conteudo,
            eliminado: false,
            removido_por_admin: false,
            criado_em: date("Y-m-d H:i:s"),
            atualizado_em: date("Y-m-d H:i:s")
        );

        $created = $this->commentRepository->create($comment);

        if ($created) {
            // Buscar dono do post
            $post = $this->postRepository->findById($dto->post_id);

            // Não notificar a si próprio
            if ($post && $post->user_id !== $userId) {
                $dto = new NotificationDTO(
                    id: "",
                    destinatario_id: $post->user_id,
                    remetente_id: $userId,
                    tipo: "comentario",
                    referencia_id: $dto->post_id,
                    referencia_tipo: "post",
                    lida: false,
                    criado_em: ""
                );
                $this->notificationService->create($dto);
            }
        }

        return $created;
    }


    public function deleteByAdmin(string $commentId): bool
    {
        return $this->commentRepository->deleteByAdmin($commentId);
    }

    public function deleteByPost(string $postId): bool
    {
        return $this->commentRepository->deleteByPost($postId);
    }

    public function getByPost(string $postId, int $page, int $limit): array
    {
        return $this->commentRepository->getByPost($postId, $page, $limit);
    }
    public function getById(string $commentId): ?CommentDTO
    {
        return $this->commentRepository->findById($commentId);
    }

    public function update(string $commentId, CommentDTO $dto): bool
    {
        $comment = $this->commentRepository->findById($commentId);

        if (!$comment) {
            throw new Exception("Comentário não encontrado");
        }

        // Verificar se é o dono
        if ($comment->user_id !== $dto->user_id) {
            throw new Exception("Não tens permissão para editar este comentário");
        }

        return $this->commentRepository->update($commentId, $dto);
    }

    public function delete(string $commentId, string $authUserId): bool
    {
        $comment = $this->commentRepository->findById($commentId);

        if (!$comment) {
            throw new Exception("Comentário não encontrado");
        }

        // Verificar se é o dono
        if ($comment->user_id !== $authUserId) {
            throw new Exception("Não tens permissão para eliminar este comentário");
        }

        return $this->commentRepository->delete($commentId);
    }
}
