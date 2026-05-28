<?php

class ConversationRepository implements IConversationRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(Conversation $conversation): bool
    {
        $sql = "
            INSERT INTO conversations (
                id,
                user1_id,
                user2_id,
                criado_em
            ) VALUES (
                :id,
                :user1_id,
                :user2_id,
                :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id" => $conversation->id,
            ":user1_id" => $conversation->user1_id,
            ":user2_id" => $conversation->user2_id,
            ":criado_em" => $conversation->criado_em
        ]);
    }
    public function findById(string $conversationId): ?ConversationDTO
    {
        $sql = "
            SELECT *
            FROM conversations
            WHERE id = :id
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":id" => $conversationId]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new ConversationDTO(
            $data['id'],
            $data['user1_id'],
            $data['user2_id'],
            $data['criado_em']
        );
    }
    public function findByUsers(string $user1Id, string $user2Id): ?ConversationDTO
    {
        $sql = "
            SELECT *
            FROM conversations
            WHERE (user1_id = :user1 AND user2_id = :user2)
            OR (user1_id = :user2 AND user2_id = :user1)
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ":user1" => $user1Id,
            ":user2" => $user2Id
        ]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new ConversationDTO(
            $data['id'],
            $data['user1_id'],
            $data['user2_id'],
            $data['criado_em']
        );
    }
        public function getByUser(string $userId): array
    {
        $sql = "
            SELECT *
            FROM conversations
            WHERE user1_id = :user_id
               OR user2_id = :user_id
            ORDER BY criado_em DESC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}