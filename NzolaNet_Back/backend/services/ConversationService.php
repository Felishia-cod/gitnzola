<?php

declare(strict_types=1);

class ConversationService extends BaseService implements IConversationService
{
    private IConversationRepository $conversationRepository;

    public function __construct(
        IConversationRepository $conversationRepository
    ) {
        $this->conversationRepository = $conversationRepository;
    }

    public function create(
        string $user1Id,
        CreateConversationDTO $dto
    ): ConversationDTO {

        $conversation = new Conversation(
            id: $this->generateUUID(),
            user1_id: $user1Id,
            user2_id: $dto->user2_id,
            criado_em: date("Y-m-d H:i:s")
        );

        $this->conversationRepository->create($conversation);

        return $this->conversationRepository->findById(
            $conversation->id
        );
    }

    public function getByUser(string $userId): array
    {
        return $this->conversationRepository->getByUser(
            $userId
        );
    }

    public function getById(string $id): ?ConversationDTO
    {
        return $this->conversationRepository->findById($id);
    }
}