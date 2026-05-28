<?php

class BazeRepository implements IBazeRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(Baze $baze): bool
    {
        $sql = "
            INSERT INTO bazes (
                id,
                user_id,
                post_id,
                criado_em
            ) VALUES (
                :id,
                :user_id,
                :post_id,
                :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id"        => $baze->id,
            ":user_id"   => $baze->user_id,
            ":post_id"   => $baze->post_id,
            ":criado_em" => $baze->criado_em
        ]);
    }

    public function delete(string $userId, string $postId): bool
    {
        $sql = "
            DELETE FROM bazes
            WHERE user_id = :user_id
            AND   post_id = :post_id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":user_id" => $userId,
            ":post_id" => $postId
        ]);
    }

    public function exists(string $userId, string $postId): bool
    {
        $sql = "
            SELECT COUNT(*)
            FROM bazes
            WHERE user_id = :user_id
            AND   post_id = :post_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ":user_id" => $userId,
            ":post_id" => $postId
        ]);

        return $stmt->fetchColumn() > 0;
    }

    public function countByPost(string $postId): int
    {
        $sql  = "SELECT COUNT(*) FROM bazes WHERE post_id = :post_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":post_id" => $postId]);

        return (int) $stmt->fetchColumn();
    }

    public function getByPost(string $postId): array
    {
        $sql  = "SELECT * FROM bazes WHERE post_id = :post_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":post_id" => $postId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
        public function deleteByPost(string $postId): bool
    {
        $sql  = "DELETE FROM bazes WHERE post_id = :post_id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":post_id" => $postId]);
    }
}
