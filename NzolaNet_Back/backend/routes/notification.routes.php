<?php

$authUser   = $authMiddleware->handle();
$controller = new NotificationController($notificationService);
$input      = json_decode(file_get_contents("php://input"), true) ?? [];
$action     = $_GET['action'] ?? null;

switch ($action) {

    // GET ?route=notification&action=getAll&page=1&limit=20
    case 'getAll':
        $page  = (int) ($_GET['page']  ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);
        $controller->getByUser($authUser->id, $page, $limit);
        break;

    // PUT ?route=notification&action=markAsRead
    case 'markAsRead':
        $id = $input['id'] ?? $_GET['id'] ?? '';
        $controller->markAsRead($id);
        break;

    // PUT ?route=notification&action=markAllAsRead
    case 'markAllAsRead':
        $controller->markAllAsRead($authUser->id);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação inválida"]);
        break;
}
