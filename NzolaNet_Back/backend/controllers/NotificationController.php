<?php

class NotificationController extends BaseController
{
    private INotificationService $service;

    public function __construct(INotificationService $service)
    {
        $this->service = $service;
    }

    public function getByUser(string $userId, int $page, int $limit): void
    {
        $notifications = $this->service->getByUser($userId, $page, $limit);

        $this->json([
            "success" => true,
            "data"    => $notifications
        ]);
    }

    public function markAsRead(string $notificationId): void
    {
        $result = $this->service->markAsRead($notificationId);

        $this->json([
            "success" => $result,
            "message" => $result ? "Notificação marcada como lida" : "Erro"
        ]);
    }

    public function markAllAsRead(string $userId): void
    {
        $result = $this->service->markAllAsRead($userId);

        $this->json([
            "success" => $result,
            "message" => $result ? "Todas as notificações lidas" : "Erro"
        ]);
    }
}