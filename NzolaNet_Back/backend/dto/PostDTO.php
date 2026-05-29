<?php

declare(strict_types=1);

class PostDTO {

    public function __construct(
        public string $id,
        public string $user_id,
        public ?string $conteudo,
        public ?string $cor,
        public bool $eliminado,
        public string $criado_em,
        public string $atualizado_em
    ) {}
}