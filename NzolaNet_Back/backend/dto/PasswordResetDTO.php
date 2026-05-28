<?php

declare(strict_types=1);

class PasswordResetDTO {

    public function __construct(
        public string $token,
        public string $password
    ) {}
}
