<?php

class EmailVerificationRepository implements IEmailVerificationRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(EmailVerificationToken $token): bool
    {
        $sql = "
            INSERT INTO email_verification_tokens (
                id,
                user_id,
                token_hash,
                expira_em,
                criado_em
            ) VALUES (
                :id,
                :user_id,
                :token_hash,
                :expira_em,
                :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id" => $token->id,
            ":user_id" => $token->user_id,
            ":token_hash" => $token->token_hash,
            ":expira_em" => $token->expira_em,
            ":criado_em" => $token->criado_em
        ]);
    }

    public function findByToken(string $tokenHash): ?EmailVerificationTokenDTO
    {
        $sql = "
            SELECT *
            FROM email_verification_tokens
            WHERE token_hash = :token_hash
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":token_hash" => $tokenHash]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new EmailVerificationTokenDTO(
            $data['id'],
            $data['user_id'],
            $data['token_hash'],
            $data['expira_em'],
            $data['criado_em']
        );
    }

    public function delete(string $tokenHash): bool
    {
        $sql = "
            DELETE FROM email_verification_tokens
            WHERE token_hash = :token_hash
        ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":token_hash" => $tokenHash]);
    }
}