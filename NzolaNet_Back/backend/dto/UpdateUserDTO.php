<?php

declare(strict_types=1);

class UpdateUserDTO {

    public function __construct(
        public ?string $nome,
        public ?string $bio,
        public ?string $foto_perfil,
        public ?string $foto_capa,
        public ?string $privacidade
    ) {}
}