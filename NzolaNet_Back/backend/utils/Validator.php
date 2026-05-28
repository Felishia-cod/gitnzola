<?php

class Validator {

    private $errors = [];

    // ============================================
    // OBRIGATÓRIO
    // ============================================

    public function required($value, $field) {

        if (empty(trim($value))) {
            $this->errors[$field] = "$field é obrigatório";
        }

        return $this;
    }

    // ============================================
    // MÍNIMO DE CARACTERES
    // ============================================

    public function min($value, $field, $min) {

        if (strlen(trim($value)) < $min) {
            $this->errors[$field] = "$field deve ter pelo menos $min caracteres";
        }

        return $this;
    }

    // ============================================
    // MÁXIMO DE CARACTERES
    // ============================================

    public function max($value, $field, $max) {

        if (strlen(trim($value)) > $max) {
            $this->errors[$field] = "$field deve ter no máximo $max caracteres";
        }

        return $this;
    }

    // ============================================
    // FORMATO DE EMAIL
    // ============================================

    public function email($value, $field) {

        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "$field inválido";
            return $this;
        }

        // Verifica se o domínio tem ponto
        $domain = explode('@', $value)[1];
        if (!str_contains($domain, '.')) {
            $this->errors[$field] = "$field inválido";
            return $this;
        }

        // Bloquear emails temporários
        $blockedDomains = [
            'mailinator.com',
            'tempmail.com',
            'guerrillamail.com',
            'throwaway.email',
            'fakeinbox.com',
            'yopmail.com',
            'sharklasers.com',
            'trashmail.com'
        ];

        if (in_array(strtolower($domain), $blockedDomains)) {
            $this->errors[$field] = "Emails temporários não são permitidos";
        }

        return $this;
    }

    // ============================================
    // USERNAME
    // ============================================

    public function username($value, $field) {

        // Só letras, números, pontos e underscores
        if (!preg_match('/^[a-zA-Z0-9._]+$/', $value)) {
            $this->errors[$field] = "$field só pode ter letras, números, pontos e underscores";
            return $this;
        }

        // Não pode começar com ponto ou underscore
        if (preg_match('/^[._]/', $value)) {
            $this->errors[$field] = "$field não pode começar com ponto ou underscore";
            return $this;
        }

        // Não pode terminar com ponto ou underscore
        if (preg_match('/[._]$/', $value)) {
            $this->errors[$field] = "$field não pode terminar com ponto ou underscore";
            return $this;
        }

        // Não pode ter dois pontos ou underscores seguidos
        if (preg_match('/[_.]{2,}/', $value)) {
            $this->errors[$field] = "$field não pode ter dois pontos ou underscores seguidos";
            return $this;
        }

        // Não pode ser só números
        if (preg_match('/^[0-9]+$/', $value)) {
            $this->errors[$field] = "$field não pode ser só números";
            return $this;
        }

        return $this;
    }

    // ============================================
    // NOME (só letras e espaços)
    // ============================================

    public function nome($value, $field) {

        if (!preg_match('/^[\p{L} ]+$/u', $value)) {
            $this->errors[$field] = "$field só pode ter letras e espaços";
        }

        return $this;
    }

    // ============================================
    // PASSWORD FORTE
    // ============================================

    public function password($value, $field) {

        // Pelo menos 1 letra maiúscula
        if (!preg_match('/[A-Z]/', $value)) {
            $this->errors[$field] = "$field deve ter pelo menos 1 letra maiúscula";
            return $this;
        }

        // Pelo menos 1 letra minúscula
        if (!preg_match('/[a-z]/', $value)) {
            $this->errors[$field] = "$field deve ter pelo menos 1 letra minúscula";
            return $this;
        }

        // Pelo menos 1 número
        if (!preg_match('/[0-9]/', $value)) {
            $this->errors[$field] = "$field deve ter pelo menos 1 número";
            return $this;
        }

        // Pelo menos 1 caractere especial
        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':\"\\|,.<>\/?]/', $value)) {
            $this->errors[$field] = "$field deve ter pelo menos 1 caractere especial (!@#\$...)";
            return $this;
        }

        // Passwords proibidas
        $forbiddenPasswords = [
            '12345678',
            'password',
            'password1',
            '123456789',
            'qwerty123',
            'iloveyou',
            'admin123',
            '12345678!'
        ];

        if (in_array(strtolower($value), $forbiddenPasswords)) {
            $this->errors[$field] = "$field é demasiado comum, escolhe outra";
        }

        return $this;
    }

    // ============================================
    // PASSWORD NÃO PODE SER IGUAL AO USERNAME
    // ============================================

    public function passwordNotEqualTo($password, $field, $otherValue, $otherField) {

        if (strtolower($password) === strtolower($otherValue)) {
            $this->errors[$field] = "$field não pode ser igual ao $otherField";
        }

        return $this;
    }

    // ============================================
    // SANITIZAÇÃO — remove HTML e scripts
    // ============================================

    public static function sanitize($value) {
        return htmlspecialchars(strip_tags(trim($value)));
    }

    // ============================================
    // VERIFICAR SE TEM ERROS
    // ============================================

    public function fails() {
        return !empty($this->errors);
    }

    // ============================================
    // DEVOLVER ERROS
    // ============================================

    public function errors() {
        return $this->errors;
    }
}