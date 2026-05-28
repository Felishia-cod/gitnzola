<?php

interface IMessageService {

    public function sendMessage(string $senderId, MessageDTO $dto): bool;

    public function getByConversation(string $conversationId, int $page, int $limit): array;

    public function delete(string $messageId): bool;
}