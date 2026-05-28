<?php

declare(strict_types=1);

class UserDTO {

    public function __construct(
        public string $id,
        public string $nome,
        public string $username,
        public string $email,
        public ?string $foto_perfil,
        public ?string $foto_capa,
        public ?string $bio,
        public ?string $data_nascimento,
        public string $genero,
        public string $privacidade,
        public bool $is_admin,
        public bool $is_active,
        public ?string $email_verificado_em,
        public ?string $ultimo_acesso_em,
        public string $criado_em,
        public string $atualizado_em
    ) {}
}