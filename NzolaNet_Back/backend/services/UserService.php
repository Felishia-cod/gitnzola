<?php

declare(strict_types=1);

class UserService extends BaseService implements IUserService
{
    private IUserRepository              $userRepository;
    private IEmailVerificationRepository $emailVerificationRepository;
    private EmailService                 $emailService;

    public function __construct(
        IUserRepository              $userRepository,
        IEmailVerificationRepository $emailVerificationRepository,
        EmailService                 $emailService
    ) {
        $this->userRepository              = $userRepository;
        $this->emailVerificationRepository = $emailVerificationRepository;
        $this->emailService                = $emailService;
    }

    // ============================================================
    // REGISTO
    // ============================================================

    public function register(UserRegisterDTO $dto): UserDTO
    {
        $start = microtime(true);

        if ($this->userRepository->findByEmail($dto->email)) {
            throw new Exception("Este email já está registado");
        }
        error_log("find email: " . round(microtime(true)-$start,2));

        if ($this->userRepository->findByUsername($dto->username)) {
            throw new Exception("Este username já está em uso");
        }
        error_log("find username: " . round(microtime(true)-$start,2));

        $hash = password_hash($dto->password, PASSWORD_DEFAULT);
        error_log("hash: " . round(microtime(true)-$start,2));

        $user = new User(
            id: $this->generateUUID(),
            nome: $dto->nome,
            username: $dto->username,
            email: $dto->email,
            password_hash: $hash,
            foto_perfil: null,
            foto_capa: null,
            bio: null,
            data_nascimento: $dto->data_nascimento,
            genero: $dto->genero,
            privacidade: "publico",
            is_admin: false,
            is_active: true,
            email_verificado_em: null,
            ultimo_acesso_em: null,
            criado_em: date("Y-m-d H:i:s"),
            atualizado_em: date("Y-m-d H:i:s")
        );

        $created = $this->userRepository->create($user);
        error_log("insert user: " . round(microtime(true)-$start,2));

        if (!$created) {
            throw new Exception("Erro ao criar utilizador");
        }

        $plainToken = bin2hex(random_bytes(32));
        $tokenHash  = hash("sha256", $plainToken);

        $emailToken = new EmailVerificationToken(
            id: $this->generateUUID(),
            user_id: $user->id,
            token_hash: $tokenHash,
            expira_em: date("Y-m-d H:i:s", strtotime("+7 days")),
            criado_em: date("Y-m-d H:i:s")
        );

        $this->emailVerificationRepository->create($emailToken);
        error_log("insert token: " . round(microtime(true)-$start,2));

        $this->emailService->sendVerificationEmail(
            $dto->email,
            $dto->nome,
            $plainToken
        );
        error_log("email send: " . round(microtime(true)-$start,2));

        error_log("TOTAL: " . round(microtime(true)-$start,2));

        return $this->userRepository->findById($user->id);
    }
    // ============================================================
    // LOGIN
    // ============================================================

    public function login(UserLoginDTO $dto): array
    {
        $user = $this->userRepository->findByEmail($dto->email);

        if (!$user) {
            throw new Exception("Credenciais inválidas");
        }

        if (!$user->is_active) {
            throw new Exception("Conta desativada");
        }

        $userWithHash = $this->userRepository->findByEmailWithHash($dto->email);

        if (!$userWithHash) {
            throw new Exception("Credenciais inválidas");
        }

        if (!password_verify($dto->password, $userWithHash->password_hash)) {
            throw new Exception("Credenciais inválidas");
        }

        $this->userRepository->updateUltimoAcesso($user->id);

        $plainToken = bin2hex(random_bytes(32));
        $tokenHash  = hash("sha256", $plainToken);

        return [
            "user"  => $user,
            "token" => $plainToken,
            "hash"  => $tokenHash
        ];
    }

    // ============================================================
    // GETTERS
    // ============================================================

    public function getById(string $id): ?UserDTO
    {
        return $this->userRepository->findById($id);
    }

