<?php

declare(strict_types=1);

class UserLoginDTO {

    public function __construct(
        public string $email,
        public string $password
    ) {}
}