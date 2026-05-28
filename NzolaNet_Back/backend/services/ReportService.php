<?php

declare(strict_types=1);

class ReportService extends BaseService implements IReportService
{
private IReportRepository    $reportRepository;
private IUserRepository      $userRepository;
private INotificationService $notificationService;

public function __construct(
    IReportRepository    $reportRepository,
    IUserRepository      $userRepository,
    INotificationService $notificationService
) {
    $this->reportRepository    = $reportRepository;
    $this->userRepository      = $userRepository;
    $this->notificationService = $notificationService;
}
    public function create(string $reporterId, ReportDTO $dto): bool
{
    $report = new Report(
        id:              $this->generateUUID(),
        reporter_id:     $reporterId,
        referencia_id:   $dto->referencia_id,
        referencia_tipo: $dto->referencia_tipo,
        motivo:          $dto->motivo,
        descricao:       $dto->descricao,
        status:          "pendente",
        resolvido_por:   null,
        criado_em:       date("Y-m-d H:i:s"),
        resolvido_em:    null
    );

    $created = $this->reportRepository->create($report);

    if ($created) {
        // Notificar todos os admins
        $admins = $this->userRepository->getAdmins();

        foreach ($admins as $admin) {
            $notifDto = new NotificationDTO(
                id:              "",
                destinatario_id: $admin->id,
                remetente_id:    $reporterId,
                tipo:            "report",
                referencia_id:   $report->id,
                referencia_tipo: "report",
                lida:            false,
                criado_em:       ""
            );
            $this->notificationService->create($notifDto);
        }
    }

    return $created;
}
    public function getById(string $reportId): ?ReportDTO
    {
        return $this->reportRepository->findById($reportId);
    }

    public function resolve(
        string $reportId,
        string $adminId
    ): bool {

        return $this->reportRepository->resolve(
            $reportId,
            $adminId
        );
    }

    public function ignore(string $reportId): bool
    {
        return $this->reportRepository->ignore($reportId);
    }

    public function getAll(
        int $page,
        int $limit
    ): array {

        return $this->reportRepository->getAll(
            $page,
            $limit
        );
    }
}