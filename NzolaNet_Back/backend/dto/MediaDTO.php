<?php

declare(strict_types=1);

class MediaDTO {

    public function __construct(
        public string $id,
        public string $post_id,
        public string $tipo,
        public string $url,
        public ?string $mime_type,
        public ?int $tamanho_bytes,
        public int $ordem,
        public string $criado_em
    ) {}
}
