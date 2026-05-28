<?php

class UploadService
{
    // Tamanho máximo imagem — 5MB
    private int $maxSizeImagem = 5 * 1024 * 1024;

    // Tamanho máximo vídeo — 50MB
    private int $maxSizeVideo = 50 * 1024 * 1024;

    private array $imageMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];

    private array $videoMimes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/webm'
    ];

    // ============================================================
    // UPLOAD FOTO PERFIL
    // ============================================================

    public function uploadFotoPerfil(array $file): array
    {
        return $this->uploadImagem($file, 'perfil');
    }

    // ============================================================
    // UPLOAD FOTO CAPA
    // ============================================================

    public function uploadFotoCapa(array $file): array
    {
        return $this->uploadImagem($file, 'capa');
    }

    // ============================================================
    // UPLOAD MEDIA (imagem ou vídeo para publicações)
    // ============================================================

    public function uploadMedia(array $file, string $tipo): array
    {
        if ($tipo === 'video') {
            return $this->uploadVideo($file);
        }

        return $this->uploadImagem($file, 'posts');
    }

    // ============================================================
    // UPLOAD IMAGEM (genérico)
    // ============================================================

    private function uploadImagem(array $file, string $pasta): array
    {
        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return [
                "success" => false,
                "message" => "Nenhum ficheiro enviado ou erro no upload"
            ];
        }

        if ($file['size'] > $this->maxSizeImagem) {
            return [
                "success" => false,
                "message" => "Imagem demasiado grande. Máximo 5MB"
            ];
        }

        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $this->imageMimes)) {
            return [
                "success" => false,
                "message" => "Tipo inválido. Usa JPEG, PNG ou WebP"
            ];
        }

        return $this->moverFicheiro($file, $pasta, $mimeType);
    }

    // ============================================================
    // UPLOAD VÍDEO
    // ============================================================

    private function uploadVideo(array $file): array
    {
        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return [
                "success" => false,
                "message" => "Nenhum ficheiro enviado ou erro no upload"
            ];
        }

        if ($file['size'] > $this->maxSizeVideo) {
            return [
                "success" => false,
                "message" => "Vídeo demasiado grande. Máximo 50MB"
            ];
        }

        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $this->videoMimes)) {
            return [
                "success" => false,
                "message" => "Tipo inválido. Usa MP4, WebM ou MOV"
            ];
        }

        return $this->moverFicheiro($file, 'videos', $mimeType);
    }

    // ============================================================
    // MOVER FICHEIRO PARA DISCO
    // ============================================================

    private function moverFicheiro(array $file, string $pasta, string $mimeType): array
    {
        $extensao     = $this->getExtensao($mimeType);
        $nomeUnico    = uniqid() . '_' . time() . '.' . $extensao;
        $pastaDestino = __DIR__ . "/../uploads/$pasta/";
        $caminhoFinal = $pastaDestino . $nomeUnico;

        // Criar pasta se não existir
        if (!is_dir($pastaDestino)) {
            mkdir($pastaDestino, 0755, true);
        }

        if (!move_uploaded_file($file['tmp_name'], $caminhoFinal)) {
            return [
                "success" => false,
                "message" => "Erro ao guardar o ficheiro no servidor"
            ];
        }

        $url = "http://localhost:8081/NzolaNet/backend/uploads/$pasta/" . $nomeUnico;

        return [
            "success" => true,
            "url"     => $url
        ];
    }

    // ============================================================
    // OBTER EXTENSÃO
    // ============================================================

    private function getExtensao(string $mimeType): string
    {
        $extensoes = [
            'image/jpeg'      => 'jpg',
            'image/jpg'       => 'jpg',
            'image/png'       => 'png',
            'image/webp'      => 'webp',
            'video/mp4'       => 'mp4',
            'video/mpeg'      => 'mpeg',
            'video/quicktime' => 'mov',
            'video/webm'      => 'webm',
        ];

        return $extensoes[$mimeType] ?? 'bin';
    }
}