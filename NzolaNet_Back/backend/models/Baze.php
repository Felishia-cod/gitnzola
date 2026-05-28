<?php

declare(strict_types=1);

class Baze {

    public function __construct(
    public string $id,
    public string $user_id,
    public string $post_id,
    public string $criado_em
        ) {}
}