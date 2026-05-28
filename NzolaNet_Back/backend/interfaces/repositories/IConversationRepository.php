<?php

interface IConversationRepository {

    public function create(
        Conversation $conversation
    ): bool;

    public function findById(
        string $conversationId
    ): ?ConversationDTO;

    public function findByUsers(
        string $user1Id,
        string $user2Id
    ): ?ConversationDTO;

    /** @return ConversationDTO[] */
    public function getByUser(
        string $userId
    ): array;
}