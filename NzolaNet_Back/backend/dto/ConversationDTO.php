<?php

declare(strict_types=1);

class ConversationDTO {

    public function __construct(
        public string $id,
        public string $user1_id,
        public string $user2_id,
        public string $criado_em
    ) {}
}