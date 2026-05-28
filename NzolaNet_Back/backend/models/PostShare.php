<?php

declare(strict_types=1);

class PostShare
{
    public function __construct(
        public string $id,
        public string $user_id,
        public string $post_original_id,
        public ?string $comentario_partilha,
        public string $criado_em
    ) {}
}