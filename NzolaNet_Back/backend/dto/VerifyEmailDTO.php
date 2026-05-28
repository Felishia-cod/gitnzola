<?php

declare(strict_types=1);

class VerifyEmailDTO {

    public function __construct(
        public string $token
    ) {}
}