    // ============================================================
    // ATUALIZAR PERFIL
    // ============================================================

    public function updateProfile(string $id, UpdateUserDTO $dto): bool
    {
        $user = new User(
            id: $id,
            nome: $dto->nome         ?? "",
            username: "",
            email: "",
            password_hash: "",
            foto_perfil: $dto->foto_perfil  ?? null,
            foto_capa: $dto->foto_capa    ?? null,
            bio: $dto->bio          ?? null,
            data_nascimento: null,
            genero: "",
            privacidade: $dto->privacidade  ?? "publico",
            is_admin: false,
            is_active: true,
            email_verificado_em: null,
            ultimo_acesso_em: null,
            criado_em: "",
            atualizado_em: date("Y-m-d H:i:s")
        );

        return $this->userRepository->updateProfile($id, $user);
    }

    // ============================================================
    // ALTERAR PASSWORD (verifica a atual primeiro)
    // ============================================================

    public function alterarPassword(
        string $id,
        string $passwordAtual,
        string $passwordNova
    ): bool {
        // Buscar o user com o hash para verificar
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return false;
        }

        $userWithHash = $this->userRepository->findByEmailWithHash($user->email);

        if (!$userWithHash) {
            return false;
        }

        // Verificar se a password atual está correta
        if (!password_verify($passwordAtual, $userWithHash->password_hash)) {
            return false;
        }

        return $this->userRepository->updatePassword(
            $id,
            password_hash($passwordNova, PASSWORD_DEFAULT)
        );
    }

    // ============================================================
    // ATUALIZAR PASSWORD DIRETA (usado pelo reset de password)
    // ============================================================

    public function updatePassword(string $id, string $password): bool
    {
        return $this->userRepository->updatePassword(
            $id,
            password_hash($password, PASSWORD_DEFAULT)
        );
    }

    // ============================================================
    // ELIMINAR / DESATIVAR
    // ============================================================

    public function deleteUser(string $id): bool
    {
        return $this->userRepository->deactivate($id);
    }

    // ============================================================
    // PESQUISAR
    // ============================================================

    public function pesquisar(string $query): array
    {
        return $this->userRepository->searchUsers($query);
    }
    public function removerFotoPerfil(string $id): bool
    {
        // Buscar o user para saber o URL atual
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return false;
        }

        // Se tem foto, apagar o ficheiro físico do servidor
        if ($user->foto_perfil) {
            $this->apagarFicheiro($user->foto_perfil);
        }

        // Colocar NULL na base de dados
        return $this->userRepository->removerFotoPerfil($id);
    }

    public function removerFotoCapa(string $id): bool
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return false;
        }

        if ($user->foto_capa) {
            $this->apagarFicheiro($user->foto_capa);
        }

        return $this->userRepository->removerFotoCapa($id);
    }

    // ============================================================
    // HELPER — apaga ficheiro físico do servidor
    // ============================================================

    private function apagarFicheiro(string $url): void
    {
        // URL exemplo:
        // http://localhost:8081/NzolaNet/backend/uploads/perfil/abc123.jpg
        // http://localhost:8081/NzolaNet/backend/uploads/capa/abc123.jpg

        $baseUrl  = "http://localhost:8081/NzolaNet/backend/";
        $caminho  = str_replace($baseUrl, "", $url);

        // dirname(__DIR__) = C:\xampp\htdocs\NzolaNet\backend
        $raiz     = dirname(__DIR__);
        $ficheiro = $raiz . DIRECTORY_SEPARATOR . str_replace("/", DIRECTORY_SEPARATOR, $caminho);

        if (file_exists($ficheiro)) {
            unlink($ficheiro);
        }
    }

    // ============================================================
    // ADMIN
    // ============================================================

    public function listarTodos(): array
    {
        return $this->userRepository->getAllUsers();
    }

    public function ativar(string $id): bool
    {
        return $this->userRepository->activateUser($id);
    }
}
