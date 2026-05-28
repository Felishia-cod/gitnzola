<?php

class MediaController extends BaseController
{
    private IMediaService $service;

    public function __construct(IMediaService $service)
    {
        $this->service = $service;
    }

    // Upload físico + guardar na BD
    public function uploadMedia(string $postId, array $file): void
    {
        $result = $this->service->upload($postId, $file);

        $this->json(
            $result,
            $result['success'] ? 201 : 400
        );
    }

    // Ver media de um post
    public function findByPost(string $postId): void
    {
        $media = $this->service->findByPost($postId);

        $this->json([
            "success" => true,
            "data"    => $media
        ]);
    }

    // Eliminar um ficheiro de media
    public function delete(string $mediaId): void
    {
        $result = $this->service->delete($mediaId);

        $this->json([
            "success" => $result,
            "message" => $result ? "Media eliminada" : "Erro ao eliminar"
        ]);
    }
}