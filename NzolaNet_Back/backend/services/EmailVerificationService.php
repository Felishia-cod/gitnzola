<?php

declare(strict_types=1);

class EmailVerificationService extends BaseService implements IEmailVerificationService
{
    private IEmailVerificationRepository $emailVerificationRepository;
    private IUserRepository $userRepository;

    public function __construct(
        IEmailVerificationRepository $emailVerificationRepository,
        IUserRepository $userRepository
    ) {
        $this->emailVerificationRepository = $emailVerificationRepository;
        $this->userRepository = $userRepository;
    }

    public function verify(VerifyEmailDTO $dto): bool
    {
        // transformar token em hash
        $tokenHash = hash("sha256", $dto->token);

        // procurar token
        $token = $this->emailVerificationRepository
            ->findByToken($tokenHash);

        if (!$token) {
            return false;
        }

        // verificar expiração
        if (strtotime($token->expira_em) < time()) {
            return false;
        }

        // verificar email do utilizador
        $updated = $this->userRepository
            ->verifyEmail($token->user_id);

        if (!$updated) {
            return false;
        }

        // apagar token
        $this->emailVerificationRepository
            ->delete($tokenHash);

        return true;
    }
}