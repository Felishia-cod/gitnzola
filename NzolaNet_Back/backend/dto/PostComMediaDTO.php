<?php

declare(strict_types=1);

class PostComMediaDTO
{
    public function __construct(
        public string   $id,
        public string   $user_id,
        public string   $autor_nome,
        public ?string  $autor_username,
        public ?string  $autor_foto_perfil,
        public ?string  $conteudo,
        public bool     $eliminado,
        public string   $criado_em,
        public string   $atualizado_em,
        public int      $total_bazes,
        public int      $total_comentarios,

        // null se o post não tiver media
        public ?MediaDTO $media = null
    ) {}
}