<?php

$authUser   = $authMiddleware->handle();
$controller = new BazeController($bazeService);
$input      = json_decode(file_get_contents("php://input"), true) ?? [];
$action     = $_GET['action'] ?? null;

switch ($action) {

    // POST ?route=baze&action=like
    case 'like':
        $postId = $input['post_id'] ?? '';
        $controller->like($authUser->id, $postId);
        break;

    // DELETE ?route=baze&action=unlike
    case 'unlike':
        $postId = $input['post_id'] ?? $_GET['post_id'] ?? '';
        $controller->unlike($authUser->id, $postId);
        break;

    // GET ?route=baze&action=count&post_id=XXX
    case 'count':
        $postId = $_GET['post_id'] ?? '';
        $controller->count($postId);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação inválida"]);
        break;
}
