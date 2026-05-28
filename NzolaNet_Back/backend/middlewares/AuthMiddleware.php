<?php

class AuthMiddleware
{
    private SessionRepository $sessionRepository;
    private UserRepository    $userRepository;

    public function __construct($database)
    {
        $this->sessionRepository = new SessionRepository($database);
        $this->userRepository    = new UserRepository($database);
    }

    // ============================================================
    // VERIFICAR TOKEN — devolve UserDTO ou termina com 401
    // ============================================================

    public function handle(): UserDTO
    {
        $headers = getallheaders();

        if (!isset($headers['Authorization'])) {
            $this->unauthorized("Token não fornecido");
        }

        $token = str_replace("Bearer ", "", $headers['Authorization']);

        if (empty($token)) {
            $this->unauthorized("Token inválido");
        }

        $tokenHash = hash("sha256", $token);

        // findByToken devolve SessionDTO (objeto), não array
        $session = $this->sessionRepository->findByToken($tokenHash);

        if (!$session) {
            $this->unauthorized("Sessão inválida ou expirada");
        }

        // Verificar expiração
        if (strtotime($session->expira_em) < time()) {
            $this->unauthorized("Sessão expirada");
        }

        // Verificar logout
        if ($session->logout_em !== null) {
            $this->unauthorized("Sessão terminada");
        }

        // findById devolve UserDTO (objeto)
        $user = $this->userRepository->findById($session->user_id);

        if (!$user) {
            $this->unauthorized("Utilizador não encontrado");
        }

        if (!$user->is_active) {
            $this->unauthorized("Conta desativada");
        }

        return $user;
    }

    // ============================================================

    private function unauthorized(string $message): never
    {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => $message]);
        exit();
    }
}
