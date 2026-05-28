<?php

interface IConversationService {

    public function create(string $user1Id, CreateConversationDTO $dto): ConversationDTO;

    public function getByUser(string $userId): array;

    public function getById(string $id): ?ConversationDTO;
}