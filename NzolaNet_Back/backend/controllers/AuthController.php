<?php

class AuthController extends BaseController
{
    private UserService              $userService;
    private SessionService           $sessionService;
    private EmailVerificationService $emailVerificationService;
    private PasswordResetService     $passwordResetService;

    public function __construct(
        UserService              $userService,
        SessionService           $sessionService,
        EmailVerificationService $emailVerificationService,
        PasswordResetService     $passwordResetService
    ) {
        $this->userService              = $userService;
        $this->sessionService           = $sessionService;
        $this->emailVerificationService = $emailVerificationService;
        $this->passwordResetService     = $passwordResetService;
    }

    // ============================================================
    // REGISTO
    // ============================================================

    public function register(UserRegisterDTO $dto): void
    {
        try {
            $user = $this->userService->register($dto);

            $this->json([
                "success" => true,
                "message" => "Conta criada com sucesso. Verifica o teu email para ativar a conta.",
                "data"    => $user
            ], 201);

        } catch (Exception $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage()
            ], 400);
        }
    }

    // ============================================================
    // LOGIN
    // ============================================================

    public function login(UserLoginDTO $dto): void
    {
        try {
            $result     = $this->userService->login($dto);
            $user       = $result['user'];
            $plainToken = $result['token'];
            $tokenHash  = $result['hash'];

            $sessionDTO = new SessionDTO(
                id:         "",
                user_id:    $user->id,
                token_hash: $tokenHash,
                ip:         $_SERVER['REMOTE_ADDR']     ?? null,
                user_agent: $_SERVER['HTTP_USER_AGENT'] ?? null,
                expira_em:  date("Y-m-d H:i:s", strtotime("+7 days")),
                criado_em:  date("Y-m-d H:i:s"),
                logout_em:  null
            );

            $this->sessionService->create($sessionDTO);

            $this->json([
                "success" => true,
                "message" => "Login efetuado com sucesso",
                "data"    => [
                    "token" => $plainToken,
                    "user"  => $user
                ]
            ]);

        } catch (Exception $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage()
            ], 401);
        }
    }

    // ============================================================
    // LOGOUT
    // ============================================================

    public function logout(string $token): void
    {
        $deleted = $this->sessionService->delete($token);

        $this->json([
            "success" => $deleted,
            "message" => $deleted ? "Sessão terminada" : "Erro ao terminar sessão"
        ]);
    }

    // ============================================================
    // VERIFICAR EMAIL
    // ============================================================

       // ============================================================
    // VERIFICAR EMAIL
    // ============================================================

    public function verifyEmail(string $token): void
    {
        $dto    = new VerifyEmailDTO(token: $token);
        $result = $this->emailVerificationService->verify($dto);

        if ($result) {
            // Redirecionar para o frontend após verificação com sucesso
            header("Location: http://localhost:4200/confirmar-registo");
            exit();
        }

        $this->json([
            "success" => false,
            "message" => "Token inválido ou expirado"
        ], 400);
    }

    // ============================================================
    // ESQUECI A PASSWORD
    // ============================================================

    public function forgotPassword(ForgotPasswordDTO $dto): void
    {
        $this->passwordResetService->requestReset($dto);

        $this->json([
            "success" => true,
            "message" => "Se o email existir, receberás um link para recuperar a password."
        ]);
    }

    // ============================================================
    // RESET DE PASSWORD
    // ============================================================

    public function resetPassword(PasswordResetDTO $dto): void
    {
        $result = $this->passwordResetService->resetPassword($dto);

        if ($result) {
            $this->json([
                "success" => true,
                "message" => "Password alterada com sucesso. Podes fazer login."
            ]);
        } else {
            $this->json([
                "success" => false,
                "message" => "Token inválido, expirado ou já utilizado."
            ], 400);
        }
    }
}