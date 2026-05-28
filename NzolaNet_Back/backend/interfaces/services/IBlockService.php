<?php

interface IBlockService {

    public function block(BlockDTO $dto, string $bloqueadorId): bool;

    public function unblock(string $bloqueadorId, string $bloqueadoId): bool;

    public function isBlocked(string $a, string $b): bool;
}