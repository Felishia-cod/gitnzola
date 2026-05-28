<?php

declare(strict_types=1);

class NotificationService extends BaseService implements INotificationService
{
    private INotificationRepository $notificationRepository;

    public function __construct(
        INotificationRepository $notificationRepository
    ) {
        $this->notificationRepository = $notificationRepository;
    }

   public function create(NotificationDTO $dto): bool
{
    $notification = new Notification(
        id:              $this->generateUUID(),
        destinatario_id: $dto->destinatario_id,
        remetente_id:    $dto->remetente_id,
        tipo:            $dto->tipo,
        referencia_id:   $dto->referencia_id,
        referencia_tipo: $dto->referencia_tipo,
        lida:            false,
        criado_em:       date("Y-m-d H:i:s")
    );

    return $this->notificationRepository->create($notification);
}
    public function getByUser(
        string $userId,
        int $page,
        int $limit
    ): array {

        return $this->notificationRepository->getByUser(
            $userId,
            $page,
            $limit
        );
    }

    public function markAsRead(
        string $notificationId
    ): bool {

        return $this->notificationRepository->markAsRead(
            $notificationId
        );
    }

    public function markAllAsRead(
        string $userId
    ): bool {

        return $this->notificationRepository->markAllAsRead(
            $userId
        );
    }
}