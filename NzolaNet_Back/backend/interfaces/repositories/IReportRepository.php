<?php

interface IReportRepository {

    public function create(
        Report $report
    ): bool;

    public function findById(
        string $reportId
    ): ?ReportDTO;

    /** @return ReportDTO[] */
    public function getAll(
        int $page,
        int $limit
    ): array;

    /** @return ReportDTO[] */
    public function getByStatus(
        string $status
    ): array;

    public function resolve(
        string $reportId,
        string $resolvidoPor
    ): bool;

    public function ignore(
        string $reportId
    ): bool;
}