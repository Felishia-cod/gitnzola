<?php

declare(strict_types=1);

class Notification
{
    public function __construct(
        public string $id,
        public string $destinatario_id,
        public string $remetente_id,
        public string $tipo,
        public ?string $referencia_id,
        public ?string $referencia_tipo,
        public bool $lida,
        public string $criado_em
    ) {}
}