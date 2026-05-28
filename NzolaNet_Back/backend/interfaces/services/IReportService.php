<?php

interface IReportService {

    public function create(string $reporterId, ReportDTO $dto): bool;

    public function resolve(string $reportId, string $adminId): bool;

    public function ignore(string $reportId): bool;

    public function getAll(int $page, int $limit): array;

    public function getById(string $reportId): ?ReportDTO;
}