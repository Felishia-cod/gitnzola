<?php

declare(strict_types=1);

class PasswordResetService extends BaseService implements IPasswordResetService
{
    private IPasswordResetRepository $passwordResetRepository;
    private IUserRepository $userRepository;
    private ISessionRepository $sessionRepository;
    private EmailService $emailService;

    public function __construct(
        IPasswordResetRepository $passwordResetRepository,
        IUserRepository $userRepository,
        ISessionRepository $sessionRepository,
        EmailService $emailService
    ) {
        $this->passwordResetRepository = $passwordResetRepository;
        $this->userRepository = $userRepository;
        $this->sessionRepository = $sessionRepository;
        $this->emailService = $emailService;
    }

    // ============================================================
    // PEDIR RESET
    // ============================================================

    public function requestReset(ForgotPasswordDTO $dto): bool
    {
        $user = $this->userRepository->findByEmail($dto->email);

        if (!$user) {
            return true;
        }

        // apagar tokens antigos
        $this->passwordResetRepository->deleteByUserId($user->id);

        // gerar token
        $plainToken = bin2hex(random_bytes(32));
        $tokenHash = hash("sha256", $plainToken);

        $token = new PasswordResetToken(
            id: $this->generateUUID(),
            user_id: $user->id,
            token_hash: $tokenHash,
            expira_em: date("Y-m-d H:i:s", strtotime("+24 hours")),
            usado: false,
            criado_em: date("Y-m-d H:i:s")
        );

        $created = $this->passwordResetRepository->create($token);

        if (!$created) {
            return false;
        }

        return $this->emailService->sendPasswordResetEmail(
            $user->email,
            $user->nome,
            $plainToken
        );
    }

    // ============================================================
    // RESET PASSWORD
    // ============================================================

    public function resetPassword(PasswordResetDTO $dto): bool
    {
        $tokenHash = hash("sha256", $dto->token);

        $token = $this->passwordResetRepository->findByToken($tokenHash);

        if (!$token) {
            return false;
        }

        // já usado
        if ($token->usado) {
            return false;
        }

        // expirado
        if (strtotime($token->expira_em) < time()) {
            return false;
        }

        $passwordHash = password_hash($dto->password, PASSWORD_DEFAULT);

        $updated = $this->userRepository->updatePassword(
            $token->user_id,
            $passwordHash
        );

        if (!$updated) {
            return false;
        }

        // marcar como usado
        $this->passwordResetRepository->markAsUsed($tokenHash);

        // remover sessões antigas
        $this->sessionRepository->deleteAllByUserId($token->user_id);

        return true;
    }
}