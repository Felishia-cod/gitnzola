<?php

declare(strict_types=1);

class PostService extends BaseService implements IPostService
{
    private IPostRepository    $postRepository;
    private IMediaRepository   $mediaRepository;
    private IBazeRepository    $bazeRepository;
    private ICommentRepository $commentRepository;
    private IUserRepository    $userRepository;

    public function __construct(
        IPostRepository    $postRepository,
        IMediaRepository   $mediaRepository,
        IBazeRepository    $bazeRepository,
        ICommentRepository $commentRepository,
        IUserRepository    $userRepository
    ) {
        $this->postRepository    = $postRepository;
        $this->mediaRepository   = $mediaRepository;
        $this->bazeRepository    = $bazeRepository;
        $this->commentRepository = $commentRepository;
        $this->userRepository    = $userRepository;
    }

    public function create(string $userId, PostDTO $dto): ?string
    {
        $id = $this->generateUUID();
        $post = new Post(
            id:            $id,
            user_id:       $userId,
            conteudo:      $dto->conteudo,
            eliminado:     false,
            criado_em:     date("Y-m-d H:i:s"),
            atualizado_em: date("Y-m-d H:i:s")
        );
        $result = $this->postRepository->create($post);
        return $result ? $id : null;
    }

    public function getById(string $postId, string $authUserId): ?PostComMediaDTO
    {
        $post = $this->postRepository->findById($postId);

        if (!$post) return null;

        // Verificar se o authUser pode ver este post
        $podeVer = $this->postRepository->podeVerPosts(
            $authUserId,
            $post->user_id
        );

        if (!$podeVer) return null;

        return $this->enriquecerComMedia($post);
    }



    public function getFeed(string $userId, int $page, int $limit): array
    {
        if ($this->postRepository->hasFollowing($userId)) {
            $posts = $this->postRepository->getFollowingFeed($userId, $page, $limit);
        } else {
            $posts = $this->postRepository->getPublicFeed($userId, $page, $limit);
        }

        return array_map([$this, 'enriquecerComMedia'], $posts);
    }

    public function getUserPosts(string $userId, int $page, int $limit): array
    {
        $posts = $this->postRepository->getFeedByUser($userId, $page, $limit);
        return array_map([$this, 'enriquecerComMedia'], $posts);
    }

    public function getPostsDeUtilizador(
        string $authUserId,
        string $targetUserId,
        int    $page,
        int    $limit
    ): array {
        $podeVer = $this->postRepository->podeVerPosts($authUserId, $targetUserId);

        if (!$podeVer) {
            return [];
        }

        $posts = $this->postRepository->getFeedByUser($targetUserId, $page, $limit);
        return array_map([$this, 'enriquecerComMedia'], $posts);
    }

    // ============================================================
    // ENRIQUECER POST COM TUDO
    // ============================================================

    private function enriquecerComMedia(PostDTO $post): PostComMediaDTO
{
    $autor = $this->userRepository->findById($post->user_id);

    // Busca o array mas só usa o primeiro (ou null se não houver)
    $mediaArray = $this->mediaRepository->findByPost($post->id);
    $media      = $mediaArray[0] ?? null;

    $totalBazes        = $this->bazeRepository->countByPost($post->id);
    $totalComentarios  = $this->commentRepository->countByPost($post->id);

    return new PostComMediaDTO(
        id:                $post->id,
        user_id:           $post->user_id,
        autor_nome:        $autor?->nome          ?? "Utilizador removido",
        autor_username:    $autor?->username       ?? null,
        autor_foto_perfil: $autor?->foto_perfil    ?? null,
        conteudo:          $post->conteudo,
        eliminado:         $post->eliminado,
        criado_em:         $post->criado_em,
        atualizado_em:     $post->atualizado_em,
        total_bazes:       $totalBazes,
        total_comentarios: $totalComentarios,
        media:             $media
    );
}


private function apagarFicheiro(string $url): void
{

    $baseUrl = "http://localhost:8081/NzolaNet/backend/";
    $caminho = str_replace($baseUrl, "", $url);

    // __DIR__ aqui = C:\xampp\htdocs\NzolaNet\backend\services
    // subir um nível chega a C:\xampp\htdocs\NzolaNet\backend
    $raiz     = dirname(__DIR__);
    $ficheiro = $raiz . DIRECTORY_SEPARATOR . str_replace("/", DIRECTORY_SEPARATOR, $caminho);

    error_log("Raiz: " . $raiz);
    error_log("Caminho final: " . $ficheiro);
    error_log("Existe: " . (file_exists($ficheiro) ? "SIM" : "NAO"));

    if (file_exists($ficheiro)) {
        unlink($ficheiro);
        error_log("Apagado com sucesso");
    }
}

public function update(string $postId, PostDTO $dto): bool
{
    $post = $this->postRepository->findById($postId);

    if (!$post) {
        throw new Exception("Publicação não encontrada");
    }

    // Verificar se é o dono
    if ($post->user_id !== $dto->user_id) {
        throw new Exception("Não tens permissão para editar esta publicação");
    }

    return $this->postRepository->update($postId, $dto);
}

public function delete(string $postId, string $authUserId): bool
{
    $post = $this->postRepository->findById($postId);

    if (!$post) {
        throw new Exception("Publicação não encontrada");
    }

    // Verificar se é o dono
    if ($post->user_id !== $authUserId) {
        throw new Exception("Não tens permissão para eliminar esta publicação");
    }

    // Apagar media, bazes e comentários associados
    $mediaArray = $this->mediaRepository->findByPost($postId);
    if (!empty($mediaArray)) {
        $this->apagarFicheiro($mediaArray[0]->url);
        $this->mediaRepository->deleteByPost($postId);
    }

    $this->bazeRepository->deleteByPost($postId);
    $this->commentRepository->deleteByPost($postId);

    return $this->postRepository->delete($postId);
}

}