<?php

class BaseController
{
    protected function json($data, int $status = 200)
    {
        http_response_code($status);
        header("Content-Type: application/json");
        echo json_encode($data);
        exit;
    }
}