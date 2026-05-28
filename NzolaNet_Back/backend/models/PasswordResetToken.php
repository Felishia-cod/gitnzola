<?php

declare(strict_types=1);

class PasswordResetToken
{
    public function __construct(
        public string $id,
        public string $user_id,
        public string $token_hash,
        public string $expira_em,
        public bool $usado,
        public string $criado_em
    ) {}
}