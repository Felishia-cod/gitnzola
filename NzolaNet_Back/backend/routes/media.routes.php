<?php

$authUser   = $authMiddleware->handle();
$controller = new MediaController($mediaService);
$action     = $_GET['action'] ?? null;
$input      = json_decode(file_get_contents("php://input"), true) ?? [];

switch ($action) {

    // POST ?route=media&action=upload
    // form-data: media (File), post_id (Text), ordem (Text opcional)
    case 'upload':
        $file   = $_FILES['media'] ?? null;
        $postId = $_POST['post_id'] ?? null;

        if (!$file || !$postId) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "media (ficheiro) e post_id são obrigatórios"
            ]);
            exit();
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Erro no upload do ficheiro"
            ]);
            exit();
        }

        $controller->uploadMedia($postId, $file);
        break;

    // GET ?route=media&action=findByPost&post_id=XXX
    case 'findByPost':
        $postId = $_GET['post_id'] ?? '';

        if (empty($postId)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "post_id é obrigatório"
            ]);
            exit();
        }

        $controller->findByPost($postId);
        break;

    // DELETE ?route=media&action=delete
    // Body raw JSON: { "id": "ID_DA_MEDIA" }
    case 'delete':
        $id = $input['id'] ?? $_GET['id'] ?? '';

        if (empty($id)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "id é obrigatório"
            ]);
            exit();
        }

        $controller->delete($id);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Ação inválida"
        ]);
        break;
}