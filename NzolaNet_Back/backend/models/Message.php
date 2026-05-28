<?php

declare(strict_types=1);

class Message
{
    public function __construct(
        public string $id,
        public string $conversation_id,
        public string $remetente_id,
        public string $conteudo,
        public bool $lida,
        public bool $eliminado,
        public string $criado_em
    ) {}
}