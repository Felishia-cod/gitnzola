<?php

class BlockRepository implements IBlockRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function block(Block $block): bool
    {
        $sql = "
            INSERT INTO blocks (
                id,
                bloqueador_id,
                bloqueado_id,
                criado_em
            ) VALUES (
                :id,
                :bloqueador_id,
                :bloqueado_id,
                :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id" => $block->id,
            ":bloqueador_id" => $block->bloqueador_id,
            ":bloqueado_id" => $block->bloqueado_id,
            ":criado_em" => $block->criado_em
        ]);
    }

    public function unblock(string $bloqueadorId, string $bloqueadoId): bool
    {
        $sql = "
            DELETE FROM blocks
            WHERE bloqueador_id = :bloqueador_id
            AND bloqueado_id = :bloqueado_id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":bloqueador_id" => $bloqueadorId,
            ":bloqueado_id" => $bloqueadoId
        ]);
    }

    public function isBlocked(string $bloqueadorId, string $bloqueadoId): bool
    {
        $sql = "
            SELECT COUNT(*)
            FROM blocks
            WHERE bloqueador_id = :bloqueador_id
            AND bloqueado_id = :bloqueado_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ":bloqueador_id" => $bloqueadorId,
            ":bloqueado_id" => $bloqueadoId
        ]);

        return $stmt->fetchColumn() > 0;
    }

    public function getBlocked(string $userId): array
    {
        $sql = "
            SELECT *
            FROM blocks
            WHERE bloqueador_id = :user_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}