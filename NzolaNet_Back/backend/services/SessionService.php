<?php

declare(strict_types=1);

class SessionService extends BaseService implements ISessionService
{
    private ISessionRepository $sessionRepository;

    public function __construct(ISessionRepository $sessionRepository)
    {
        $this->sessionRepository = $sessionRepository;
    }

    public function create(SessionDTO $dto): bool
    {
        $session = new Session(
            id: $this->generateUUID(),
            user_id: $dto->user_id,
            token_hash: $dto->token_hash,
            ip: $dto->ip,
            user_agent: $dto->user_agent,
            expira_em: $dto->expira_em,
            criado_em: date("Y-m-d H:i:s"),
            logout_em: null
        );

        return $this->sessionRepository->createSession($session);
    }

    public function validateToken(string $token): ?SessionDTO
    {
        $tokenHash = hash("sha256", $token);

        $session = $this->sessionRepository->findByToken($tokenHash);

        if (!$session) {
            return null;
        }

        // verificar expiração
        if (strtotime($session->expira_em) < time()) {
            return null;
        }

        // sessão inválida se já tiver logout
        if ($session->logout_em !== null) {
            return null;
        }

        return $session;
    }

    public function delete(string $token): bool
    {
        $tokenHash = hash("sha256", $token);

        return $this->sessionRepository->deleteSession($tokenHash);
    }
}