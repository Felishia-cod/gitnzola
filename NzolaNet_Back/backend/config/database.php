<?php

class Database {

    private $host     = "ep-falling-sun-altskvc5-pooler.c-3.eu-central-1.aws.neon.tech";
    private $db_name  = "nzolanet";
    private $username = "neondb_owner";
    private $password = "npg_MuN8ZUpH2ztW";
    private $port     = "5432";

    public $conn = null;

    public function connect() {

        // evita reconectar
        if ($this->conn instanceof PDO) {
            return $this->conn;
        }

        try {

            $dsn =
                "pgsql:host={$this->host};" .
                "port={$this->port};" .
                "dbname={$this->db_name};" .
                "sslmode=require;" .
                "options=endpoint=ep-falling-sun-altskvc5";

            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_PERSISTENT => true
                ]
            );

            return $this->conn;

        } catch (PDOException $e) {

            die("Erro na conexão: " . $e->getMessage());
        }
    }
}