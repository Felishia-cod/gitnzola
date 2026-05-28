<?php

interface IPasswordResetService {

    public function requestReset(ForgotPasswordDTO $dto): bool;

    public function resetPassword(PasswordResetDTO $dto): bool;
}