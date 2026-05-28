<?php

interface IEmailVerificationService {

    public function verify(VerifyEmailDTO $dto): bool;
}