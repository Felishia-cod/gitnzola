<?php

interface ISessionRepository {

    public function createSession(
        Session $session
    ): bool;

    public function findByToken(
        string $tokenHash
    ): ?SessionDTO;

    public function deleteSession(
        string $tokenHash
    ): bool;

    public function deleteAllByUserId(
        string $userId
    ): bool;
}