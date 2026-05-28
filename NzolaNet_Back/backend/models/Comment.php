<?php

declare(strict_types=1);

class Comment
{

    public function __construct(

        public string $id,
        public string $user_id,
        public string $post_id,
        public string $conteudo,
        public bool $eliminado,
        public bool $removido_por_admin,
        public string $criado_em,
        public string $atualizado_em
    ) {}
}
