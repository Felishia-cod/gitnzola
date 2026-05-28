<?php

declare(strict_types=1);

class UserRegisterDTO {

    public function __construct(
        public string $nome,
        public string $username,
        public string $email,
        public string $password,
        public string $data_nascimento,
        public string $genero
    ) {}
}