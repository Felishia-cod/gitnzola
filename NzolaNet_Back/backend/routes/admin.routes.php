<?php

$adminUser  = $adminMiddleware->handle();
$input      = json_decode(file_get_contents("php://input"), true) ?? [];
$action     = $_GET['action'] ?? null;

$userController    = new UserController($userService);
$commentController = new CommentController($commentService);
$reportController  = new ReportController($reportService);

switch ($action) {

    // GET ?route=admin&action=listarUtilizadores
    case 'listarUtilizadores':
        $userController->listarTodos();
        break;

    // PUT ?route=admin&action=ativarUtilizador
    case 'ativarUtilizador':
        $id = $input['id'] ?? '';

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "id é obrigatório"]);
            exit();
        }

        $userController->ativar($id);
        break;

    // PUT ?route=admin&action=desativarUtilizador
    case 'desativarUtilizador':
        $id = $input['id'] ?? '';

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "id é obrigatório"]);
            exit();
        }

        if ($id === $adminUser->id) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Não podes desativar a tua própria conta"
            ]);
            exit();
        }

        $userController->desativar($id);
        break;

    // DELETE ?route=admin&action=eliminarComentario
    case 'eliminarComentario':
        $id = $input['id'] ?? '';

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "id é obrigatório"]);
            exit();
        }

        $commentController->deleteByAdmin($id);
        break;

    // GET ?route=admin&action=listarReports&page=1&limit=20
    case 'listarReports':
        $page  = (int) ($_GET['page']  ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);
        $reportController->getAll($page, $limit);
        break;

    // PUT ?route=admin&action=resolverReport
    case 'resolverReport':
        $reportId = $input['id']   ?? '';
        $acao     = $input['acao'] ?? 'apenas_resolver';

        if (empty($reportId)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "id é obrigatório"]);
            exit();
        }

        $report = $reportService->getById($reportId);

        if (!$report) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Report não encontrado"
            ]);
            exit();
        }

        switch ($acao) {

            case 'apenas_resolver':
                $reportController->resolve($reportId, $adminUser->id);
                break;

            case 'eliminar_post':
                if ($report->referencia_tipo === 'post') {
                    // Admin passa o seu próprio id como authUserId
                    // para contornar a verificação de autoria
                    $post = $postService->getById(
                        $report->referencia_id,
                        $adminUser->id
                    );
                    if ($post) {
                        // Apagar directamente pelo repository sem verificar autoria
                        $postRepository->delete($report->referencia_id);
                        $mediaRepository->deleteByPost($report->referencia_id);
                        $bazeRepository->deleteByPost($report->referencia_id);
                        $commentRepository->deleteByPost($report->referencia_id);
                    }
                }
                $reportController->resolve($reportId, $adminUser->id);
                break;

            case 'eliminar_comentario':
                if ($report->referencia_tipo === 'comment') {
                    $commentService->deleteByAdmin($report->referencia_id);
                }
                $reportController->resolve($reportId, $adminUser->id);
                break;

            case 'desativar_user':
                $userIdParaDesativar = null;

                if ($report->referencia_tipo === 'user') {
                    $userIdParaDesativar = $report->referencia_id;

                } elseif ($report->referencia_tipo === 'post') {
                    $post = $postService->getById(
                        $report->referencia_id,
                        $adminUser->id
                    );
                    if ($post) {
                        $userIdParaDesativar = $post->user_id;
                    }

                } elseif ($report->referencia_tipo === 'comment') {
                    $comment = $commentService->getById($report->referencia_id);
                    if ($comment) {
                        $userIdParaDesativar = $comment->user_id;
                    }
                }

                // Nunca desativar o próprio admin
                if ($userIdParaDesativar && $userIdParaDesativar !== $adminUser->id) {
                    $userService->deleteUser($userIdParaDesativar);
                }

                $reportController->resolve($reportId, $adminUser->id);
                break;

            default:
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "acao inválida. Usa: apenas_resolver, eliminar_post, eliminar_comentario ou desativar_user"
                ]);
                exit();
        }
        break;

    // PUT ?route=admin&action=ignorarReport
    case 'ignorarReport':
        $id = $input['id'] ?? '';

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "id é obrigatório"]);
            exit();
        }

        $reportController->ignore($id);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação inválida"]);
        break;
}