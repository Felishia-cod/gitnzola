<?php

class FollowRepository implements IFollowRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function follow(Follow $follow): bool
    {
        $sql = "
            INSERT INTO follows (
                id,
                seguidor_id,
                seguido_id,
                status,
                criado_em
            ) VALUES (
                :id,
                :seguidor_id,
                :seguido_id,
                :status,
                :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id" => $follow->id,
            ":seguidor_id" => $follow->seguidor_id,
            ":seguido_id" => $follow->seguido_id,
            ":status" => $follow->status,
            ":criado_em" => $follow->criado_em
        ]);
    }

    public function unfollow(string $seguidorId, string $seguidoId): bool
    {
        $sql = "
            DELETE FROM follows
            WHERE seguidor_id = :seguidor_id
            AND seguido_id = :seguido_id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":seguidor_id" => $seguidorId,
            ":seguido_id" => $seguidoId
        ]);
    }

    public function isFollowing(string $seguidorId, string $seguidoId): ?FollowDTO
    {
        $sql = "
            SELECT *
            FROM follows
            WHERE seguidor_id = :seguidor_id
            AND seguido_id = :seguido_id
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ":seguidor_id" => $seguidorId,
            ":seguido_id" => $seguidoId
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result) {
            return null;
        }

        return new FollowDTO(
            id: $result['id'],
            seguidor_id: $result['seguidor_id'],
            seguido_id: $result['seguido_id'],
            status: $result['status'],
            criado_em: $result['criado_em']
        );
    }

    public function getFollowers(string $userId): array
    {
        $sql = "
            SELECT *
            FROM follows
            WHERE seguido_id = :user_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getFollowing(string $userId): array
    {
        $sql = "
            SELECT *
            FROM follows
            WHERE seguidor_id = :user_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countFollowers(string $userId): int
    {
        $sql = "
            SELECT COUNT(*) FROM follows WHERE seguido_id = :user_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);

        return (int) $stmt->fetchColumn();
    }

    public function countFollowing(string $userId): int
    {
        $sql = "
            SELECT COUNT(*) FROM follows WHERE seguidor_id = :user_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);

        return (int) $stmt->fetchColumn();
    }

    public function updateStatus(
    string $seguidorId,
    string $seguidoId,
    string $status
): bool {
    $sql = "
        UPDATE follows
        SET status = :status
        WHERE seguidor_id = :seguidor_id
        AND seguido_id = :seguido_id
    ";

    $stmt = $this->conn->prepare($sql);
    return $stmt->execute([
        ":status"      => $status,
        ":seguidor_id" => $seguidorId,
        ":seguido_id"  => $seguidoId
    ]);
}

public function getPedidosPendentes(string $userId): array
{
    $sql = "
        SELECT f.*, u.nome, u.username, u.foto_perfil
        FROM follows f
        INNER JOIN users u ON u.id = f.seguidor_id
        WHERE f.seguido_id = :user_id
        AND f.status = 'pendente'
        ORDER BY f.criado_em DESC
    ";

    $stmt = $this->conn->prepare($sql);
    $stmt->execute([":user_id" => $userId]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
}