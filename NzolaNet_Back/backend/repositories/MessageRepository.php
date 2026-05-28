<?php

class MessageRepository implements IMessageRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(Message $message): bool
    {
        $sql = "
            INSERT INTO messages (
                id,
                conversation_id,
                remetente_id,
                conteudo,
                lida,
                eliminado,
                criado_em
            ) VALUES (
                :id,
                :conversation_id,
                :remetente_id,
                :conteudo,
                0,
                0,
                :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id" => $message->id,
            ":conversation_id" => $message->conversation_id,
            ":remetente_id" => $message->remetente_id,
            ":conteudo" => $message->conteudo,
            ":criado_em" => $message->criado_em
        ]);
    }
    public function findById(string $messageId): ?MessageDTO
    {
        $sql = "SELECT * FROM messages WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":id" => $messageId]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result) {
            return null;
        }

        return new MessageDTO(
            id: $result['id'],
            conversation_id: $result['conversation_id'],
            remetente_id: $result['remetente_id'],
            conteudo: $result['conteudo'],
            lida: (bool) $result['lida'],
            eliminado: (bool) $result['eliminado'],
            criado_em: $result['criado_em']
        );
    }

    public function getByConversation(string $conversationId, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT *
            FROM messages
            WHERE conversation_id = :conversation_id
            AND eliminado = 0
            ORDER BY criado_em ASC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(":conversation_id", $conversationId);
        $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function markAsRead(string $conversationId, string $userId): bool
    {
        $sql = "
            UPDATE messages
            SET lida = 1
            WHERE conversation_id = :conversation_id
            AND remetente_id != :user_id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":conversation_id" => $conversationId,
            ":user_id" => $userId
        ]);
    }

    public function delete(string $messageId): bool
    {
        $sql = "
            UPDATE messages
            SET eliminado = 1
            WHERE id = :id
        ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":id" => $messageId]);
    }
}