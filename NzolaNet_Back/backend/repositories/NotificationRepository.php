<?php

class NotificationRepository implements INotificationRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(Notification $notification): bool
    {
        $sql = "
            INSERT INTO notifications (
                id,
                destinatario_id,
                remetente_id,
                tipo,
                referencia_id,
                referencia_tipo,
                lida,
                criado_em
            ) VALUES (
                :id,
                :destinatario_id,
                :remetente_id,
                :tipo,
                :referencia_id,
                :referencia_tipo,
                false,
                :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id"              => $notification->id,
            ":destinatario_id" => $notification->destinatario_id,
            ":remetente_id"    => $notification->remetente_id,
            ":tipo"            => $notification->tipo,
            ":referencia_id"   => $notification->referencia_id,
            ":referencia_tipo" => $notification->referencia_tipo,
            ":criado_em"       => $notification->criado_em
        ]);
    }

    public function findById(string $notificationId): ?NotificationDTO
    {
        $sql  = "SELECT * FROM notifications WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":id" => $notificationId]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) return null;

        return $this->mapToDTO($result);
    }

    public function getByUser(string $userId, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT *
            FROM notifications
            WHERE destinatario_id = :user_id
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

    public function markAsRead(string $notificationId): bool
    {
        $sql  = "UPDATE notifications SET lida = true WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":id" => $notificationId]);
    }

    public function markAllAsRead(string $userId): bool
    {
        $sql = "
            UPDATE notifications
            SET lida = true
            WHERE destinatario_id = :user_id
        ";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":user_id" => $userId]);
    }

    public function countUnread(string $userId): int
    {
        $sql = "
            SELECT COUNT(*)
            FROM notifications
            WHERE destinatario_id = :user_id
            AND lida = false
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":user_id" => $userId]);
        return (int) $stmt->fetchColumn();
    }

    // ============================================================
    // MAPPER
    // ============================================================

    private function mapToDTO(array $data): NotificationDTO
    {
        return new NotificationDTO(
            id:              $data['id'],
            destinatario_id: $data['destinatario_id'],
            remetente_id:    $data['remetente_id'],
            tipo:            $data['tipo'],
            referencia_id:   $data['referencia_id']   ?? null,
            referencia_tipo: $data['referencia_tipo'] ?? null,
            lida:            (bool) $data['lida'],
            criado_em:       $data['criado_em']
        );
    }
}