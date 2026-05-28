<?php

class MessageController extends BaseController
{
    private IMessageService $service;

    public function __construct(IMessageService $service)
    {
        $this->service = $service;
    }

    public function sendMessage($senderId, $dto)
    {
        return $this->json(
            $this->service->sendMessage($senderId, $dto)
        );
    }

    public function getByConversation($conversationId, $page, $limit)
    {
        return $this->json(
            $this->service->getByConversation($conversationId, $page, $limit)
        );
    }

    public function delete($messageId)
    {
        return $this->json(
            $this->service->delete($messageId)
        );
    }
}