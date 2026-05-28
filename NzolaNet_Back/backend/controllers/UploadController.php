<?php

class UploadController extends BaseController
{
    private UploadService $uploadService;
    private IUserRepository $userRepository;
    private IMediaService $mediaService;

    public function __construct(
        UploadService $uploadService,
        IUserRepository $userRepository,
        IMediaService $mediaService
    ) {
        $this->uploadService  = $uploadService;
        $this->userRepository = $userRepository;
        $this->mediaService   = $mediaService;
    }

    // ============================================================
    // UPLOAD FOTO PERFIL
    // ============================================================

    public function uploadFotoPerfil(string $userId): void
    {
        if (!isset($_FILES['foto'])) {
            $this->json([
                "success" => false,
                "message" => "Nenhum ficheiro enviado"
            ], 400);
        }

        $result = $this->uploadService->uploadFotoPerfil($_FILES['foto']);

        if (!$result['success']) {
            $this->json([
                "success" => false,
                "message" => $result['message']
            ], 400);
        }

        // Atualizar URL na base de dados
        $updated = $this->userRepository->updateFotoPerfil(
            $userId,
            $result['url']
        );

        $this->json([
            "success" => $updated,
            "message" => $updated ? "Foto de perfil atualizada" : "Erro ao guardar",
            "data"    => ["url" => $result['url']]
        ]);
    }

    // ============================================================
    // UPLOAD FOTO CAPA
    // ============================================================

    public function uploadFotoCapa(string $userId): void
    {
        if (!isset($_FILES['foto'])) {
            $this->json([
                "success" => false,
                "message" => "Nenhum ficheiro enviado"
            ], 400);
        }

        $result = $this->uploadService->uploadFotoCapa($_FILES['foto']);

        if (!$result['success']) {
            $this->json([
                "success" => false,
                "message" => $result['message']
            ], 400);
        }

        $updated = $this->userRepository->updateFotoCapa(
            $userId,
            $result['url']
        );

        $this->json([
            "success" => $updated,
            "message" => $updated ? "Foto de capa atualizada" : "Erro ao guardar",
            "data"    => ["url" => $result['url']]
        ]);
    }

    // ============================================================
    // UPLOAD MEDIA (imagem ou vídeo para publicação)
    // ============================================================

    public function uploadMedia(string $postId): void
    {
        if (!isset($_FILES['media'])) {
            $this->json([
                "success" => false,
                "message" => "Nenhum ficheiro enviado"
            ], 400);
        }

        $file = $_FILES['media'];

        // Detectar tipo
        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $imageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        $videoMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];

        if (in_array($mimeType, $imageMimes)) {
            $tipo = 'imagem';
        } elseif (in_array($mimeType, $videoMimes)) {
            $tipo = 'video';
        } else {
            $this->json([
                "success" => false,
                "message" => "Tipo de ficheiro inválido. Usa JPEG, PNG, WebP, MP4 ou WebM"
            ], 400);
        }

        $result = $this->uploadService->uploadMedia($file, $tipo);

        if (!$result['success']) {
            $this->json([
                "success" => false,
                "message" => $result['message']
            ], 400);
        }

        // Guardar registo na tabela media
        $ordem = (int) ($_POST['ordem'] ?? 0);

        $dto = new MediaDTO(
            id:             "",
            post_id:        $postId,
            tipo:           $tipo,
            url:            $result['url'],
            mime_type:      $mimeType,
            tamanho_bytes:  $file['size'],
            ordem:          $ordem,
            criado_em:      ""
        );

        $saved = $this->mediaService->create($postId, $dto);

        $this->json([
            "success" => $saved,
            "message" => $saved ? "Media carregada com sucesso" : "Erro ao guardar media",
            "data"    => [
                "url"   => $result['url'],
                "tipo"  => $tipo,
                "ordem" => $ordem
            ]
        ]);
    }
}