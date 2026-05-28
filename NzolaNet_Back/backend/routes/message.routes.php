<?php

$authUser   = $authMiddleware->handle();
$controller = new MessageController($messageService);
$input      = json_decode(file_get_contents("php://input"), true) ?? [];
$action     = $_GET['action'] ?? null;

switch ($action) {

    // POST ?route=message&action=send
    case 'send':
        $dto = new MessageDTO(
            id:              "",
            conversation_id: $input['conversation_id'] ?? '',
            remetente_id:    $authUser->id,
            conteudo:        $input['conteudo']         ?? '',
            lida:            false,
            eliminado:       false,
            criado_em:       ""
        );
        $controller->sendMessage($authUser->id, $dto);
        break;

    // GET ?route=message&action=getByConversation&conversation_id=XXX&page=1&limit=20
    case 'getByConversation':
        $conversationId = $_GET['conversation_id'] ?? '';
        $page           = (int) ($_GET['page']  ?? 1);
        $limit          = (int) ($_GET['limit'] ?? 20);
        $controller->getByConversation($conversationId, $page, $limit);
        break;

    // DELETE ?route=message&action=delete
    case 'delete':
        $id = $input['id'] ?? $_GET['id'] ?? '';
        $controller->delete($id);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação inválida"]);
        break;
}
