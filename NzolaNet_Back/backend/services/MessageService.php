<?php

declare(strict_types=1);

class MessageService extends BaseService implements IMessageService
{
private IMessageRepository      $messageRepository;
private IConversationRepository $conversationRepository;
private INotificationService    $notificationService;

public function __construct(
    IMessageRepository      $messageRepository,
    IConversationRepository $conversationRepository,
    INotificationService    $notificationService
) {
    $this->messageRepository      = $messageRepository;
    $this->conversationRepository = $conversationRepository;
    $this->notificationService    = $notificationService;
}

   public function sendMessage(string $senderId, MessageDTO $dto): bool
{
    $message = new Message(
        id:              $this->generateUUID(),
        conversation_id: $dto->conversation_id,
        remetente_id:    $senderId,
        conteudo:        $dto->conteudo,
        lida:            false,
        eliminado:       false,
        criado_em:       date("Y-m-d H:i:s")
    );

    $created = $this->messageRepository->create($message);

    if ($created) {
        // Buscar conversa para saber o destinatário
        $conversa = $this->conversationRepository->findById(
            $dto->conversation_id
        );

        if ($conversa) {
            // Destinatário é o outro utilizador da conversa
            $destinatarioId = $conversa->user1_id === $senderId
                ? $conversa->user2_id
                : $conversa->user1_id;

            $notifDto = new NotificationDTO(
                id:              "",
                destinatario_id: $destinatarioId,
                remetente_id:    $senderId,
                tipo:            "mensagem",
                referencia_id:   $dto->conversation_id,
                referencia_tipo: "conversation",
                lida:            false,
                criado_em:       ""
            );
            $this->notificationService->create($notifDto);
        }
    }

    return $created;
}

    public function getByConversation(
        string $conversationId,
        int $page,
        int $limit
    ): array {

        return $this->messageRepository->getByConversation(
            $conversationId,
            $page,
            $limit
        );
    }

    public function delete(
        string $messageId
    ): bool {

        return $this->messageRepository->delete(
            $messageId
        );
    }
}