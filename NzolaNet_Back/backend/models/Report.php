<?php

declare(strict_types=1);

class Report
{
    public function __construct(
        public string $id,
        public string $reporter_id,
        public string $referencia_id,
        public string $referencia_tipo,
        public string $motivo,
        public ?string $descricao,
        public string $status,
        public ?string $resolvido_por,
        public string $criado_em,
        public ?string $resolvido_em
    ) {}
}