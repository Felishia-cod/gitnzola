<?php

declare(strict_types=1);


class Block
{
    public function __construct(

        public string $id,
        public string $bloqueador_id,
        public string $bloqueado_id,
        public string $criado_em
    ) {}
}
