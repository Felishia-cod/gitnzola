<?php

interface INotificationRepository {

    public function create(
        Notification $notification
    ): bool;

    public function findById(
        string $notificationId
    ): ?NotificationDTO;

    /** @return NotificationDTO[] */
    public function getByUser(
        string $userId,
        int $page,
        int $limit
    ): array;

    public function markAsRead(
        string $notificationId
    ): bool;

    public function markAllAsRead(
        string $userId
    ): bool;

    public function countUnread(
        string $userId
    ): int;
}