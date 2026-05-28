<?php

interface IPasswordResetRepository {

    public function create(
        PasswordResetToken $token
    ): bool;

    /**
     * Devolve os dados do token guardado na BD (com user_id).
     * Não confundir com PasswordResetDTO que é o input do utilizador.
     */
    public function findByToken(
        string $tokenHash
    ): ?PasswordResetTokenDTO;

    public function markAsUsed(
        string $tokenHash
    ): bool;

    public function deleteByUserId(
        string $userId
    ): bool;
}
