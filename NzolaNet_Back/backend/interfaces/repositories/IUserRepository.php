<?php

interface IUserRepository {

    public function findByEmail(string $email): ?UserDTO;

    public function findByEmailWithHash(string $email): ?object;

    public function findByUsername(string $username): ?UserDTO;

    public function findById(string $id): ?UserDTO;

    public function create(User $user): bool;

    public function verifyEmail(string $userId): bool;

    public function updatePassword(string $userId, string $passwordHash): bool;

    public function updateProfile(string $userId, User $user): bool;

    public function updateFotoPerfil(string $userId, string $url): bool;

    public function updateFotoCapa(string $userId, string $url): bool;

    public function updateUltimoAcesso(string $userId): bool;

    public function removerFotoPerfil(string $userId): bool;

    public function removerFotoCapa(string $userId): bool;

    /** @return UserDTO[] */
    public function getAllUsers(): array;

    public function updateUser(string $userId, User $user): bool;

    public function activateUser(string $userId): bool;

    public function deactivate(string $userId): bool;

    /** @return UserDTO[] */
    public function searchUsers(string $query): array;

    public function countUsers(): int;
    /** @return UserDTO[] */
public function getAdmins(): array;
}