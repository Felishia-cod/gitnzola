<?php

declare(strict_types=1);

class FollowDTO {

    public function __construct(
        public string $id,
        public string $seguidor_id,
        public string $seguido_id,
        public string $status,
        public string $criado_em
    ) {}
}