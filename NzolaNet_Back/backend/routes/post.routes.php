<?php

$authUser   = $authMiddleware->handle();
$controller = new PostController($postService);
$input      = json_decode(file_get_contents("php://input"), true) ?? [];
$action     = $_GET['action'] ?? null;

switch ($action) {

    // POST ?route=post&action=criar
    case 'criar':
        $dto = new PostDTO(
            id:            "",
            user_id:       $authUser->id,
            conteudo:      $input['conteudo'] ?? null,
            eliminado:     false,
            criado_em:     "",
            atualizado_em: ""
        );
        $controller->create($authUser->id, $dto);
        break;


    // PUT ?route=post&action=editar
    case 'editar':
        $id  = $input['id'] ?? '';
        $dto = new PostDTO(
            id:            $id,
            user_id:       $authUser->id,
            conteudo:      $input['conteudo'] ?? null,
            eliminado:     false,
            criado_em:     "",
            atualizado_em: ""
        );
        $controller->update($id, $dto);
        break;

    // DELETE ?route=post&action=eliminar
    case 'eliminar':
        $id = $input['id'] ?? $_GET['id'] ?? '';
        $controller->delete($id, $authUser->id);
        break;

    // GET ?route=post&action=meusPosts&page=1&limit=10
    case 'meusPosts':
        $page  = (int) ($_GET['page']  ?? 1);
        $limit = (int) ($_GET['limit'] ?? 10);
        $controller->getMyPosts($authUser->id, $page, $limit);
        break;

    // GET ?route=post&action=postsDeUtilizador&user_id=XXX&page=1&limit=10
    // Só mostra se: perfil público OU eu sigo esse utilizador
    case 'postsDeUtilizador':
        $userId = $_GET['user_id'] ?? '';
        $page   = (int) ($_GET['page']  ?? 1);
        $limit  = (int) ($_GET['limit'] ?? 10);
        $controller->getPostsDeUtilizador($authUser->id, $userId, $page, $limit);
        break;

    // GET ?route=post&action=feed&page=1&limit=10
    // Se segue alguém → posts dos seguidos (público ou privado)
    // Se não segue ninguém → posts de perfis públicos
    case 'feed':
        $page  = (int) ($_GET['page']  ?? 1);
        $limit = (int) ($_GET['limit'] ?? 10);
        $controller->feed($authUser->id, $page, $limit);
        break;

    case 'obterPorId':
        $id = $_GET['id'] ?? '';
        $controller->getById($id, $authUser->id);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação inválida"]);
        break;
}