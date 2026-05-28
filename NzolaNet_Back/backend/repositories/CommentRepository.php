<?php

class CommentRepository implements ICommentRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(Comment $comment): bool
    {
        $sql = "
            INSERT INTO comments (
                id,
                user_id,
                post_id,
                conteudo,
                eliminado,
                removido_por_admin,
                criado_em,
                atualizado_em
            ) VALUES (
                :id,
                :user_id,
                :post_id,
                :conteudo,
                false,
                false,
                :criado_em,
                :atualizado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id"           => $comment->id,
            ":user_id"      => $comment->user_id,
            ":post_id"      => $comment->post_id,
            ":conteudo"     => $comment->conteudo,
            ":criado_em"    => $comment->criado_em,
            ":atualizado_em" => $comment->atualizado_em
        ]);
    }

    public function findById(string $commentId): ?CommentDTO
    {
        $sql = "SELECT * FROM comments WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":id" => $commentId]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result) {
            return null;
        }

        return new CommentDTO(
            id: $result['id'],
            user_id: $result['user_id'],
            post_id: $result['post_id'],
            conteudo: $result['conteudo'],
            eliminado: (bool) $result['eliminado'],
            removido_por_admin: (bool) $result['removido_por_admin'],
            criado_em: $result['criado_em'],
            atualizado_em: $result['atualizado_em']
        );
    }

    public function update(string $commentId, CommentDTO $dto): bool
    {
        $sql = "
            UPDATE comments
            SET conteudo = :conteudo,
                atualizado_em = NOW()
            WHERE id = :id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":conteudo" => $dto->conteudo,
            ":id" => $commentId
        ]);
    }

    public function delete(string $commentId): bool
    {
        $sql = "
        UPDATE comments
        SET eliminado = true
        WHERE id = :id
    ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":id" => $commentId]);
    }

    public function deleteByAdmin(string $commentId): bool
    {
        $sql = "
        UPDATE comments
        SET removido_por_admin = true
        WHERE id = :id
    ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":id" => $commentId]);
    }

    public function deleteByPost(string $postId): bool
    {
        $sql = "
        UPDATE comments
        SET eliminado = true
        WHERE post_id = :post_id
    ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":post_id" => $postId]);
    }
    public function getByPost(string $postId, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "
        SELECT *
        FROM comments
        WHERE post_id = :post_id
        AND eliminado = false
        AND removido_por_admin = false
        ORDER BY criado_em ASC
        LIMIT :limit OFFSET :offset
    ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(":post_id", $postId);
        $stmt->bindValue(":limit",   $limit,  PDO::PARAM_INT);
        $stmt->bindValue(":offset",  $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countByPost(string $postId): int
    {
        $sql = "
        SELECT COUNT(*)
        FROM comments
        WHERE post_id = :post_id
        AND eliminado = false
        AND removido_por_admin = false
    ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":post_id" => $postId]);

        return (int) $stmt->fetchColumn();
    }
}
