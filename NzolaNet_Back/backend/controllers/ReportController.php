<?php

class ReportController extends BaseController
{
    private IReportService $service;

    public function __construct(IReportService $service)
    {
        $this->service = $service;
    }

    public function create(string $reporterId, ReportDTO $dto): void
    {
        $result = $this->service->create($reporterId, $dto);
        $this->json([
            "success" => $result,
            "message" => $result ? "Denúncia enviada" : "Erro ao enviar denúncia"
        ], $result ? 201 : 400);
    }

    public function resolve(string $reportId, string $adminId): void
    {
        $result = $this->service->resolve($reportId, $adminId);
        $this->json([
            "success" => $result,
            "message" => $result ? "Report resolvido" : "Erro ao resolver"
        ]);
    }

    public function ignore(string $reportId): void
    {
        $result = $this->service->ignore($reportId);
        $this->json([
            "success" => $result,
            "message" => $result ? "Report ignorado" : "Erro ao ignorar"
        ]);
    }

    public function getAll(int $page, int $limit): void
    {
        $reports = $this->service->getAll($page, $limit);
        $this->json([
            "success" => true,
            "data"    => $reports
        ]);
    }
}