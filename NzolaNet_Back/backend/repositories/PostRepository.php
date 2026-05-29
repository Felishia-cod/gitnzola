<?php

class PostRepository implements IPostRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(Post $post): bool
    {
        $sql = "
            INSERT INTO posts (
                id, user_id, conteudo, cor,
                eliminado, criado_em, atualizado_em
            ) VALUES (
                :id, :user_id, :conteudo, :cor,
                :eliminado, :criado_em, :atualizado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':id',            $post->id);
        $stmt->bindValue(':user_id',       $post->user_id);
        $stmt->bindValue(':conteudo',      $post->conteudo);
        $stmt->bindValue(':cor',           $post->cor);
        $stmt->bindValue(':eliminado',     $post->eliminado, PDO::PARAM_BOOL);
        $stmt->bindValue(':criado_em',     $post->criado_em);
        $stmt->bindValue(':atualizado_em', $post->atualizado_em);

        return $stmt->execute();
    }

    public function findById(string $postId): ?PostDTO
    {
        $sql  = "SELECT * FROM posts WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":id" => $postId]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) return null;

        return $this->mapToDTO($result);
    }

    public function update(string $postId, PostDTO $dto): bool
    {
        $sql = "
            UPDATE posts
            SET conteudo = :conteudo, cor = :cor, atualizado_em = NOW()
            WHERE id = :id
        ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            ":conteudo" => $dto->conteudo,
            ":cor"      => $dto->cor,
            ":id"       => $postId
        ]);
    }

    public function delete(string $postId): bool
    {
        $sql  = "UPDATE posts SET eliminado = true WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":id" => $postId]);
    }

    // ============================================================
    // VERIFICA SE O USER SEGUE ALGUÉM
    // ============================================================

    public function hasFollowing(string $userId): bool
    {
        $sql = "
            SELECT COUNT(*)
            FROM follows
            WHERE seguidor_id = :user_id
            AND status = 'aceite'
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);

        return $stmt->fetchColumn() > 0;
    }

    // ============================================================
    // FEED DOS SEGUIDOS
    // ============================================================

    public function getFollowingFeed(string $userId, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT p.*
            FROM posts p
            WHERE p.eliminado = false
            AND (
                p.user_id = :user_id
                OR p.user_id IN (
                    SELECT seguido_id FROM follows
                    WHERE seguidor_id = :user_id2
                    AND status = 'aceite'
                )
            )
            ORDER BY p.criado_em DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(":user_id",  $userId);
        $stmt->bindValue(":user_id2", $userId);
        $stmt->bindValue(":limit",    $limit,  PDO::PARAM_INT);
        $stmt->bindValue(":offset",   $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToDTO'], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // ============================================================
    // FEED PÚBLICO (quando não segue ninguém)
    // ============================================================

    public function getPublicFeed(string $userId, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT p.*
            FROM posts p
            INNER JOIN users u ON u.id = p.user_id
            WHERE p.eliminado = false
            AND u.is_active = true
            AND (
                p.user_id = :user_id
                OR u.privacidade = 'publico'
            )
            ORDER BY p.criado_em DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(":user_id", $userId);
        $stmt->bindValue(":limit",   $limit,  PDO::PARAM_INT);
        $stmt->bindValue(":offset",  $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToDTO'], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // ============================================================
    // POSTS DE UM UTILIZADOR ESPECÍFICO
    // ============================================================

    public function getFeedByUser(string $userId, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT *
            FROM posts
            WHERE user_id = :user_id
            AND eliminado = false
            ORDER BY criado_em DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(":user_id", $userId);
        $stmt->bindValue(":limit",   $limit,  PDO::PARAM_INT);
        $stmt->bindValue(":offset",  $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToDTO'], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function countByUser(string $userId): int
    {
        $sql  = "SELECT COUNT(*) FROM posts WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);
        return (int) $stmt->fetchColumn();
    }

    // ============================================================
    // VERIFICAR PRIVACIDADE
    // ============================================================

    public function podeVerPosts(string $authUserId, string $targetUserId): bool
    {
        $sql = "
            SELECT COUNT(*)
            FROM users u
            LEFT JOIN follows f
                ON f.seguidor_id = :auth_id
                AND f.seguido_id = :target_id
                AND f.status = 'aceite'
            WHERE u.id = :target_id
            AND (
                u.privacidade = 'publico'
                OR f.id IS NOT NULL
            )
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ":auth_id"   => $authUserId,
            ":target_id" => $targetUserId
        ]);

        return $stmt->fetchColumn() > 0;
    }

    // ============================================================
    // SHARES
    // ============================================================

    public function share(PostShare $share): bool
    {
        $sql = "
            INSERT INTO post_shares (
                id, user_id, post_original_id,
                comentario_partilha, criado_em
            ) VALUES (
                :id, :user_id, :post_original_id,
                :comentario_partilha, :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            ":id"                  => $share->id,
            ":user_id"             => $share->user_id,
            ":post_original_id"    => $share->post_original_id,
            ":comentario_partilha" => $share->comentario_partilha,
            ":criado_em"           => $share->criado_em
        ]);
    }

    public function unshare(string $userId, string $postId): bool
    {
        $sql = "
            DELETE FROM post_shares
            WHERE user_id = :user_id
            AND post_original_id = :post_id
        ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            ":user_id" => $userId,
            ":post_id" => $postId
        ]);
    }

    public function isShared(string $userId, string $postId): bool
    {
        $sql = "
            SELECT COUNT(*)
            FROM post_shares
            WHERE user_id = :user_id
            AND post_original_id = :post_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ":user_id" => $userId,
            ":post_id" => $postId
        ]);
        return $stmt->fetchColumn() > 0;
    }

    // ============================================================
    // MAPPER
    // ============================================================

    private function mapToDTO(array $data): PostDTO
    {
        return new PostDTO(
            id:            $data['id'],
            user_id:       $data['user_id'],
            conteudo:      $data['conteudo'] ?? null,
            cor:           $data['cor'] ?? null,
            eliminado:     (bool) $data['eliminado'],
            criado_em:     $data['criado_em'],
            atualizado_em: $data['atualizado_em']
        );
    }
}