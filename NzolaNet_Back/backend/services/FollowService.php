<?php

declare(strict_types=1);

class FollowService extends BaseService implements IFollowService
{
    private IFollowRepository $followRepository;
    private IUserRepository   $userRepository;
    private INotificationService    $notificationService;


    public function __construct(
        IFollowRepository $followRepository,
        IUserRepository   $userRepository,
        INotificationService    $notificationService
    ) {
        $this->followRepository = $followRepository;
        $this->userRepository   = $userRepository;
        $this->notificationService    = $notificationService;
    }

    // ============================================================
    // SEGUIR
    // ============================================================

    public function follow(string $seguidorId, string $seguidoId): array
    {
        // Não pode seguir a si próprio
        if ($seguidorId === $seguidoId) {
            return [
                "success" => false,
                "message" => "Não podes seguir-te a ti próprio"
            ];
        }

        // Verificar se já segue
        $existente = $this->followRepository->isFollowing($seguidorId, $seguidoId);

        if ($existente) {
            if ($existente->status === 'pendente') {
                return [
                    "success" => false,
                    "message" => "Já enviaste um pedido para seguir este utilizador"
                ];
            }
            return [
                "success" => false,
                "message" => "Já segues este utilizador"
            ];
        }

        // Verificar privacidade do utilizador a seguir
        $userASeguir = $this->userRepository->findById($seguidoId);

        if (!$userASeguir) {
            return [
                "success" => false,
                "message" => "Utilizador não encontrado"
            ];
        }

        // Definir status com base na privacidade
        $status = $userASeguir->privacidade === 'privado'
            ? 'pendente'
            : 'aceite';

        $follow = new Follow(
            id: $this->generateUUID(),
            seguidor_id: $seguidorId,
            seguido_id: $seguidoId,
            status: $status,
            criado_em: date("Y-m-d H:i:s")
        );

        $created = $this->followRepository->follow($follow);

        if (!$created) {
            return [
                "success" => false,
                "message" => "Erro ao seguir utilizador"
            ];
        }

        // Mensagem diferente consoante a privacidade
        if ($status === 'pendente') {
            return [
                "success" => true,
                "message" => "Pedido de follow enviado. Aguarda aprovação.",
                "status"  => "pendente"
            ];
        }
        if ($created) {
            if ($status === 'aceite') {
                $notifDto = new NotificationDTO(
                    id: "",
                    destinatario_id: $seguidoId,
                    remetente_id: $seguidorId,
                    tipo: "seguidor",
                    referencia_id: null,
                    referencia_tipo: null,
                    lida: false,
                    criado_em: ""
                );
                $this->notificationService->create($notifDto);
            } else {
                // perfil privado — envia pedido_follow
                $notifDto = new NotificationDTO(
                    id: "",
                    destinatario_id: $seguidoId,
                    remetente_id: $seguidorId,
                    tipo: "pedido_follow",
                    referencia_id: null,
                    referencia_tipo: null,
                    lida: false,
                    criado_em: ""
                );
                $this->notificationService->create($notifDto);
            }
        }

        return [
            "success" => true,
            "message" => "Agora segues este utilizador",
            "status"  => "aceite"
        ];
    }

    // ============================================================
    // DEIXAR DE SEGUIR
    // ============================================================

    public function unfollow(string $seguidorId, string $seguidoId): bool
    {
        return $this->followRepository->unfollow($seguidorId, $seguidoId);
    }

    // ============================================================
    // VERIFICAR SE SEGUE
    // ============================================================

    public function isFollowing(string $seguidorId, string $seguidoId): bool
    {
        $follow = $this->followRepository->isFollowing($seguidorId, $seguidoId);
        return $follow !== null && $follow->status === 'aceite';
    }

    // ============================================================
    // SEGUIDORES E SEGUIDOS
    // ============================================================

    public function getFollowers(string $userId): array
    {
        return $this->followRepository->getFollowers($userId);
    }

    public function getFollowing(string $userId): array
    {
        return $this->followRepository->getFollowing($userId);
    }

    // ============================================================
    // ACEITAR PEDIDO
    // ============================================================

    public function aceitarFollow(string $seguidorId, string $seguidoId): bool
    {
        return $this->followRepository->updateStatus(
            $seguidorId,
            $seguidoId,
            'aceite'
        );
    }

    // ============================================================
    // REJEITAR PEDIDO
    // ============================================================

    public function rejeitarFollow(string $seguidorId, string $seguidoId): bool
    {
        return $this->followRepository->unfollow($seguidorId, $seguidoId);
    }

    // ============================================================
    // VER PEDIDOS PENDENTES
    // ============================================================

    public function getPedidosPendentes(string $userId): array
    {
        return $this->followRepository->getPedidosPendentes($userId);
    }
}
