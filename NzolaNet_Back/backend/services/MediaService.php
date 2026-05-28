<?php

declare(strict_types=1);

class MediaService extends BaseService implements IMediaService
{
    private IMediaRepository $mediaRepository;
    private UploadService    $uploadService;

    public function __construct(
        IMediaRepository $mediaRepository,
        UploadService    $uploadService
    ) {
        $this->mediaRepository = $mediaRepository;
        $this->uploadService   = $uploadService;
    }

    // ============================================================
    // UPLOAD FÍSICO + GUARDAR NA BD
    // ============================================================
public function upload(string $postId, array $file): array
{
    // Verificar se o post já tem media
    $mediaExistente = $this->mediaRepository->findByPost($postId);

    if (count($mediaExistente) > 0) {
        return [
            "success" => false,
            "message" => "Esta publicação já tem um ficheiro. Só é permitido 1 por publicação."
        ];
    }

    // Detectar tipo pelo mime
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    $tipo = $this->getTipo($mimeType);

    if ($tipo === 'unknown') {
        return [
            "success" => false,
            "message" => "Tipo de ficheiro inválido"
        ];
    }

    // Upload físico para disco
    $upload = $this->uploadService->uploadMedia($file, $tipo);

    if (!$upload['success']) {
        return $upload;
    }

    // Guardar registo na BD
    $media = new Media(
        id:            $this->generateUUID(),
        post_id:       $postId,
        tipo:          $tipo,
        url:           $upload['url'],
        mime_type:     $mimeType,
        tamanho_bytes: $file['size'],
        ordem:         0,
        criado_em:     date("Y-m-d H:i:s")
    );

    $created = $this->mediaRepository->create($media);

    if (!$created) {
        return [
            "success" => false,
            "message" => "Erro ao guardar media na base de dados"
        ];
    }

    return [
        "success" => true,
        "message" => "Media carregada com sucesso",
        "data"    => [
            "url"  => $upload['url'],
            "tipo" => $tipo
        ]
    ];
}

    // ============================================================
    // CRIAR REGISTO NA BD (sem upload físico)
    // ============================================================

    public function create(string $postId, MediaDTO $dto): bool
    {
        $media = new Media(
            id:            $this->generateUUID(),
            post_id:       $postId,
            tipo:          $dto->tipo,
            url:           $dto->url,
            mime_type:     $dto->mime_type,
            tamanho_bytes: $dto->tamanho_bytes,
            ordem:         $dto->ordem,
            criado_em:     date("Y-m-d H:i:s")
        );

        return $this->mediaRepository->create($media);
    }

    // ============================================================
    // BUSCAR MEDIA DE UM POST
    // ============================================================

    public function findByPost(string $postId): array
    {
        return $this->mediaRepository->findByPost($postId);
    }

    // ============================================================
    // ELIMINAR
    // ============================================================

    public function delete(string $mediaId): bool
    {
        return $this->mediaRepository->delete($mediaId);
    }

    public function deleteByPost(string $postId): bool
    {
        return $this->mediaRepository->deleteByPost($postId);
    }

    // ============================================================
    // HELPER — tipo correto para o schema
    // ============================================================

    private function getTipo(string $mime): string
    {
        if (str_starts_with($mime, 'image/')) {
            return 'imagem'; // schema: CHECK (tipo IN ('imagem', 'video'))
        }

        if (str_starts_with($mime, 'video/')) {
            return 'video';
        }

        return 'unknown';
    }
}