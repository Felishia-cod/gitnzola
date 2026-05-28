<?php

declare(strict_types=1);

class CreateConversationDTO {

    public function __construct(
        public string $user2_id
    ) {}
}