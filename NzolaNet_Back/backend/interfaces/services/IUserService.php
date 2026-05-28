<?php

interface IUserService {

    public function register(UserRegisterDTO $dto): UserDTO;

    /** Devolve ['user' => UserDTO, 'token' => string, 'hash' => string] */
    public function login(UserLoginDTO $dto): array;

    public function getById(string $id): ?UserDTO;

    public function updateProfile(string $id, UpdateUserDTO $dto): bool;

    public function deleteUser(string $id): bool;
    
    public function removerFotoPerfil(string $id): bool;

    public function removerFotoCapa(string $id): bool;

    public function updatePassword(string $id, string $password): bool;

    /**
     * Verifica a password atual antes de alterar
     * Devolve false se a password atual estiver errada
     */
    public function alterarPassword(
        string $id,
        string $passwordAtual,
        string $passwordNova
    ): bool;

    /** Pesquisa por nome ou username */
    /** @return UserDTO[] */
    public function pesquisar(string $query): array;

    // ── Admin ──────────────────────────────────

    /** @return UserDTO[] */
    public function listarTodos(): array;

    public function ativar(string $id): bool;
}