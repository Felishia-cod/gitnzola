<?php

interface IEmailVerificationRepository {

    public function create(
        EmailVerificationToken $token
    ): bool;

    public function findByToken(
        string $tokenHash
    ): ?EmailVerificationTokenDTO;

    public function delete(
        string $tokenHash
    ): bool;
}