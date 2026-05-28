<?php

class MediaRepository implements IMediaRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(Media $media): bool
    {
        $sql = "
            INSERT INTO media (
                id, post_id, tipo, url,
                mime_type, tamanho_bytes, ordem, criado_em
            ) VALUES (
                :id, :post_id, :tipo, :url,
                :mime_type, :tamanho_bytes, :ordem, :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id"            => $media->id,
            ":post_id"       => $media->post_id,
            ":tipo"          => $media->tipo,
            ":url"           => $media->url,
            ":mime_type"     => $media->mime_type,
            ":tamanho_bytes" => $media->tamanho_bytes,
            ":ordem"         => $media->ordem,
            ":criado_em"     => $media->criado_em
        ]);
    }

    public function findByPost(string $postId): array
    {
        $sql = "
            SELECT *
            FROM media
            WHERE post_id = :post_id
            ORDER BY ordem ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":post_id" => $postId]);

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Devolve array de MediaDTO em vez de array simples
        return array_map([$this, 'mapToDTO'], $rows);
    }

    public function delete(string $mediaId): bool
    {
        $sql  = "DELETE FROM media WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":id" => $mediaId]);
    }

    public function deleteByPost(string $postId): bool
    {
        $sql  = "DELETE FROM media WHERE post_id = :post_id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":post_id" => $postId]);
    }

    // ============================================================
    // MAPPER
    // ============================================================

    private function mapToDTO(array $data): MediaDTO
    {
        return new MediaDTO(
            id:            $data['id'],
            post_id:       $data['post_id'],
            tipo:          $data['tipo'],
            url:           $data['url'],
            mime_type:     $data['mime_type']     ?? null,
            tamanho_bytes: isset($data['tamanho_bytes'])
                           ? (int) $data['tamanho_bytes']
                           : null,
            ordem:         (int) $data['ordem'],
            criado_em:     $data['criado_em']
        );
    }
}