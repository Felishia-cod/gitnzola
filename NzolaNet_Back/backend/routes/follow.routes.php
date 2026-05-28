<?php

$authUser   = $authMiddleware->handle();
$controller = new FollowController($followService);
$input      = json_decode(file_get_contents("php://input"), true) ?? [];
$action     = $_GET['action'] ?? null;

switch ($action) {

    // POST ?route=follow&action=follow
    case 'follow':
        $seguidoId = $input['seguido_id'] ?? '';
        $controller->follow($authUser->id, $seguidoId);
        break;

    // DELETE ?route=follow&action=unfollow
    case 'unfollow':
        $seguidoId = $input['seguido_id'] ?? $_GET['seguido_id'] ?? '';
        $controller->unfollow($authUser->id, $seguidoId);
        break;

    // GET ?route=follow&action=isFollowing&seguido_id=XXX
    case 'isFollowing':
        $seguidoId = $_GET['seguido_id'] ?? '';
        $controller->isFollowing($authUser->id, $seguidoId);
        break;

    // GET ?route=follow&action=followers
    case 'followers':
        $userId = $_GET['user_id'] ?? $authUser->id;
        $controller->getFollowers($userId);
        break;

    // GET ?route=follow&action=following
    case 'following':
        $userId = $_GET['user_id'] ?? $authUser->id;
        $controller->getFollowing($userId);
        break;

    // GET ?route=follow&action=pedidosPendentes
    case 'pedidosPendentes':
        $controller->getPedidosPendentes($authUser->id);
        break;

    // PUT ?route=follow&action=aceitar
    case 'aceitar':
        $seguidorId = $input['seguidor_id'] ?? '';
        $controller->aceitarFollow($seguidorId, $authUser->id);
        break;

    // DELETE ?route=follow&action=rejeitar
    case 'rejeitar':
        $seguidorId = $input['seguidor_id'] ?? '';
        $controller->rejeitarFollow($seguidorId, $authUser->id);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação inválida"]);
        break;
}