<?php

class SessionRepository implements ISessionRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function createSession(Session $session): bool
    {
        $sql = "
            INSERT INTO sessions (
                id,
                user_id,
                token_hash,
                ip,
                user_agent,
                expira_em,
                criado_em,
                logout_em
            ) VALUES (
                :id,
                :user_id,
                :token_hash,
                :ip,
                :user_agent,
                :expira_em,
                :criado_em,
                :logout_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id" => $session->id,
            ":user_id" => $session->user_id,
            ":token_hash" => $session->token_hash,
            ":ip" => $session->ip,
            ":user_agent" => $session->user_agent,
            ":expira_em" => $session->expira_em,
            ":criado_em" => $session->criado_em,
            ":logout_em" => $session->logout_em
        ]);
    }

    public function findByToken(string $tokenHash): ?SessionDTO
    {
        $sql = "
            SELECT *
            FROM sessions
            WHERE token_hash = :token_hash
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":token_hash" => $tokenHash]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new SessionDTO(
            $data['id'],
            $data['user_id'],
            $data['token_hash'],
            $data['ip'] ?? null,
            $data['user_agent'] ?? null,
            $data['expira_em'],
            $data['criado_em'],
            $data['logout_em'] ?? null
        );
    }

    public function deleteSession(string $tokenHash): bool
    {
        $sql = "
            UPDATE sessions
            SET logout_em = NOW()
            WHERE token_hash = :token_hash
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":token_hash" => $tokenHash
        ]);
    }

    public function deleteAllByUserId(string $userId): bool
    {
        $sql = "
            UPDATE sessions
            SET logout_em = NOW()
            WHERE user_id = :user_id
            AND logout_em IS NULL
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":user_id" => $userId
        ]);
    }
}