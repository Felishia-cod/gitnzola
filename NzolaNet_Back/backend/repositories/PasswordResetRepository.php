<?php

class PasswordResetRepository implements IPasswordResetRepository
{
    private $conn;

    public function __construct($database)
    {
        $this->conn = $database;
    }

    public function create(PasswordResetToken $token): bool
    {
        $sql = "
            INSERT INTO password_reset_tokens (
                id,
                user_id,
                token_hash,
                expira_em,
                usado,
                criado_em
            ) VALUES (
                :id,
                :user_id,
                :token_hash,
                :expira_em,
                false,
                :criado_em
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ":id"         => $token->id,
            ":user_id"    => $token->user_id,
            ":token_hash" => $token->token_hash,
            ":expira_em"  => $token->expira_em,
            ":criado_em"  => $token->criado_em
        ]);
    }

    /**
     * Devolve PasswordResetTokenDTO (com user_id, expira_em, usado)
     * para que o service consiga validar e fazer o reset.
     */
    public function findByToken(string $tokenHash): ?PasswordResetTokenDTO
    {
        $sql = "
            SELECT *
            FROM password_reset_tokens
            WHERE token_hash = :token_hash
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":token_hash" => $tokenHash]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new PasswordResetTokenDTO(
            id:         $data['id'],
            user_id:    $data['user_id'],
            token_hash: $data['token_hash'],
            expira_em:  $data['expira_em'],
            usado:      (bool) $data['usado'],
            criado_em:  $data['criado_em']
        );
    }

    public function markAsUsed(string $tokenHash): bool
    {
        $sql = "
            UPDATE password_reset_tokens
            SET usado = true
            WHERE token_hash = :token_hash
        ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":token_hash" => $tokenHash]);
    }

    public function deleteByUserId(string $userId): bool
    {
        $sql = "
            DELETE FROM password_reset_tokens
            WHERE user_id = :user_id
        ";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([":user_id" => $userId]);
    }
}
