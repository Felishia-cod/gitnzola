<?php

$authUser   = $authMiddleware->handle();
$controller = new CommentController($commentService);
$input      = json_decode(file_get_contents("php://input"), true) ?? [];
$action     = $_GET['action'] ?? null;

switch ($action) {

    // POST ?route=comment&action=create
    case 'create':
        $dto = new CommentDTO(
            id:               "",
            user_id:          $authUser->id,
            post_id:          $input['post_id']  ?? '',
            conteudo:         $input['conteudo'] ?? '',
            eliminado:        false,
            removido_por_admin: false,
            criado_em:        "",
            atualizado_em:    ""
        );
        $controller->create($authUser->id, $dto->post_id, $dto->conteudo);
        break;

    // PUT ?route=comment&action=update
    case 'update':
        $id  = $input['id'] ?? '';
        $dto = new CommentDTO(
            id:               $id,
            user_id:          $authUser->id,
            post_id:          "",
            conteudo:         $input['conteudo'] ?? '',
            eliminado:        false,
            removido_por_admin: false,
            criado_em:        "",
            atualizado_em:    ""
        );
        $controller->update($id, $dto);
        break;

    // DELETE ?route=comment&action=delete
    case 'delete':
        $id = $input['id'] ?? $_GET['id'] ?? '';
        $controller->delete($id, $authUser->id);
        break;

    // GET ?route=comment&action=getByPost&post_id=XXX&page=1&limit=10
    case 'getByPost':
        $postId = $_GET['post_id'] ?? '';
        $page   = (int) ($_GET['page']  ?? 1);
        $limit  = (int) ($_GET['limit'] ?? 10);
        $controller->getByPost($postId, $page, $limit);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação inválida"]);
        break;
}
