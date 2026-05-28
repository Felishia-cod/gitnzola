<?php

declare(strict_types=1);

class Session
{
    public function __construct(
        public string $id,
        public string $user_id,
        public string $token_hash,
        public ?string $ip,
        public ?string $user_agent,
        public string $expira_em,
        public string $criado_em,
        public ?string $logout_em
    ) {}
}