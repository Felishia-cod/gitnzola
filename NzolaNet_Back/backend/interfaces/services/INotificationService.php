<?php

interface INotificationService {

    public function create(NotificationDTO $dto): bool;

    public function getByUser(string $userId, int $page, int $limit): array;

    public function markAsRead(string $notificationId): bool;

    public function markAllAsRead(string $userId): bool;
}