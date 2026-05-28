<?php

$controller = new AuthController(
    $userService,
    $sessionService,
    $emailVerificationService,
    $passwordResetService
);

$input  = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $_GET['action'] ?? null;
$token  = $_GET['token'] ?? ($input['token'] ?? null);

switch ($action) {

    case 'registar':
        $dto = new UserRegisterDTO(
            nome:            trim($input['nome']           ?? ''),
            username:        trim($input['username']       ?? ''),
            email:           trim($input['email']          ?? ''),
            password:        $input['password']            ?? '',
            data_nascimento: $input['data_nascimento']     ?? '',
            genero:          $input['genero']              ?? ''
        );
        $controller->register($dto);
        break;

    case 'login':
        $dto = new UserLoginDTO(
            email:    trim($input['email']    ?? ''),
            password: $input['password']      ?? ''
        );
        $controller->login($dto);
        break;

    case 'logout':
        $headers    = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        $rawToken   = str_replace("Bearer ", "", $authHeader);
        if (empty($rawToken)) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Token não fornecido"]);
            exit();
        }
        $controller->logout($rawToken);
        break;

    case 'verificarEmail':
        if (empty($token)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Token em falta"]);
            exit();
        }
        $controller->verifyEmail($token);
        break;

    case 'esqueceuPassword':
        $dto = new ForgotPasswordDTO(
            email: trim($input['email'] ?? '')
        );
        $controller->forgotPassword($dto);
        break;

    case 'redefinirPassword':
        $dto = new PasswordResetDTO(
            token:    $token              ?? '',
            password: $input['password'] ?? ''
        );
        $controller->resetPassword($dto);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Ação inválida"
        ]);
        break;
}