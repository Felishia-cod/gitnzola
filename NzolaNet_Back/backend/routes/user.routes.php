<?php

$authUser   = $authMiddleware->handle();
$controller = new UserController($userService);
$input      = json_decode(file_get_contents("php://input"), true) ?? [];
$action     = $_GET['action'] ?? null;

switch ($action) {

    // GET ?route=user&action=obterPerfil
    case 'obterPerfil':
        $controller->getById($authUser->id);
        break;

    // GET ?route=user&action=obterPerfilDeUtilizador&id=XXX
    case 'obterPerfilDeUtilizador':
        $id = $_GET['id'] ?? '';
        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "id é obrigatório"]);
            exit();
        }
        $controller->getById($id);
        break;

    // PUT ?route=user&action=editarPerfil
    case 'editarPerfil':
        $dto = new UpdateUserDTO(
            nome:        $input['nome']        ?? null,
            bio:         $input['bio']         ?? null,
            foto_perfil: null,
            foto_capa:   null,
            privacidade: $input['privacidade'] ?? null
        );
        $controller->updateProfile($authUser->id, $dto);
        break;

    // PUT ?route=user&action=alterarPassword
    case 'alterarPassword':
        $passwordAtual = $input['password_atual'] ?? '';
        $passwordNova  = $input['password_nova']  ?? '';

        if (empty($passwordAtual) || empty($passwordNova)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "password_atual e password_nova são obrigatórios"
            ]);
            exit();
        }

        $controller->alterarPassword(
            $authUser->id,
            $passwordAtual,
            $passwordNova
        );
        break;

    // DELETE ?route=user&action=eliminarConta
    case 'eliminarConta':
        $controller->delete($authUser->id);
        break;

    // GET ?route=user&action=pesquisarUtilizadores&q=joao
    case 'pesquisarUtilizadores':
        $query = $_GET['q'] ?? '';
        if (empty($query)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Parâmetro q é obrigatório"
            ]);
            exit();
        }
        $controller->pesquisar($query);
        break;

    // DELETE ?route=user&action=removerFotoPerfil
    case 'removerFotoPerfil':
        $controller->removerFotoPerfil($authUser->id);
        break;

    // DELETE ?route=user&action=removerFotoCapa
    case 'removerFotoCapa':
        $controller->removerFotoCapa($authUser->id);
        break;

    // GET ?route=user&action=pessoas&page=1&limit=50
    case 'pessoas':
        $page  = (int) ($_GET['page']  ?? 1);
        $limit = (int) ($_GET['limit'] ?? 50);
        $controller->listarTodos();
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação inválida"]);
        break;
}