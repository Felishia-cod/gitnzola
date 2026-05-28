<?php

interface ISessionService {

    public function create(SessionDTO $dto): bool;

    public function validateToken(string $token): ?SessionDTO;

    public function delete(string $token): bool;
}