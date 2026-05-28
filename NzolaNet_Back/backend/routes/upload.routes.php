<?php

$authUser   = $authMiddleware->handle();
$action     = $_GET['action'] ?? null;

$controller = new UploadController(
    new UploadService(),
    $userRepository,
    $mediaService
);

switch ($action) {

    // POST ?route=upload&action=fotoPerfil
    // form-data: foto (file)
    case 'fotoPerfil':
        $controller->uploadFotoPerfil($authUser->id);
        break;

    // POST ?route=upload&action=fotoCapa
    // form-data: foto (file)
    case 'fotoCapa':
        $controller->uploadFotoCapa($authUser->id);
        break;

    // POST ?route=upload&action=media
    // form-data: media (file), post_id (text), ordem (text, opcional)
    case 'media':
        $postId = $_POST['post_id'] ?? '';

        if (empty($postId)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "post_id é obrigatório"
            ]);
            exit();
        }

        $controller->uploadMedia($postId);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Ação inválida"
        ]);
        break;
}