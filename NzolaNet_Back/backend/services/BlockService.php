<?php

declare(strict_types=1);

class BlockService extends BaseService implements IBlockService
{
    private IBlockRepository $blockRepository;

    public function __construct(IBlockRepository $blockRepository)
    {
        $this->blockRepository = $blockRepository;
    }

    public function block(
        BlockDTO $dto,
        string $bloqueadorId
    ): bool {

        $block = new Block(
            id: $this->generateUUID(),
            bloqueador_id: $bloqueadorId,
            bloqueado_id: $dto->bloqueado_id,
            criado_em: date("Y-m-d H:i:s")
        );

        return $this->blockRepository->block($block);
    }

    public function unblock(
        string $bloqueadorId,
        string $bloqueadoId
    ): bool {

        return $this->blockRepository->unblock(
            $bloqueadorId,
            $bloqueadoId
        );
    }

    public function isBlocked(
        string $a,
        string $b
    ): bool {

        return $this->blockRepository->isBlocked($a, $b);
    }
}