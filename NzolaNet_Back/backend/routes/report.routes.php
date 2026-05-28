<?php

$input  = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $_GET['action'] ?? null;

switch ($action) {

    case 'create':

        $authUser       = $authMiddleware->handle();
        $controller     = new ReportController($reportService);

        $referenciaTipo = $input['referencia_tipo'] ?? '';
        $referenciaId   = $input['referencia_id']   ?? '';
        $motivo         = $input['motivo']           ?? '';

        // Validar referencia_tipo
        if (!in_array($referenciaTipo, ['post', 'comment', 'user'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "referencia_tipo inválido. Usa: post, comment ou user"
            ]);
            exit();
        }

        // Validar motivo
        $motivosValidos = [
            'spam',
            'ofensivo',
            'inapropriado',
            'desinformacao',
            'violencia',
            'outro'
        ];

        if (!in_array($motivo, $motivosValidos)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "motivo inválido. Usa: spam, ofensivo, inapropriado, desinformacao, violencia ou outro"
            ]);
            exit();
        }

        // ── Impedir reportar a si próprio ─────────────────────

        // Não podes reportar o teu próprio perfil
        if ($referenciaTipo === 'user' && $referenciaId === $authUser->id) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Não podes reportar o teu próprio perfil"
            ]);
            exit();
        }

        // Não podes reportar os teus próprios posts
        if ($referenciaTipo === 'post') {
            $post = $postService->getById($referenciaId, $authUser->id);

            if ($post && $post->user_id === $authUser->id) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "Não podes reportar os teus próprios posts"
                ]);
                exit();
            }
        }

        // Não podes reportar os teus próprios comentários
        if ($referenciaTipo === 'comment') {
            $comment = $commentService->getById($referenciaId);

            if ($comment && $comment->user_id === $authUser->id) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "Não podes reportar os teus próprios comentários"
                ]);
                exit();
            }
        }

        $dto = new ReportDTO(
            id:              "",
            reporter_id:     $authUser->id,
            referencia_id:   $referenciaId,
            referencia_tipo: $referenciaTipo,
            motivo:          $motivo,
            descricao:       $input['descricao'] ?? null,
            status:          "pendente",
            resolvido_por:   null,
            criado_em:       "",
            resolvido_em:    null
        );

        $controller->create($authUser->id, $dto);
        break;

    case 'listarReports':
        $adminMiddleware->handle();
        $controller = new ReportController($reportService);
        $page       = (int) ($_GET['page']  ?? 1);
        $limit      = (int) ($_GET['limit'] ?? 20);
        $controller->getAll($page, $limit);
        break;

    case 'resolver':
        $adminUser  = $adminMiddleware->handle();
        $controller = new ReportController($reportService);
        $reportId   = $input['id'] ?? '';
        $controller->resolve($reportId, $adminUser->id);
        break;

    case 'ignorar':
        $adminMiddleware->handle();
        $controller = new ReportController($reportService);
        $reportId   = $input['id'] ?? '';
        $controller->ignore($reportId);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Ação inválida"
        ]);
        break;
}