<?php

interface IMessageRepository {

    public function create(
        Message $message
    ): bool;

    public function findById(
        string $messageId
    ): ?MessageDTO;

    /** @return MessageDTO[] */
    public function getByConversation(
        string $conversationId,
        int $page,
        int $limit
    ): array;

    public function markAsRead(
        string $conversationId,
        string $userId
    ): bool;

    public function delete(
        string $messageId
    ): bool;
}