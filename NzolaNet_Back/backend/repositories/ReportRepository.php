<?php

class ReportRepository implements IReportRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(Report $report): bool
    {
        $sql = "
            INSERT INTO reports (
                id, reporter_id, referencia_id, referencia_tipo,
                motivo, descricao, status, resolvido_por,
                criado_em, resolvido_em
            ) VALUES (
                :id, :reporter_id, :referencia_id, :referencia_tipo,
                :motivo, :descricao, :status, :resolvido_por,
                :criado_em, :resolvido_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id"             => $report->id,
            ":reporter_id"    => $report->reporter_id,
            ":referencia_id"  => $report->referencia_id,
            ":referencia_tipo"=> $report->referencia_tipo,
            ":motivo"         => $report->motivo,
            ":descricao"      => $report->descricao,
            ":status"         => $report->status,        // 'pendente'
            ":resolvido_por"  => $report->resolvido_por,
            ":criado_em"      => $report->criado_em,
            ":resolvido_em"   => $report->resolvido_em
        ]);
    }

    public function findById(string $reportId): ?ReportDTO
    {
        $sql  = "SELECT * FROM reports WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":id" => $reportId]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) return null;

        return new ReportDTO(
            id:             $result['id'],
            reporter_id:    $result['reporter_id'],
            referencia_id:  $result['referencia_id'],
            referencia_tipo:$result['referencia_tipo'],
            motivo:         $result['motivo'],
            descricao:      $result['descricao']     ?? null,
            status:         $result['status'],
            resolvido_por:  $result['resolvido_por'] ?? null,
            criado_em:      $result['criado_em'],
            resolvido_em:   $result['resolvido_em']  ?? null
        );
    }

    public function getAll(int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;

        $sql  = "
            SELECT * FROM reports
            ORDER BY criado_em DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(":limit",  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByStatus(string $status): array
    {
        $sql  = "SELECT * FROM reports WHERE status = :status";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":status" => $status]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function resolve(string $reportId, string $resolvidoPor): bool
    {
        // 'resolvido' em minúsculas — bate com o CHECK do schema PostgreSQL
        $sql = "
            UPDATE reports
            SET status       = 'resolvido',
                resolvido_por = :resolvido_por,
                resolvido_em  = NOW()
            WHERE id = :id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id"           => $reportId,
            ":resolvido_por"=> $resolvidoPor
        ]);
    }

    public function ignore(string $reportId): bool
    {
        // 'ignorado' em minúsculas — bate com o CHECK do schema PostgreSQL
        $sql  = "UPDATE reports SET status = 'ignorado' WHERE id = :id";
        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([":id" => $reportId]);
    }
}
