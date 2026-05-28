<?php

class AdminMiddleware
{
    private SessionRepository $sessionRepository;
    private UserRepository    $userRepository;

    public function __construct($database)
    {
        $this->sessionRepository = new SessionRepository($database);
        $this->userRepository    = new UserRepository($database);
    }

    // ============================================================
    // VERIFICAR TOKEN + ADMIN — devolve UserDTO ou termina
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

        // SessionDTO — aceder com -> não com []
        $session = $this->sessionRepository->findByToken($tokenHash);

        if (!$session) {
            $this->unauthorized("Sessão inválida ou expirada");
        }

        if (strtotime($session->expira_em) < time()) {
            $this->unauthorized("Sessão expirada");
        }

        if ($session->logout_em !== null) {
            $this->unauthorized("Sessão terminada");
        }

        // UserDTO — aceder com ->
        $user = $this->userRepository->findById($session->user_id);

        if (!$user) {
            $this->unauthorized("Utilizador não encontrado");
        }

        if (!$user->is_active) {
            $this->unauthorized("Conta desativada");
        }

        if (!$user->is_admin) {
            $this->forbidden("Não tens permissão para aceder a esta área");
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

    private function forbidden(string $message): never
    {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => $message]);
        exit();
    }
}
